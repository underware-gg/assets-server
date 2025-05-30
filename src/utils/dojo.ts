import { getNodeUrl } from '@/utils/starknet';
import { DojoProvider } from '@dojoengine/core';
import { ChainId, getManifest } from '@underware/pistols-sdk/pistols/config';

export function getDojoProvider(chainId: ChainId): DojoProvider {
  const manifest = getManifest({ chainId });
  const nodeUrl = getNodeUrl(chainId);
  return new DojoProvider(manifest, nodeUrl)
}
