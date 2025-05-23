export const OPCODE_MAP = {
  OP_0                   : 0,
  OP_PUSHDATA1           : 76,
  OP_PUSHDATA2           : 77,
  OP_PUSHDATA4           : 78,
  OP_1NEGATE             : 79,
  OP_SUCCESS80           : 80,
  OP_1                   : 81,
  OP_2                   : 82,
  OP_3                   : 83,
  OP_4                   : 84,
  OP_5                   : 85,
  OP_6                   : 86,
  OP_7                   : 87,
  OP_8                   : 88,
  OP_9                   : 89,
  OP_10                  : 90,
  OP_11                  : 91,
  OP_12                  : 92,
  OP_13                  : 93,
  OP_14                  : 94,
  OP_15                  : 95,
  OP_16                  : 96,
  OP_NOP                 : 97,
  OP_SUCCESS98           : 98,
  OP_IF                  : 99,
  OP_NOTIF               : 100,
  OP_ELSE                : 103,
  OP_ENDIF               : 104,
  OP_VERIFY              : 105,
  OP_RETURN              : 106,
  OP_TOALTSTACK          : 107,
  OP_FROMALTSTACK        : 108,
  OP_2DROP               : 109,
  OP_2DUP                : 110,
  OP_3DUP                : 111,
  OP_2OVER               : 112,
  OP_2ROT                : 113,
  OP_2SWAP               : 114,
  OP_IFDUP               : 115,
  OP_DEPTH               : 116,
  OP_DROP                : 117,
  OP_DUP                 : 118,
  OP_NIP                 : 119,
  OP_OVER                : 120,
  OP_PICK                : 121,
  OP_ROLL                : 122,
  OP_ROT                 : 123,
  OP_SWAP                : 124,
  OP_TUCK                : 125,
  OP_SUCCESS126          : 126,
  OP_SUCCESS127          : 127,
  OP_SUCCESS128          : 128,
  OP_SUCCESS129          : 129,
  OP_SIZE                : 130,
  OP_SUCCESS131          : 131,
  OP_SUCCESS132          : 132,
  OP_SUCCESS133          : 133,
  OP_SUCCESS134          : 134,
  OP_EQUAL               : 135,
  OP_EQUALVERIFY         : 136,
  OP_SUCCESS137          : 137,
  OP_SUCCESS138          : 138,
  OP_1ADD                : 139,
  OP_1SUB                : 140,
  OP_SUCCESS141          : 141,
  OP_SUCCESS142          : 142,
  OP_NEGATE              : 143,
  OP_ABS                 : 144,
  OP_NOT                 : 145,
  OP_0NOTEQUAL           : 146,
  OP_ADD                 : 147,
  OP_SUB                 : 148,
  OP_SUCCESS149          : 149,
  OP_SUCCESS150          : 150,
  OP_SUCCESS151          : 151,
  OP_SUCCESS152          : 152,
  OP_SUCCESS153          : 153,
  OP_BOOLAND             : 154,
  OP_BOOLOR              : 155,
  OP_NUMEQUAL            : 156,
  OP_NUMEQUALVERIFY      : 157,
  OP_NUMNOTEQUAL         : 158,
  OP_LESSTHAN            : 159,
  OP_GREATERTHAN         : 160,
  OP_LESSTHANOREQUAL     : 161,
  OP_GREATERTHANOREQUAL  : 162,
  OP_MIN                 : 163,
  OP_MAX                 : 164,
  OP_WITHIN              : 165,
  OP_RIPEMD160           : 166,
  OP_SHA1                : 167,
  OP_SHA256              : 168,
  OP_HASH160             : 169,
  OP_HASH256             : 170,
  OP_CODESEPARATOR       : 171,
  OP_CHECKSIG            : 172,
  OP_CHECKSIGVERIFY      : 173,
  OP_CHECKMULTISIG       : 174,
  OP_CHECKMULTISIGVERIFY : 175,
  OP_NOP1                : 176,
  OP_CHECKLOCKTIMEVERIFY : 177,
  OP_CHECKSEQUENCEVERIFY : 178,
  OP_NOP4                : 179,
  OP_NOP5                : 180,
  OP_NOP6                : 181,
  OP_NOP7                : 182,
  OP_NOP8                : 183,
  OP_NOP9                : 184,
  OP_NOP10               : 185,
  OP_CHECKSIGADD         : 186
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
