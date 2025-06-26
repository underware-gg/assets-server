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
  reveal_a?: DuelistReveal | boolean,
  reveal_b?: DuelistReveal | boolean,
  error?: string,
}
export type DuelistReveal = {
  revealed: boolean,
  duelistId: bigint,
  salt: BigNumberish,
  moves: number[],
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

  //
  // 3. restore moves for revealing players
  let reveal_a: DuelistReveal | undefined;
  let reveal_b: DuelistReveal  | undefined;
  if (ch.saltA == 0n) {
    const moves_a: DuelistReveal | NextResponse = _restore_moves(chainId, duelId, ch.addressA, ch.duelistIdA, ch.hashedA, deck);
    if (moves_a instanceof NextResponse) {
      return moves_a as NextResponse;
    }
    reveal_a = moves_a as DuelistReveal;
  }
  if (ch.saltB == 0n) {
    const moves_b: DuelistReveal | NextResponse = _restore_moves(chainId, duelId, ch.addressB, ch.duelistIdB, ch.hashedB, deck);
    if (moves_b instanceof NextResponse) {
      return moves_b as NextResponse;
    }
    reveal_b = moves_b as DuelistReveal;
  }


  // 7. reveal moves
  if ((reveal_a?.revealed || reveal_b?.revealed) && process.env.REVEAL_DUELS_ONCHAIN === 'true') {
    try {
      await reveal_moves(chainId, duelId, [reveal_a, reveal_b].filter(Boolean) as DuelistReveal[]);
    } catch (error) {
      console.error(`[pistols/reveal] reveal_moves() error:`, duelId, reveal_a, reveal_b, error);
      return _returnError(`Duel [${duelId}] reveal_moves() error:`, error as Error);
    }
  }

  // prepare response
  const response: PistolsRevealResponse = {
    reveal_a: reveal_a ?? false,
    reveal_b: reveal_b ?? false,
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


const _restore_moves = (chainId: ChainId, duelId: bigint, address: bigint, duelistId: bigint, movesHash: bigint, deck: number[][]): NextResponse | DuelistReveal => {

  //
  // 1. generate message hash
  const messages: CommitMoveMessage = {
    duelId: duelId,
    duelistId: duelistId,
  }
  const starknetDomain: StarknetDomain = makeStarknetDomain({ chainId });
  const typedMessage: TypedData = createTypedMessage({ starknetDomain, messages })
  const messageHash: string = getMessageHash(typedMessage, address)

  //
  // 2. generate salt
  const salt: bigint | null = generate_salt(address, messageHash);
  if (!salt) {
    return _returnError(`Duel [${duelId}] salt generation error`);
  }
  console.log(`[pistols/reveal] SALT:`, bigintToHex(address), bigintToHex(duelId), bigintToHex(duelistId), bigintToHex(salt));

  //
  // 3. restore moves
  const moves: number[] = restoreMovesFromHash(salt, movesHash, deck);
  console.log(`[pistols/reveal] moves:`, moves);
  if (moves.length == 0) {
    return _returnError(`Duel [${duelId}] unable to restore moves`);
  }

  // optimistic, if we must reveal
  const revealed = (process.env.REVEAL_DUELS_ONCHAIN === 'true');

  return {
    revealed,
    duelistId,
    salt,
    moves,
  };
}

