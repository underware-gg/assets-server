import { BigNumberish } from 'starknet';
import { DojoNetworkConfig } from '@underware/pistols-sdk/pistols/config';
import { bigintToAddress, bigintToHex128, queryToriiSql } from '@underware/pistols-sdk/utils';
import { constants } from '@underware/pistols-sdk/pistols/gen';

type ChallengeRevealResponseRaw = Array<{
  duel_id: string;
  duel_type: string;
  challenge_state: string;
  address_a: string;
  address_b: string;
  duelist_id_a: string;
  duelist_id_b: string;
  round_state: string;
  hashed_a: string;
  hashed_b: string;
  salt_a: string;
  salt_b: string;
}>;
// format we need
export type ChallengeRevealResponse = {
  duelId: bigint;
  duelType: constants.DuelType;
  challengeState: constants.ChallengeState;
  addressA: bigint;
  addressB: bigint;
  duelistIdA: bigint;
  duelistIdB: bigint;
  roundState: constants.RoundState;
  hashedA: bigint;
  hashedB: bigint;
  saltA: bigint;
  saltB: bigint;
};
function formatFn(rows: ChallengeRevealResponseRaw): ChallengeRevealResponse | null {
  return rows.length > 0 ? {
    duelId: BigInt(rows[0].duel_id),
    duelType: rows[0].duel_type as constants.DuelType,
    challengeState: rows[0].challenge_state as constants.ChallengeState,
    addressA: BigInt(rows[0].address_a),
    addressB: BigInt(rows[0].address_b),
    duelistIdA: BigInt(rows[0].duelist_id_a),
    duelistIdB: BigInt(rows[0].duelist_id_b),
    roundState: rows[0].round_state as constants.RoundState,
    hashedA: BigInt(rows[0].hashed_a),
    hashedB: BigInt(rows[0].hashed_b),
    saltA: BigInt(rows[0].salt_a),
    saltB: BigInt(rows[0].salt_b),
  } : null;
}

export const getChallengeReveal = async (config: DojoNetworkConfig, duelId: BigNumberish): Promise<ChallengeRevealResponse | null> => {
  const query = `
select
C.duel_id as duel_id,
C.duel_type as duel_type,
C.state as challenge_state,
C.address_a as address_a,
C.address_b as address_b,
C.duelist_id_a as duelist_id_a,
C.duelist_id_b as duelist_id_b,
R.state as round_state,
R."moves_a.hashed" as hashed_a,
R."moves_b.hashed" as hashed_b,
R."moves_a.salt" as salt_a,
R."moves_b.salt" as salt_b
from "pistols-Challenge" C, "pistols-Round" R
where C.duel_id = "${bigintToHex128(duelId)}"
and C.duel_id = R.duel_id
`;
  // console.log(`getChallengeReveal(${duelId}):`, query);
  const response = await queryToriiSql(config.sqlUrl, query, formatFn);
  // console.log(`getChallengeReveal(${duelId}):`, response);
  return response;
};
