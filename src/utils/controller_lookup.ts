import { BigNumberish } from 'starknet'
import { lookupAddresses } from '@cartridge/controller'
import { CHARACTER_NAMES } from '@underware/pistols-sdk/pistols/constants'
import { bigintEquals, bigintToHex } from '@underware/pistols-sdk/utils'

export async function getControllerUsername(owner: BigNumberish) {
  // check if owner is a character
  let result = CHARACTER_NAMES[Object.keys(CHARACTER_NAMES).find(key => bigintEquals(owner, key)) ?? ''];
  // if not, lookup address
  if (!result ) {
    const _owner = bigintToHex(owner);
    const addresses = await lookupAddresses([_owner]);
    result = addresses.get(_owner) || '';
  }
  return result;
}
