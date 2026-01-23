import { Test } from 'tape'
import { Buff } from '@vbyte/buff'

import {
  sign_segwit_tx,
  sign_taproot_tx
} from '@/lib/signer/index.js'

import { SIGHASH_SEGWIT, SIGHASH_TAPROOT } from '@/const.js'

// Valid test secret key (not for production use!)
const TEST_SECKEY = '0000000000000000000000000000000000000000000000000000000000000001'

// P2WPKH transaction for segwit signing
const SEGWIT_TX = {
  version: 2,
  vin: [{
    txid: 'aa'.repeat(32),
    vout: 0,
    sequence: 0xffffffff,
    coinbase: null,
    script_sig: null,
    witness: [],
    prevout: {
      value: BigInt(100000),
      script_pk: '0014' + '89abcdefabbaabbaabbaabbaabbaabbaabbaabba'
    }
  }],
  vout: [{
    value: BigInt(50000),
    script_pk: '0014' + 'fedcba9876543210fedcba9876543210fedcba98'
  }],
  locktime: 0
}

// P2TR transaction for taproot signing
const TAPROOT_TX = {
  version: 2,
  vin: [{
    txid: 'bb'.repeat(32),
    vout: 0,
    sequence: 0xffffffff,
    coinbase: null,
    script_sig: null,
    witness: [],
    prevout: {
      value: BigInt(100000),
      script_pk: '5120' + 'cc'.repeat(32)
    }
  }],
  vout: [{
    value: BigInt(50000),
    script_pk: '5120' + 'dd'.repeat(32)
  }],
  locktime: 0
}

// Multi-output transaction for SIGHASH_SINGLE tests
const MULTI_OUTPUT_TX = {
  version: 2,
  vin: [{
    txid: 'ee'.repeat(32),
    vout: 0,
    sequence: 0xffffffff,
    coinbase: null,
    script_sig: null,
    witness: [],
    prevout: {
      value: BigInt(200000),
      script_pk: '5120' + 'ff'.repeat(32)
    }
  }],
  vout: [
    { value: BigInt(50000), script_pk: '5120' + '11'.repeat(32) },
    { value: BigInt(50000), script_pk: '5120' + '22'.repeat(32) },
    { value: BigInt(50000), script_pk: '5120' + '33'.repeat(32) }
  ],
  locktime: 0
}

