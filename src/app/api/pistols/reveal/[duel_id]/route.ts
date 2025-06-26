import { NextRequest, NextResponse } from "next/server";
import { BigNumberish, StarknetDomain, TypedData } from "starknet";
import { ChainId, CommitMoveMessage, DojoNetworkConfig, makeStarknetDomain } from "@underware/pistols-sdk/pistols/config";
import { createTypedMessage, getMessageHash, getTypeHash } from "@underware/pistols-sdk/starknet";
import { ChallengeRevealResponse, getChallengeReveal } from "@/pistols/queries/getChallengeReveal";
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
  reveal_a?: DuelistReveal,
  reveal_b?: DuelistReveal,
  error?: string,
}
export type DuelistReveal = {
  revealed: boolean,
  salt?: BigNumberish,
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
  // 1. validate Challenge state
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
  // 2. get duel deck
  let deck: number[][];
  try {
    deck = await get_duel_deck(chainId, duelId);
  } catch (error) {
    console.error(`[pistols/reveal] get_duel_deck() error:`, duelId, error);
    return _returnError(`Duel [${duelId}] get_duel_deck() error:`, error as Error);
  }


  // prepare response
  const response: PistolsRevealResponse = {
    reveal_a: { revealed: false },
    reveal_b: { revealed: false },
  };

  //
  // 3. find revealing players
  if (ch.saltA == 0n) {
    const reveal_a = await _reveal_move(chainId, duelId, ch.addressA, ch.duelistIdA, ch.hashedA, deck);
    if (reveal_a instanceof NextResponse) {
      return reveal_a as NextResponse;
    }
    response.reveal_a = reveal_a as DuelistReveal;
  }
  if (ch.saltB == 0n) {
    const reveal_b = await _reveal_move(chainId, duelId, ch.addressB, ch.duelistIdB, ch.hashedB, deck);
    if (reveal_b instanceof NextResponse) {
      return reveal_b as NextResponse;
    }
    response.reveal_b = reveal_b as DuelistReveal;
  }

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


const _reveal_move = async (chainId: ChainId, duelId: bigint, address: bigint, duelistId: bigint, movesHash: bigint, deck: number[][]): Promise<NextResponse | DuelistReveal> => {

  //
  // 4. generate message hash
  const messages: CommitMoveMessage = {
    duelId: duelId,
    duelistId: duelistId,
  }
  const starknetDomain: StarknetDomain = makeStarknetDomain({ chainId });
  const typedMessage: TypedData = createTypedMessage({ starknetDomain, messages })
  const messageHash: string = getMessageHash(typedMessage, address)

  //
  // 5. generate salt
  const salt: bigint | null = generate_salt(address, messageHash);
  if (!salt) {
    return _returnError(`Duel [${duelId}] salt generation error`);
  }
  console.log(`[pistols/reveal] SALT:`, bigintToHex(address), bigintToHex(duelId), bigintToHex(duelistId), bigintToHex(salt));

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

  return {
    salt,
    revealed,
  };
}

