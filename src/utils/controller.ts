import { BigNumberish } from 'starknet'
import { lookupAddresses } from '@cartridge/controller'
import { bigintToHex, capitalize } from '@underware/pistols-sdk/utils'

export async function getControllerUsername(owner: BigNumberish) {
  const _owner = bigintToHex(owner)
  const addresses = await lookupAddresses([_owner])
  return capitalize(addresses.get(_owner) || '')
}
