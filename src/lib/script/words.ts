export const OPCODE_MAP = {
  OP_0                   : 0x00,
  OP_PUSHDATA1           : 0x4C,
  OP_PUSHDATA2           : 0x4D,
  OP_PUSHDATA4           : 0x4E,
  OP_1NEGATE             : 0x4F,
  OP_SUCCESS80           : 0x50,
  OP_1                   : 0x51,
  OP_2                   : 0x52,
  OP_3                   : 0x53,
  OP_4                   : 0x54,
  OP_5                   : 0x55,
  OP_6                   : 0x56,
  OP_7                   : 0x57,
  OP_8                   : 0x58,
  OP_9                   : 0x59,
  OP_10                  : 0x5A,
  OP_11                  : 0x5B,
  OP_12                  : 0x5C,
  OP_13                  : 0x5D,
  OP_14                  : 0x5E,
  OP_15                  : 0x5F,
  OP_16                  : 0x60,
  OP_NOP                 : 0x61,
  OP_SUCCESS98           : 0x62,
  OP_IF                  : 0x63,
  OP_NOTIF               : 0x64,
  OP_ELSE                : 0x67,
  OP_ENDIF               : 0x68,
  OP_VERIFY              : 0x69,
  OP_RETURN              : 0x6A,
  OP_TOALTSTACK          : 0x6B,
  OP_FROMALTSTACK        : 0x6C,
  OP_2DROP               : 0x6D,
  OP_2DUP                : 0x6E,
  OP_3DUP                : 0x6F,
  OP_2OVER               : 0x70,
  OP_2ROT                : 0x71,
  OP_2SWAP               : 0x72,
  OP_IFDUP               : 0x73,
  OP_DEPTH               : 0x74,
  OP_DROP                : 0x75,
  OP_DUP                 : 0x76,
  OP_NIP                 : 0x77,
  OP_OVER                : 0x78,
  OP_PICK                : 0x79,
  OP_ROLL                : 0x7A,
  OP_ROT                 : 0x7B,
  OP_SWAP                : 0x7C,
  OP_TUCK                : 0x7D,
  OP_SUCCESS126          : 0x7E,
  OP_SUCCESS127          : 0x7F,
  OP_SUCCESS128          : 0x80,
  OP_SUCCESS129          : 0x81,
  OP_SIZE                : 0x82,
  OP_SUCCESS131          : 0x83,
  OP_SUCCESS132          : 0x84,
  OP_SUCCESS133          : 0x85,
  OP_SUCCESS134          : 0x86,
  OP_EQUAL               : 0x87,
  OP_EQUALVERIFY         : 0x88,
  OP_SUCCESS137          : 0x89,
  OP_SUCCESS138          : 0x8A,
  OP_1ADD                : 0x8B,
  OP_1SUB                : 0x8C,
  OP_SUCCESS141          : 0x8D,
  OP_SUCCESS142          : 0x8E,
  OP_NEGATE              : 0x8F,
  OP_ABS                 : 0x90,
  OP_NOT                 : 0x91,
  OP_0NOTEQUAL           : 0x92,
  OP_ADD                 : 0x93,
  OP_SUB                 : 0x94,
  OP_SUCCESS149          : 0x95,
  OP_SUCCESS150          : 0x96,
  OP_SUCCESS151          : 0x97,
  OP_SUCCESS152          : 0x98,
  OP_SUCCESS153          : 0x99,
  OP_BOOLAND             : 0x9A,
  OP_BOOLOR              : 0x9B,
  OP_NUMEQUAL            : 0x9C,
  OP_NUMEQUALVERIFY      : 0x9D,
  OP_NUMNOTEQUAL         : 0x9E,
  OP_LESSTHAN            : 0x9F,
  OP_GREATERTHAN         : 0xA0,
  OP_LESSTHANOREQUAL     : 0xA1,
  OP_GREATERTHANOREQUAL  : 0xA2,
  OP_MIN                 : 0xA3,
  OP_MAX                 : 0xA4,
  OP_WITHIN              : 0xA5,
  OP_RIPEMD160           : 0xA6,
  OP_SHA1                : 0xA7,
  OP_SHA256              : 0xA8,
  OP_HASH160             : 0xA9,
  OP_HASH256             : 0xAA,
  OP_CODESEPARATOR       : 0xAB,
  OP_CHECKSIG            : 0xAC,
  OP_CHECKSIGVERIFY      : 0xAD,
  OP_CHECKMULTISIG       : 0xAE,
  OP_CHECKMULTISIGVERIFY : 0xAF,
  OP_NOP1                : 0xB0,
  OP_CHECKLOCKTIMEVERIFY : 0xB1,
  OP_CHECKSEQUENCEVERIFY : 0xB2,
  OP_NOP4                : 0xB3,
  OP_NOP5                : 0xB4,
  OP_NOP6                : 0xB5,
  OP_NOP7                : 0xB6,
  OP_NOP8                : 0xB7,
  OP_NOP9                : 0xB8,
  OP_NOP10               : 0xB9,
  OP_CHECKSIGADD         : 0xBA
}

/** 
 * Get the sting-representation of an opcode
 * based on its number value.
 */
export function get_op_code (num : number) : string {
  if (num > 186 && num < 255) {
    return 'OP_SUCCESS' + String(num)
  }
  for (const [ k, v ] of Object.entries(OPCODE_MAP)) {
    if (v === num) return k
  }
  throw new Error('OPCODE not found:' + String(num))
}

/** 
 * Get the number-representation of an opcode
 * based on its asm string value.
 */
export function get_asm_code (string : string) : number {
  for (const [ k, v ] of Object.entries(OPCODE_MAP)) {
    if (k === string) return Number(v)
  }
  throw new Error('OPCODE not found:' + string)
}

/** 
 * Get the type of word based on its number value.
 */
export function get_op_type (word : number) : string {
  switch (true) {
    case (word === 0):
      return 'opcode'
    case (word >= 1 && word <= 75):
      return 'varint'
    case (word === 76):
      return 'pushdata1'
    case (word === 77):
      return 'pushdata2'
    case (word === 78):
      return 'pushdata4'
    case (word <= 254):
      return 'opcode'
    default:
      throw new Error(`Invalid word range: ${word}`)
  }
}

/** 
 * Check if the provided value is a valid script opcode.
 */
export function is_valid_op (word : number) : boolean {
  const MIN_RANGE = 75
  const MAX_RANGE = 254

  const DISABLED_OPCODES : number[] = []

  switch (true) {
    case (typeof (word) !== 'number'):
      return false
    case (word === 0):
      return true
    case (DISABLED_OPCODES.includes(word)):
      return false
    case (MIN_RANGE < word && word < MAX_RANGE):
      return true
    default:
      return false
  }
}
