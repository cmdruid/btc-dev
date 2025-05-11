export const COINBASE = {
  TXID : '00'.repeat(32),
  VOUT : 0xFFFFFFFF,
}

export const DEFAULT = {
  LOCKTIME : 0,
  SEQUENCE : 0xFFFFFFFF,
  VERSION  : 2,
}

export const TAPLEAF_VERSIONS = [
  0xc0, 0xc2, 0xc4, 0xc6, 0xc8, 0xca, 0xcc, 0xce,
  0xd0, 0xd2, 0xd4, 0xd6, 0xd8, 0xda, 0xdc, 0xde,
  0xe0, 0xe2, 0xe4, 0xe6, 0xe8, 0xea, 0xec, 0xee,
  0xf0, 0xf2, 0xf4, 0xf6, 0xf8, 0xfa, 0xfc, 0xfe,
  0x66, 0x7e, 0x80, 0x84, 0x96, 0x98, 0xba, 0xbc,
  0xbe
]

export const TAPLEAF_DEFAULT_VERSION = 0xc0

export const LOCK_SCRIPT_REGEX : Record<string, RegExp> = {
  'p2pkh'    : /^76a914[0-9a-f]{40}88ac$/i,
  'p2sh'     : /^a914[0-9a-f]{40}87$/i,
  'p2wpkh'   : /^0014[0-9a-f]{40}$/i,
  'p2wsh'    : /^0020[0-9a-f]{64}$/i,
  'p2tr'     : /^5120[0-9a-f]{64}$/i,
  'opreturn' : /^6a[0-9a-f]{2,}$/i,
}

export const SCRIPT_INT_KEY = ''

export const TX_SIZE = {
  GLOBAL_BASE : 8,
  GLOBAL_WIT  : 10,
  TXIN_BASE   : 32 + 4 + 4,
  TXOUT_BASE  : 8,
}

export const SIGHASH_DEFAULT = 0x01
export const SIGHASH_SEGWIT  = [ 0x01, 0x02, 0x03, 0x81, 0x82, 0x83 ]
export const SIGHASH_TAPROOT = [ 0x00, ...SIGHASH_SEGWIT ]