export default function (t: Test): void {
  t.test('Segwit sighash flag coverage - SIGHASH_ALL (0x01)', t => {
    t.plan(2)

    try {
      const sig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x01,
        pubkey: '02' + '00'.repeat(32)
      })
      t.ok(sig, 'SIGHASH_ALL signing should succeed')
      t.ok(sig.endsWith('01'), 'Signature should end with 0x01 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_ALL should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Segwit sighash flag coverage - SIGHASH_NONE (0x02)', t => {
    t.plan(2)

    try {
      const sig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x02,
        pubkey: '02' + '00'.repeat(32)
      })
      t.ok(sig, 'SIGHASH_NONE signing should succeed')
      t.ok(sig.endsWith('02'), 'Signature should end with 0x02 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_NONE should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Segwit sighash flag coverage - SIGHASH_SINGLE (0x03)', t => {
    t.plan(2)

    try {
      const sig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x03,
        pubkey: '02' + '00'.repeat(32)
      })
      t.ok(sig, 'SIGHASH_SINGLE signing should succeed')
      t.ok(sig.endsWith('03'), 'Signature should end with 0x03 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_SINGLE should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Segwit sighash flag coverage - SIGHASH_ALL|ANYONECANPAY (0x81)', t => {
    t.plan(2)

    try {
      const sig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x81,
        pubkey: '02' + '00'.repeat(32)
      })
      t.ok(sig, 'SIGHASH_ALL|ANYONECANPAY signing should succeed')
      t.ok(sig.endsWith('81'), 'Signature should end with 0x81 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_ALL|ANYONECANPAY should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Segwit sighash flag coverage - SIGHASH_NONE|ANYONECANPAY (0x82)', t => {
    t.plan(2)

    try {
      const sig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x82,
        pubkey: '02' + '00'.repeat(32)
      })
      t.ok(sig, 'SIGHASH_NONE|ANYONECANPAY signing should succeed')
      t.ok(sig.endsWith('82'), 'Signature should end with 0x82 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_NONE|ANYONECANPAY should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Segwit sighash flag coverage - SIGHASH_SINGLE|ANYONECANPAY (0x83)', t => {
    t.plan(2)

    try {
      const sig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x83,
        pubkey: '02' + '00'.repeat(32)
      })
      t.ok(sig, 'SIGHASH_SINGLE|ANYONECANPAY signing should succeed')
      t.ok(sig.endsWith('83'), 'Signature should end with 0x83 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_SINGLE|ANYONECANPAY should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_DEFAULT (0x00)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: 0x00
      })
      t.ok(sig, 'SIGHASH_DEFAULT signing should succeed')
      t.equal(sig.length, 128, 'Default sighash should produce 64-byte signature (no flag appended)')
    } catch (err: any) {
      t.fail('SIGHASH_DEFAULT should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_ALL (0x01)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: 0x01
      })
      t.ok(sig, 'SIGHASH_ALL signing should succeed')
      t.ok(sig.endsWith('01'), 'Signature should end with 0x01 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_ALL should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_NONE (0x02)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: 0x02
      })
      t.ok(sig, 'SIGHASH_NONE signing should succeed')
      t.ok(sig.endsWith('02'), 'Signature should end with 0x02 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_NONE should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_SINGLE (0x03)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, MULTI_OUTPUT_TX, {
        txindex: 0,
        sigflag: 0x03
      })
      t.ok(sig, 'SIGHASH_SINGLE signing should succeed')
      t.ok(sig.endsWith('03'), 'Signature should end with 0x03 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_SINGLE should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_ALL|ANYONECANPAY (0x81)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: 0x81
      })
      t.ok(sig, 'SIGHASH_ALL|ANYONECANPAY signing should succeed')
      t.ok(sig.endsWith('81'), 'Signature should end with 0x81 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_ALL|ANYONECANPAY should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_NONE|ANYONECANPAY (0x82)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: 0x82
      })
      t.ok(sig, 'SIGHASH_NONE|ANYONECANPAY signing should succeed')
      t.ok(sig.endsWith('82'), 'Signature should end with 0x82 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_NONE|ANYONECANPAY should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Taproot sighash flag coverage - SIGHASH_SINGLE|ANYONECANPAY (0x83)', t => {
    t.plan(2)

    try {
      const sig = sign_taproot_tx(TEST_SECKEY, MULTI_OUTPUT_TX, {
        txindex: 0,
        sigflag: 0x83
      })
      t.ok(sig, 'SIGHASH_SINGLE|ANYONECANPAY signing should succeed')
      t.ok(sig.endsWith('83'), 'Signature should end with 0x83 sighash flag')
    } catch (err: any) {
      t.fail('SIGHASH_SINGLE|ANYONECANPAY should work: ' + err.message)
      t.fail('Second assertion skipped')
    }
  })

  t.test('Invalid sighash flags should be rejected', t => {
    t.plan(4)

    // Invalid segwit flag
    try {
      sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0x04, // Invalid
        pubkey: '02' + '00'.repeat(32)
      })
      t.fail('Invalid segwit sigflag 0x04 should throw')
    } catch (err: any) {
      t.ok(err.message.includes('sigflag') || err.message.includes('Invalid'),
        'Invalid segwit sigflag rejected')
    }

    // Invalid taproot flag
    try {
      sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: 0x04 // Invalid
      })
      t.fail('Invalid taproot sigflag 0x04 should throw')
    } catch (err: any) {
      t.ok(err.message.includes('sigflag') || err.message.includes('Invalid'),
        'Invalid taproot sigflag rejected')
    }

    // 0xFF is invalid
    try {
      sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
        txindex: 0,
        sigflag: 0xFF,
        pubkey: '02' + '00'.repeat(32)
      })
      t.fail('Invalid sigflag 0xFF should throw')
    } catch (err: any) {
      t.pass('Sigflag 0xFF rejected')
    }

    // Negative sigflag
    try {
      sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0,
        sigflag: -1
      })
      t.fail('Negative sigflag should throw')
    } catch (err: any) {
      t.pass('Negative sigflag rejected')
    }
  })

  t.test('Invalid secret key formats', t => {
    t.plan(5)

    // Too short
    try {
      sign_taproot_tx('00'.repeat(31), TAPROOT_TX, { txindex: 0 })
      t.fail('Short secret key should throw')
    } catch (err: any) {
      t.ok(err.message.includes('Secret key') || err.message.includes('secret'),
        'Short secret key rejected')
    }

    // Too long
    try {
      sign_taproot_tx('00'.repeat(33), TAPROOT_TX, { txindex: 0 })
      t.fail('Long secret key should throw')
    } catch (err: any) {
      t.ok(err.message.includes('Secret key') || err.message.includes('secret'),
        'Long secret key rejected')
    }

    // Invalid hex
    try {
      sign_taproot_tx('gg'.repeat(32), TAPROOT_TX, { txindex: 0 })
      t.fail('Non-hex secret key should throw')
    } catch (err: any) {
      t.ok(err.message.includes('Secret key') || err.message.includes('secret') || err.message.includes('hex'),
        'Non-hex secret key rejected')
    }

    // Empty string
    try {
      sign_taproot_tx('', TAPROOT_TX, { txindex: 0 })
      t.fail('Empty secret key should throw')
    } catch (err: any) {
      t.pass('Empty secret key rejected')
    }

    // Not a string
    try {
      sign_taproot_tx(123 as any, TAPROOT_TX, { txindex: 0 })
      t.fail('Non-string secret key should throw')
    } catch (err: any) {
      t.pass('Non-string secret key rejected')
    }
  })

  t.test('Invalid txindex values', t => {
    t.plan(3)

    // Negative txindex
    try {
      sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: -1,
        sigflag: 0x01
      })
      t.fail('Negative txindex should throw')
    } catch (err: any) {
      t.pass('Negative txindex rejected')
    }

    // Non-integer txindex
    try {
      sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 0.5,
        sigflag: 0x01
      })
      t.fail('Non-integer txindex should throw')
    } catch (err: any) {
      t.pass('Non-integer txindex rejected')
    }

    // Out of bounds txindex
    try {
      sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
        txindex: 10, // Only 1 input exists
        sigflag: 0x01
      })
      t.fail('Out-of-bounds txindex should throw')
    } catch (err: any) {
      t.pass('Out-of-bounds txindex rejected')
    }
  })

  t.test('Signature format verification', t => {
    t.plan(4)

    // Schnorr signature (taproot) should be 64 bytes (128 hex) or 65 with flag
    const schnorrSig = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
      txindex: 0,
      sigflag: 0x00
    })
    t.equal(schnorrSig.length, 128, 'Schnorr sig without flag is 64 bytes')

    const schnorrSigWithFlag = sign_taproot_tx(TEST_SECKEY, TAPROOT_TX, {
      txindex: 0,
      sigflag: 0x01
    })
    t.equal(schnorrSigWithFlag.length, 130, 'Schnorr sig with flag is 65 bytes')

    // ECDSA signature (segwit) should be DER encoded
    const ecdsaSig = sign_segwit_tx(TEST_SECKEY, SEGWIT_TX, {
      txindex: 0,
      sigflag: 0x01,
      pubkey: '02' + '00'.repeat(32)
    })
    t.ok(ecdsaSig.startsWith('30'), 'ECDSA sig should start with DER sequence marker')
    t.ok(ecdsaSig.length >= 140 && ecdsaSig.length <= 146,
      'ECDSA DER sig should be 70-73 bytes')
  })
}
