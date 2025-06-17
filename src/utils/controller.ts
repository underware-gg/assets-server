import { RpcProvider, Contract, shortString, BigNumberish } from 'starknet';
import { makeRpcProvider } from '@/utils/starknet';
import abi from './controller_abi.json'

export type ControllerVerifyParams = {
  address: string,
  chainId: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
}

export async function verify_message(params: ControllerVerifyParams): Promise<boolean> {
  const provider: RpcProvider = makeRpcProvider(params.chainId);
  const contract = new Contract(abi, params.address, provider);
  const res = await contract.is_valid_signature(params.messageHash, params.signature);
  const verified = (shortString.decodeShortString(res) === "VALID");
  // console.log(`[verify_message]`, shortString.decodeShortString(res), res, shortString.encodeShortString("VALID"), verified)
  return verified;
}
