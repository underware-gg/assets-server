import { RpcProvider, Contract, shortString, BigNumberish } from 'starknet';
import { makeRpcProvider } from '@/utils/starknet';
import { feltToString } from '@underware/pistols-sdk/starknet';
import abi from './controller_abi.json'

export type ControllerVerifyParams = {
  address: string,
  chainId: string,
  messageHash: BigNumberish,
  signature: BigNumberish[],
}

export async function verify_message(params: ControllerVerifyParams): Promise<boolean> {
  const provider: RpcProvider = makeRpcProvider(params.chainId);
  const contract = new Contract({
    abi,
    address: params.address,
    providerOrAccount: provider,
  });
  const res = await contract.is_valid_signature(params.messageHash, params.signature);
  const verified = (feltToString(res) === "VALID");
  // console.log(`[verify_message]`, feltToString(res), res, stringToFelt("VALID"), verified)
  return verified;
}
