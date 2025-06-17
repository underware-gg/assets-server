import { Account } from 'starknet';
import { getCartridgeRpcUrl } from '@/utils/starknet';
import { DojoProvider } from '@dojoengine/core';
import { ChainId, NetworkId, getManifest, DojoNetworkConfig, getNetworkConfig } from "@underware/pistols-sdk/pistols/config";
import { contracts } from '@underware/pistols-sdk/pistols/gen';
import { makeStarknetAccount } from '@/utils/starknet';
import * as ENV from './env';

//--------------------------------
// network config
//
export const getConfig = (chainId: ChainId): DojoNetworkConfig => {
  if (chainId === ChainId.SN_SEPOLIA) {
    return getNetworkConfig(NetworkId.SEPOLIA);
  }
  return getNetworkConfig(NetworkId.MAINNET, ENV);
}

//--------------------------------
// dojo provider
//
export function makeDojoProvider(chainId: ChainId) {
  const manifest = getManifest({ chainId });
  const nodeUrl = getCartridgeRpcUrl(chainId);
  const dojoProvider = new DojoProvider(manifest, nodeUrl)
  const account: Account = makeStarknetAccount(dojoProvider.provider);
  const world = contracts.setupWorld(dojoProvider);
  return {
    dojoProvider,
    account,
    world,
  }
}
