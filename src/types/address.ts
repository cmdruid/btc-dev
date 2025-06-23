export type AddressFormat = 'base58' | 'bech32'  | 'bech32m'
export type AddressType   = 'p2pkh'  | 'p2sh'    | 'p2w-pkh' | 'p2w-sh' | 'p2tr'
export type ChainNetwork  = 'main'   | 'testnet' | 'regtest'
export type AddressData   = AddressContext & ScriptData

export type AddressConfigEntry = [
  prefix  : string,
  type    : AddressType,
  network : ChainNetwork,
  size    : number,
  format  : AddressFormat,
  version : number
]

export interface DecodedAddress {
  format   : AddressFormat
  data     : Uint8Array
  prefix?  : string
  version? : number
}

export interface AddressConfig {
  format  : AddressFormat
  network : ChainNetwork
  prefix  : string
  size    : number
  type    : AddressType
  version : number
}

export interface AddressContext extends AddressConfig {
  data : Uint8Array
  hex  : string
}

export interface ScriptData {
  script_asm : string[]
  script_hex : string
}
