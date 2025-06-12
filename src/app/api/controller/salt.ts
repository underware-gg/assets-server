import { BigNumberish } from 'starknet';
import { isPositiveBigint } from "@underware/pistols-sdk/utils";
import { poseidon } from "@underware/pistols-sdk/starknet";

export function generate_salt(address: BigNumberish, messageHash: BigNumberish): bigint | null {
  let result: bigint | null = null;
  if (isPositiveBigint(address) && isPositiveBigint(messageHash) && (process.env.SALT_PRIVATE_KEY)) {
    result =
      poseidon([
        address,
        messageHash,
        process.env.SALT_PRIVATE_KEY,
      ]);
  }
  return result;
}
