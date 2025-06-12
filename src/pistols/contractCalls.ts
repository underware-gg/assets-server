import { BigNumberish, CairoCustomEnum, UniversalDetails } from 'starknet';
import { DojoCall } from '@dojoengine/core';
import { makeCustomEnum } from '@underware/pistols-sdk/starknet';
import { constants } from '@underware/pistols-sdk/pistols/gen';
import { ChainId, NAMESPACE } from '@underware/pistols-sdk/pistols/config';
import { makeDojoProvider } from '@/pistols/config';

//--------------------------------
// read calls
//
export async function get_duel_deck(
  chainId: ChainId,
  duelId: bigint,
): Promise<number[][]> {
  const { world } = makeDojoProvider(chainId);
  const result = await world.game.getDuelDeck(duelId);
  // console.log(`[get_duel_deck] result:`, result);
  return result as number[][];
}


//--------------------------------
// write calls
//
const _details: UniversalDetails = {
  version: 3,
}
export async function emit_player_social_link(
  chainId: ChainId,
  socialPlatform: constants.SocialPlatform,
  playerAddress: string,
  userName: string,
  userId: string,
  avatar: string,
): Promise<boolean> {
  const { dojoProvider, account, world } = makeDojoProvider(chainId);
  const calls: DojoCall[] = [
    world.game.buildEmitPlayerSocialLinkCalldata(
      makeCustomEnum(socialPlatform) as CairoCustomEnum,
      playerAddress,
      userName,
      userId,
      avatar,
    ),
  ]
  const tx = await dojoProvider.execute(account, calls, NAMESPACE, _details);
  // console.log(`[emit_player_social_link] tx:`, tx);
  const _receipt = await account.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
  // console.log(`[emit_player_social_link] receipt:`, _receipt);
  return true;
}

export async function reveal_moves(
  chainId: ChainId,
  duelistId: BigNumberish,
  duelId: BigNumberish,
  salt: BigNumberish,
  moves: number[],
): Promise<boolean> {
  const { dojoProvider, account, world } = makeDojoProvider(chainId);
  const calls: DojoCall[] = [
    world.game.buildRevealMovesCalldata(
      duelId,
      duelistId,
      salt,
      moves,
    ),
  ]
  const tx = await dojoProvider.execute(account, calls, NAMESPACE, _details);
  // console.log(`[reveal_moves] tx:`, tx);
  const _receipt = await account.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
  // console.log(`[reveal_moves] receipt:`, _receipt);
  return true;
}
