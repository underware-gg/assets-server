import { BigNumberish } from 'starknet';
import { bigintToHex, isPositiveBigint } from "@underware/pistols-sdk/utils";
import { poseidon } from "@underware/pistols-sdk/starknet";

export function generate_salt(address: BigNumberish, messageHash: BigNumberish): string | null {
  let result: string | null = null;
  if (isPositiveBigint(address) && isPositiveBigint(messageHash) && (process.env.SALT_PRIVATE_KEY)) {
    result = bigintToHex(
      poseidon([
        address,
        messageHash,
        process.env.SALT_PRIVATE_KEY,
      ])
    );
  }
  return result;
}
