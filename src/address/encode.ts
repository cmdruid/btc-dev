import { Buff, Bech32, Bech32m } from '@cmdcode/buff'

type EncoderConfig = Base58Config | Bech32Config

interface Base58Config {
  format  : 'base58'
  data    : string | Uint8Array
  version : number
}

interface Bech32Config {
  format : 'bech32' | 'bech32m'
  data   : string | Uint8Array
  prefix : string
}

interface Base58Data {
  data    : Uint8Array
  version : number
}

interface Bech32Data {
  data    : Uint8Array
  prefix  : string
  version : number
}

const ENCODING_REGEX = {
  base58  : /^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  bech32  : /^(bc|tb|bcrt)1q[ac-hj-np-z02-9]{6,87}$/,
  bech32m : /^(bc|tb|bcrt)1p[ac-hj-np-z02-9]{6,87}$/
}

export namespace AddressEncoder {
  export type  Config   = EncoderConfig
  export const REGEX    = ENCODING_REGEX
  export const get_type = get_encoding_type

  export const encode = encode_address
  export const decode = decode_address

  export const base58 = {
    encode : (config  : Base58Config) => base58_encode(config),
    decode : (encoded : string) => base58_decode(encoded)
  }
  export const bech32 = {
    encode : (config  : Bech32Config) => bech32_encode(config),
    decode : (encoded : string) => bech32_decode(encoded)
  }
  export const bech32m = {
    encode : (config  : Bech32Config) => bech32m_encode(config),
    decode : (encoded : string) => bech32m_decode(encoded)
  }
}

/**
 * Get the encoding type for a given address.
 * 
 * @param address - The address to get the encoding type for.
 * @returns The encoding type, or null if the address is not recognized.
 */
function get_encoding_type (address : string) : string | null {
  for (const [ type, regex ] of Object.entries(ENCODING_REGEX)) {
    if (regex.test(address)) return type
  }
  return null
}

/**
 * Decode an address based on its encoding type.
 * 
 * @param address - The address to decode.
 * @returns The decoded address as a Uint8Array, or null if the address is not
 *          recognized.
 */
function decode_address (address : string) : Uint8Array {
  const type = get_encoding_type(address)
  if (type === 'base58')  return AddressEncoder.base58.decode(address).data
  if (type === 'bech32')  return AddressEncoder.bech32.decode(address).data
  if (type === 'bech32m') return AddressEncoder.bech32m.decode(address).data
  throw new Error('unrecognized address encoding: ' + address)
}

/**
 * Encode an address based on its encoding type.
 * 
 * @param address - The address to encode.
 * @returns The encoded address as a string, or null if the address is not
 *          recognized.
 */
function encode_address (
  config : EncoderConfig
) : string {
  if (config.format === 'base58')  return AddressEncoder.base58.encode(config)
  if (config.format === 'bech32')  return AddressEncoder.bech32.encode(config)
  if (config.format === 'bech32m') return AddressEncoder.bech32m.encode(config)
  throw new Error('unrecognized encoding format: ' + config.format)
}

function base58_encode (config : Base58Config) : string {
  const bytes = Buff.bytes(config.data)
  return bytes.prepend(config.version).b58chk
}

function base58_decode (encoded : string) : Base58Data {
  const bytes = Buff.b58chk(encoded)
  return { data : bytes.slice(1), version : bytes[0] }
}

/**
 * Encode data as a bech32 string.
 * 
 * @param config - The encoder configuration.
 * @returns The encoded bech32 string.
 */
function bech32_encode (config : Bech32Config) : string {
  const bytes   = Buff.bytes(config.data)
  const words   = Bech32.to_words(bytes)
  return Bech32.encode(config.prefix, [ 0, ...words ])
}

/**
 * Decode data as a bech32 string.
 * 
 * @param encoded - The bech32 string to decode.
 * @returns The decoded data.
 */
function bech32_decode (encoded : string) : Bech32Data {
  const { prefix, words }    = Bech32.decode(encoded)
  const [ version, ...rest ] = words
  const data = Bech32.to_bytes(rest)
  return { prefix, version, data }
}

/**
 * Encode data as a bech32 string.
 * 
 * @param config - The encoder configuration.
 * @returns The encoded bech32 string.
 */
function bech32m_encode (config : Bech32Config) : string {
  const bytes   = Buff.bytes(config.data)
  const words   = Bech32m.to_words(bytes)
  return Bech32m.encode(config.prefix, [ 1, ...words ])
}

/**
 * Decode data as a bech32 string.
 * 
 * @param encoded - The bech32 string to decode.
 * @returns The decoded data.
 */
function bech32m_decode (encoded : string) : Bech32Data {
  const { prefix, words }    = Bech32m.decode(encoded)
  const [ version, ...rest ] = words
  const data = Bech32m.to_bytes(rest)
  return { prefix, version, data }
}