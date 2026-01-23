export const COINBASE = {
	TXID: "00".repeat(32),
	VOUT: 0xffffffff,
};

export const DEFAULT = {
	LOCKTIME: 0,
	SEQUENCE: 0xffffffff,
	VERSION: 2,
};

export const TAPLEAF_VERSIONS = [
	0xc0, 0xc2, 0xc4, 0xc6, 0xc8, 0xca, 0xcc, 0xce, 0xd0, 0xd2, 0xd4, 0xd6, 0xd8,
	0xda, 0xdc, 0xde, 0xe0, 0xe2, 0xe4, 0xe6, 0xe8, 0xea, 0xec, 0xee, 0xf0, 0xf2,
	0xf4, 0xf6, 0xf8, 0xfa, 0xfc, 0xfe, 0x66, 0x7e, 0x80, 0x84, 0x96, 0x98, 0xba,
	0xbc, 0xbe,
];

export const TAPLEAF_DEFAULT_VERSION = 0xc0;

export const LOCK_SCRIPT_TYPE = {
	P2PKH: "p2pkh",
	P2SH: "p2sh",
	P2WPKH: "p2wpkh",
	P2WSH: "p2wsh",
	P2TR: "p2tr",
	OPRETURN: "opreturn",
} as const;

export const SPEND_SCRIPT_TYPE = {
	P2PKH: "p2pkh",
	P2SH: "p2sh",
	P2WPKH: "p2wpkh",
	P2WSH: "p2wsh",
	P2TR: "p2tr",
	P2TS: "p2ts",
} as const;

export const LOCK_SCRIPT_REGEX: Record<string, RegExp> = {
	[LOCK_SCRIPT_TYPE.P2PKH]: /^76a914[0-9a-f]{40}88ac$/i,
	[LOCK_SCRIPT_TYPE.P2SH]: /^a914[0-9a-f]{40}87$/i,
	[LOCK_SCRIPT_TYPE.P2WPKH]: /^0014[0-9a-f]{40}$/i,
	[LOCK_SCRIPT_TYPE.P2WSH]: /^0020[0-9a-f]{64}$/i,
	[LOCK_SCRIPT_TYPE.P2TR]: /^5120[0-9a-f]{64}$/i,
	[LOCK_SCRIPT_TYPE.OPRETURN]: /^6a[0-9a-f]{2,}$/i,
} as const;

export const SCRIPT_INT_KEY = "";

export const TX_SIZE = {
	GLOBAL_BASE: 8,
	GLOBAL_WIT: 10,
	TXIN_BASE: 32 + 4 + 4,
	TXOUT_BASE: 8,
};

export const SIGHASH_DEFAULT = 0x01;
export const SIGHASH_SEGWIT = [0x01, 0x02, 0x03, 0x81, 0x82, 0x83];
export const SIGHASH_TAPROOT = [0x00, ...SIGHASH_SEGWIT];

/** Bitcoin consensus script size limit (10,000 bytes) */
export const MAX_SCRIPT_SIZE = 10_000;

/** Maximum varint payload size (~520KB, prevents memory exhaustion attacks) */
export const MAX_VARINT_SIZE = 520_000;

/** Offset to convert 1-16 to OP_1 through OP_16 */
export const OP_1_OFFSET = 0x50;
