import { NextRequest, NextResponse } from "next/server";
import { RpcProvider, Contract, shortString, BigNumberish } from 'starknet';
import abi from './abi.json'

export function rpcProvider(chainId: string): RpcProvider {
  let nodeUrl = '';
  if (chainId === 'SN_MAIN') {
    nodeUrl = 'https://api.cartridge.gg/x/starknet/mainnet'
  } else if (chainId === 'SN_SEPOLIA') {
    nodeUrl = 'https://api.cartridge.gg/x/starknet/sepolia'
  } else if (chainId === 'KATANA_LOCAL') {
    nodeUrl = 'http://127.0.0.1:5050'
  } else {
    throw new Error('Invalid chainId')
  }
  const provider = new RpcProvider({ nodeUrl });
  return provider;
}

export type ControllerVerifyParams = {
  address: string,
  chainId: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
}

export async function verify_message(params: ControllerVerifyParams): Promise<boolean> {
  const provider = rpcProvider(params.chainId);
  const contract = new Contract(abi, params.address, provider);
  const res = await contract.is_valid_signature(params.messageHash, params.signature);
  const verified = (shortString.decodeShortString(res) === "VALID");
  // console.log(`[verify_message]`, shortString.decodeShortString(res), res, shortString.encodeShortString("VALID"), verified)
  return verified;
}
