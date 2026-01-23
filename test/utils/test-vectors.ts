import { readFileSync } from 'fs'

export interface BIP340TestVector {
  index: number
  secretKey: string | null
  publicKey: string
  auxRand: string | null
  message: string
  signature: string
  valid: boolean
  comment: string
}

export interface TestVector {
  description: string
  input: any
  expected: any
  network?: 'mainnet' | 'testnet' | 'regtest'
  shouldThrow?: boolean
}

/**
 * Get essential BIP-340 test vectors (pre-parsed JSON)
 */
export function getEssentialBIP340Vectors(): BIP340TestVector[] {
  const jsonPath = 'test/vectors/essential/bip340-essential.json'
  const jsonContent = readFileSync(jsonPath, 'utf-8')
  return JSON.parse(jsonContent)
}

/**
 * Run test vectors with error handling
 */
export function runTestVectors<T>(
  vectors: T[],
  testFn: (vector: T) => void,
  description: string = 'test vector'
): void {
  for (const [index, vector] of vectors.entries()) {
    try {
      testFn(vector)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`${description} ${index} failed: ${message}`)
    }
  }
}

/**
 * Test against all Bitcoin networks
 */
export function testAllNetworks(testFn: (network: string) => void): void {
  const networks = ['mainnet', 'testnet', 'regtest']
  networks.forEach(testFn)
}

/**
 * Real mainnet transaction examples for testing
 */
export const REAL_MAINNET_TXS = {
  // Genesis coinbase transaction
  genesis: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',

  // First segwit transaction (2017)
  segwit_first: 'f91d0a8a78462bc59398f2c5d7a84fcff491c26ba54c4833478b202796c8aafd',

  // First taproot transaction (2021)
  taproot_first: '2eb8dbaa346d4be2c2e44707b296d27421965ac45b0fb9e3f6de5ed888c7efa4',

  // Standard P2PKH transaction
  standard_p2pkh: 'e3bf3d07d4b0375638d5f1db5255fe07ba2c4cb067cd81b84ee974b6585fb468',

  // Multi-input, multi-output
  complex: 'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'
} as const

/**
 * Essential script patterns for testing
 */
export const ESSENTIAL_SCRIPT_PATTERNS = {
  p2pkh: {
    script: 'OP_DUP OP_HASH160 <pubkeyHash> OP_EQUALVERIFY OP_CHECKSIG',
    valid: true,
    description: 'Standard P2PKH script'
  },
  p2sh: {
    script: 'OP_HASH160 <scriptHash> OP_EQUAL',
    valid: true,
    description: 'Standard P2SH script'
  },
  p2wpkh: {
    script: 'OP_0 <pubkeyHash>',
    valid: true,
    description: 'Segwit v0 P2WPKH script'
  },
  p2wsh: {
    script: 'OP_0 <scriptHash>',
    valid: true,
    description: 'Segwit v0 P2WSH script'
  },
  p2tr: {
    script: 'OP_1 <taprootOutput>',
    valid: true,
    description: 'Taproot v1 P2TR script'
  },
  // Invalid patterns
  invalid_opcode: {
    script: 'OP_INVALIDOPCODE',
    valid: false,
    description: 'Invalid opcode'
  },
  empty_script: {
    script: '',
    valid: false,
    description: 'Empty script'
  }
} as const