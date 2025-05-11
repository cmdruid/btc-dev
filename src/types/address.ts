export type AddressFormat = 'base58' | 'bech32' | 'bech32m'
export type AddressType   = 'p2pkh' | 'p2sh' | 'p2w-pkh' | 'p2w-sh' | 'p2tr'
export type ChainNetwork  = 'main' | 'testnet' | 'regtest'

export type AddressTableEntry = [
  prefix  : string,
  type    : AddressType,
  network : ChainNetwork,
  size    : number,
  format  : AddressFormat,
  version : number
]

export interface AddressInfo {
  format  : AddressFormat
  prefix  : string
  network : ChainNetwork
  size    : number
  type    : AddressType
  version : number
}

export interface AddressData extends AddressInfo {
  asm    : string[]
  data   : string
  script : string
}
