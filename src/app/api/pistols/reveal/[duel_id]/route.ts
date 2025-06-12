import { NextRequest, NextResponse } from "next/server";
import { BigNumberish, StarknetDomain, TypedData } from "starknet";
import { ChainId, CommitMoveMessage, DojoNetworkConfig, makeStarknetDomain } from "@underware/pistols-sdk/pistols/config";
import { createTypedMessage, getMessageHash, getTypeHash } from "@underware/pistols-sdk/starknet";
import { getChallengeReveal } from "@/pistols/queries/getChallengeReveal";
import { getConfig } from "@/pistols/config";
import { generate_salt } from "@/app/api/controller/salt";
import { _returnError } from "@/app/api/_error";
import { bigintToHex } from "@underware/pistols-sdk/utils";
import { get_duel_deck, reveal_moves } from "@/pistols/contractCalls";
import { restoreMovesFromHash } from "@underware/pistols-sdk/pistols";

//
// reveal last player's moves in a duel
// duel must be in Reveal state
// duel must be revelaed by one player at least
//
// examples: Reveal duel 1313
// http://assets.underware.gg/pistols/reveal/1313
// http://assets.underware.gg/pistols/reveal/1313?chain_id=SN_SEPOLIA
//

export type PistolsRevealSlugs = {
  duel_id: string,
}

export type PistolsRevealResponse = {
  salt?: BigNumberish,
  revealed?: boolean,
  error?: string,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PistolsRevealSlugs> }
) {
  // route slug
  const { duel_id } = await params;
  // url params
  const searchParams = request.nextUrl.searchParams
  // all params
  const duelId: bigint = BigInt(duel_id);
  const chainId: ChainId = searchParams.get('chain_id') as ChainId || ChainId.SN_MAIN;
  console.log(`[pistols/reveal] params:`, duelId, chainId)

  //
  // 1. get Challenge
  const config: DojoNetworkConfig = getConfig(chainId);
  const ch = await getChallengeReveal(config, duelId);
  if (!ch) {
    return _returnError(`Duel [${duelId}] not found`);
  }
  if (ch.challengeState !== 'InProgress') {
    return _returnError(`Duel [${duelId}] is [${ch.challengeState}], not [InProgress]`);
  }
  if (ch.roundState !== 'Reveal') {
    return _returnError(`Duel [${duelId}] round is [${ch.roundState}], not [Reveal]`);
  }

  //
  // 2. find revealing player
  let address: bigint;
  let duelistId: bigint;
  let movesHash: bigint;
  if (ch.saltA == 0n && ch.saltB == 0n) {
    return _returnError(`Duel [${duelId}] is not revealed by any player`);
  }
  if (ch.saltA == 0n) {
    address = ch.addressA;
    duelistId = ch.duelistIdA;
    movesHash = ch.hashedA;
  } else if (ch.saltB == 0n) {
    address = ch.addressB;
    duelistId = ch.duelistIdB;
    movesHash = ch.hashedB;
  } else {
    return _returnError(`Duel [${duelId}] is revealed by both players`);
  }

  //
  // 3. generate message hash
  const messages: CommitMoveMessage = {
    duelId: ch.duelId,
    duelistId: duelistId,
  }
  const starknetDomain: StarknetDomain = makeStarknetDomain({ chainId });
  const typedMessage: TypedData = createTypedMessage({ starknetDomain, messages })
  const messageHash: string = getMessageHash(typedMessage, address)

  //
  // 4. generate salt
  const salt: bigint | null = generate_salt(address, messageHash);
  if (!salt) {
    return _returnError(`Duel [${duelId}] salt generation error`);
  }
  console.log(`[pistols/reveal] SALT:`, bigintToHex(address), bigintToHex(duelId), bigintToHex(duelistId), bigintToHex(salt));

  //
  // 5. get duel deck
  let deck: number[][];
  try {
    deck = await get_duel_deck(chainId, duelId);
  } catch (error) {
    console.error(`[pistols/reveal] get_duel_deck() error:`, duelId, error);
    return _returnError(`Duel [${duelId}] get_duel_deck() error:`, error as Error);
  }

  //
  // 6. restore moves
  const moves: number[] = restoreMovesFromHash(salt, movesHash, deck);
  console.log(`[pistols/reveal] moves:`, moves);
  if (moves.length == 0) {
    return _returnError(`Duel [${duelId}] unable to restore moves`);
  }

  // 7. reveal moves
  let revealed = false;
  if (process.env.REVEAL_DUELS_ONCHAIN === 'true') {
    try {
      await reveal_moves(chainId, duelId, duelistId, salt, moves);
      revealed = true;
    } catch (error) {
      console.error(`[pistols/reveal] reveal_moves() error:`, duelId, error);
      return _returnError(`Duel [${duelId}] reveal_moves() error:`, error as Error);
    }
  }

  //
  // 8. return salt and revealed status
  const response: PistolsRevealResponse = {
    salt: salt ? bigintToHex(salt) : '0x0',
    revealed,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
