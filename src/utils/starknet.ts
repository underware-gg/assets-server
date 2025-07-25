import { Account, AccountInterface, constants, RpcProvider } from 'starknet';
import * as ENV from '@/pistols/env';

export function getCartridgeRpcUrl(chainId: string): string {
  let nodeUrl = '';
  if (chainId === 'SN_MAIN') {
    nodeUrl = ENV.RPC_URL || 'https://api.cartridge.gg/x/starknet/mainnet'
  } else if (chainId === 'SN_SEPOLIA') {
    nodeUrl = 'https://api.cartridge.gg/x/starknet/sepolia'
    // nodeUrl = 'https://api.cartridge.gg/x/starknet/sepolia/rpc/v7_0'
    // nodeUrl = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7'
  } else if (chainId === 'KATANA_LOCAL') {
    nodeUrl = 'http://127.0.0.1:5050'
  } else {
    throw new Error('Invalid chainId')
  }
  // console.log(`[getCartridgeRpcUrl] nodeUrl:`, nodeUrl);
  return nodeUrl;
}

export function makeRpcProvider(chainId: string): RpcProvider {
  const nodeUrl = getCartridgeRpcUrl(chainId);
  return new RpcProvider({ nodeUrl });
}

export function makeStarknetAccount(rpcProvider: RpcProvider): Account {
  if (!process.env.STARKNET_ACCOUNT) throw new Error('Missing STARKNET_ACCOUNT');
  if (!process.env.STARKNET_KEY) throw new Error('Missing STARKNET_KEY');
  return new Account(
    rpcProvider,
    process.env.STARKNET_ACCOUNT!,
    process.env.STARKNET_KEY!,
    undefined,
    constants.TRANSACTION_VERSION.V3,
  );
}
