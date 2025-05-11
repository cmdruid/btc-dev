import { AddressEncoder } from './encode.js'

import type {
  AddressInfo,
  AddressTableEntry,
  AddressType,
  ChainNetwork
} from '../types/address.js'

const ENCODING_TABLE : AddressTableEntry[] = [
  [ '1',      'p2pkh',   'main',    20, 'base58',  0x00 ],
  [ '3',      'p2sh',    'main',    20, 'base58',  0x05 ],
  [ 'm',      'p2pkh',   'testnet', 20, 'base58',  0x6F ],
  [ 'n',      'p2pkh',   'testnet', 20, 'base58',  0x6F ],
  [ '2',      'p2sh',    'testnet', 20, 'base58',  0xC4 ],
  [ 'bc1q',   'p2w-pkh', 'main',    20, 'bech32',  0    ],
  [ 'tb1q',   'p2w-pkh', 'testnet', 20, 'bech32',  0    ],
  [ 'bcrt1q', 'p2w-pkh', 'regtest', 20, 'bech32',  0    ],
  [ 'bc1q',   'p2w-sh',  'main',    32, 'bech32',  0    ],
  [ 'tb1q',   'p2w-sh',  'testnet', 32, 'bech32',  0    ],
  [ 'bcrt1q', 'p2w-sh',  'regtest', 32, 'bech32',  0    ],
  [ 'bc1p',   'p2tr',    'main',    32, 'bech32m', 1    ],
  [ 'tb1p',   'p2tr',    'testnet', 32, 'bech32m', 1    ],
  [ 'bcrt1p', 'p2tr',    'regtest', 32, 'bech32m', 1    ]
]

export namespace AddressTool {
  export const TABLE  = ENCODING_TABLE
  export const detect = lookup_by_address_data
  export const lookup = lookup_by_address_type
  export const check  = check_address
  export const verify = verify_address
  export const assert = assert_address
}

/**
 * Get the encoding information for a given address.
 * 
 * @param address - The address to get information for.
 * @returns The encoding information, or null if the address is not recognized.
 */
function lookup_by_address_data (address : string) : AddressInfo | null {
  for (const [ prefix, type, network, size, format, version ] of ENCODING_TABLE) {
    if (address.startsWith(prefix)) {
      return { type, prefix, network, size, format, version }
    }
  }
  return null
}

/**
 * Lookup an address by its type and network.
 * 
 * @param address_network - The network of the address.
 * @param address_type    - The type of the address.
 * @returns The address information, or null if the address is not recognized.
 */
function lookup_by_address_type (
  address_network : ChainNetwork,
  address_type    : AddressType
) : AddressInfo | null {
  for (const [ prefix, type, network, size, format, version ] of ENCODING_TABLE) {
    if (type === address_type && network === address_network) {
      return { type, prefix, network, size, format, version }
    }
  }
  return null
}

function check_address (address : string) : string | null {
  // Detect the address type.
  const info = lookup_by_address_data(address)
  // If the address type is not detected, return an error.
  if (info === null) {
    return 'unable to detect address type'
  }
  // Check the address encoding.
  const encoding = AddressEncoder.get_type(address)
  // If the address encoding is invalid, return an error.
  if (encoding === null) {
    return 'address encoding is invalid'
  }
  // If the address encoding format is invalid, return an error.
  if (encoding !== info.format) {
    return `address encoding mismatch (${encoding} !== ${info.format})`
  }
  // Decode the address.
  const decoded = AddressEncoder.decode(address)
  // If the address decoding failed, return an error.
  if (decoded === null) {
    return 'address decoding failed'
  }
  // If the address size is invalid, return an error.
  if (decoded.length !== info.size) {
    return `address size mismatch (${decoded.length} !== ${info.size})`
  }
  // If the address is valid, return null.
  return null
}

function verify_address (address : string) : boolean {
  return AddressTool.check(address) === null
}

function assert_address (
  address : string
) {
  const error = AddressTool.check(address)
  if (error !== null) {
    throw new TypeError('invalid address: ' + error)
  }
}
