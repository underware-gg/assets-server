import { Account, CairoCustomEnum, Call, UniversalDetails } from 'starknet';
import { DojoCall, DojoProvider } from '@dojoengine/core';
import { makeCustomEnum } from '@underware/pistols-sdk/starknet';
import { contracts, constants } from '@underware/pistols-sdk/pistols/gen';
import { ChainId, NAMESPACE } from '@underware/pistols-sdk/pistols/config';
import { getAccount } from '@/utils/starknet';
import { getDojoProvider } from '@/utils/dojo';

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
  const dojoProvider: DojoProvider = getDojoProvider(chainId);
  const account: Account = getAccount(dojoProvider.provider);
  const world = contracts.setupWorld(dojoProvider);

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
  const receipt = await account.waitForTransaction(tx.transaction_hash, { retryInterval: 200 })
  // console.log(`[emit_player_social_link] receipt:`, receipt);

  return true;
}


