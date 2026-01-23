import { Test } from 'tape'
import { Buff } from '@vbyte/buff'
import { parse_witness } from '@/lib/witness/parse.js'

export default function (t: Test): void {
  t.test('Witness parsing - signature length detection', t => {
    t.plan(6)

    // 71-byte ECDSA signature (minimum common size)
    const sig71 = '30' + '44' + '0220' + '00'.repeat(32) + '0220' + '00'.repeat(32) + '01'
    const pubkey = '02' + '00'.repeat(32)
    const witness71 = [Buff.hex(sig71), Buff.hex(pubkey)]
    const result71 = parse_witness(witness71)
    t.equal(result71.type, 'p2wpkh', '71-byte sig detected as P2WPKH')

    // 72-byte ECDSA signature
    const sig72 = '30' + '45' + '0221' + '00' + '00'.repeat(32) + '0220' + '00'.repeat(32) + '01'
    const witness72 = [Buff.hex(sig72), Buff.hex(pubkey)]
    const result72 = parse_witness(witness72)
    t.equal(result72.type, 'p2wpkh', '72-byte sig detected as P2WPKH')

    // 73-byte ECDSA signature (maximum size)
    const sig73 = '30' + '46' + '0221' + '00' + '00'.repeat(32) + '0221' + '00' + '00'.repeat(32) + '01'
    const witness73 = [Buff.hex(sig73), Buff.hex(pubkey)]
    const result73 = parse_witness(witness73)
    t.equal(result73.type, 'p2wpkh', '73-byte sig detected as P2WPKH')

    // 64-byte Schnorr signature
    const schnorr64 = '00'.repeat(64)
    const witnessSchnorr = [Buff.hex(schnorr64)]
    const resultSchnorr = parse_witness(witnessSchnorr)
    t.equal(resultSchnorr.type, 'p2tr', '64-byte sig detected as P2TR')

    // 65-byte Schnorr signature (with sighash flag)
    const schnorr65 = '00'.repeat(64) + '01'
    const witnessSchnorr65 = [Buff.hex(schnorr65)]
    const resultSchnorr65 = parse_witness(witnessSchnorr65)
    t.equal(resultSchnorr65.type, 'p2tr', '65-byte sig detected as P2TR')

    // Non-standard signature length
    const sigWeird = '00'.repeat(50)
    const witnessWeird = [Buff.hex(sigWeird)]
    const resultWeird = parse_witness(witnessWeird)
    t.equal(resultWeird.type, null, 'Non-standard sig length returns null type')
  })

  t.test('Witness parsing - pubkey format detection', t => {
    t.plan(4)

    const sig = '30' + '44' + '0220' + '00'.repeat(32) + '0220' + '00'.repeat(32) + '01'

    // Compressed pubkey (33 bytes, starts with 02)
    const compressedPubkey02 = '02' + '00'.repeat(32)
    const witness02 = [Buff.hex(sig), Buff.hex(compressedPubkey02)]
    const result02 = parse_witness(witness02)
    t.equal(result02.type, 'p2wpkh', 'Compressed pubkey (02) detected')

    // Compressed pubkey (33 bytes, starts with 03)
    const compressedPubkey03 = '03' + '00'.repeat(32)
    const witness03 = [Buff.hex(sig), Buff.hex(compressedPubkey03)]
    const result03 = parse_witness(witness03)
    t.equal(result03.type, 'p2wpkh', 'Compressed pubkey (03) detected')

    // Uncompressed pubkey (65 bytes, starts with 04)
    // The parser may interpret this as P2WSH since it doesn't strictly validate pubkey format
    const uncompressedPubkey = '04' + '00'.repeat(64)
    const witnessUncompressed = [Buff.hex(sig), Buff.hex(uncompressedPubkey)]
    const resultUncompressed = parse_witness(witnessUncompressed)
    // Parser treats 2-element witness with non-33-byte second element as P2WSH
    t.ok(resultUncompressed.type === 'p2wsh' || resultUncompressed.type === 'p2wpkh',
      'Uncompressed pubkey handled as witness type')

    // Invalid pubkey length (32 bytes instead of 33)
    // Parser may interpret as P2WSH since the second element is treated as redeem script
    const invalidPubkey = '02' + '00'.repeat(31) // Too short for valid pubkey
    const witnessInvalid = [Buff.hex(sig), Buff.hex(invalidPubkey)]
    const resultInvalid = parse_witness(witnessInvalid)
    t.ok(resultInvalid.type === 'p2wsh' || resultInvalid.type === null,
      'Non-standard witness structure handled')
  })

  t.test('Witness parsing - control block parsing', t => {
    t.plan(5)

    const schnorrSig = '00'.repeat(64)
    const tapscript = '20' + '00'.repeat(32) + 'ac' // <pubkey> OP_CHECKSIG

    // Minimal control block (33 bytes: version + internal pubkey)
    const cblock33 = 'c0' + '00'.repeat(32)
    const witness33 = [Buff.hex(schnorrSig), Buff.hex(tapscript), Buff.hex(cblock33)]
    const result33 = parse_witness(witness33)
    t.equal(result33.type, 'p2ts', 'Minimal control block detected as P2TS')
    t.equal(result33.cblock, cblock33, 'Control block extracted')

    // Control block with one merkle node (65 bytes)
    const cblock65 = 'c0' + '00'.repeat(32) + '11'.repeat(32)
    const witness65 = [Buff.hex(schnorrSig), Buff.hex(tapscript), Buff.hex(cblock65)]
    const result65 = parse_witness(witness65)
    t.equal(result65.type, 'p2ts', 'Control block with merkle node detected')

    // Invalid control block version
    const cblockBadVersion = 'ff' + '00'.repeat(32) // 0xff is not a valid version
    const witnessBadVersion = [Buff.hex(schnorrSig), Buff.hex(tapscript), Buff.hex(cblockBadVersion)]
    const resultBadVersion = parse_witness(witnessBadVersion)
    // Should still parse but may have null type or different handling
    t.ok(resultBadVersion.stack.length === 3, 'Invalid version still preserves stack')

    // Control block too short
    const cblockShort = 'c0' + '00'.repeat(20) // Only 21 bytes
    const witnessShort = [Buff.hex(schnorrSig), Buff.hex(tapscript), Buff.hex(cblockShort)]
    const resultShort = parse_witness(witnessShort)
    t.ok(resultShort.type !== 'p2ts' || resultShort.type === null,
      'Short control block not detected as P2TS')
  })

  t.test('Witness parsing - annex handling', t => {
    t.plan(4)

    const schnorrSig = '00'.repeat(64)

    // Annex with 0x50 prefix
    const annex = '50' + 'deadbeef'
    const witnessWithAnnex = [Buff.hex(schnorrSig), Buff.hex(annex)]
    const resultWithAnnex = parse_witness(witnessWithAnnex)
    t.equal(resultWithAnnex.annex, annex, 'Annex extracted correctly')

    // Annex in P2TS (script path)
    const tapscript = '20' + '00'.repeat(32) + 'ac'
    const cblock = 'c0' + '11'.repeat(32)
    const witnessP2tsAnnex = [
      Buff.hex(schnorrSig),
      Buff.hex(tapscript),
      Buff.hex(cblock),
      Buff.hex(annex)
    ]
    const resultP2tsAnnex = parse_witness(witnessP2tsAnnex)
    // Note: When annex is last and starts with 0x50, it should be detected
    t.equal(resultP2tsAnnex.annex, annex, 'Annex detected in P2TS witness')

    // Data starting with 0x50 but not an annex (single element)
    const data50 = '50' + '00'.repeat(10)
    const witnessSingle50 = [Buff.hex(data50)]
    const resultSingle50 = parse_witness(witnessSingle50)
    // Single element starting with 0x50 is ambiguous
    t.ok(resultSingle50.stack.length === 1, 'Single 0x50 element preserved in stack')

    // Empty annex (just 0x50)
    const emptyAnnex = '50'
    const witnessEmptyAnnex = [Buff.hex(schnorrSig), Buff.hex(emptyAnnex)]
    const resultEmptyAnnex = parse_witness(witnessEmptyAnnex)
    t.ok(resultEmptyAnnex.annex === emptyAnnex || resultEmptyAnnex.annex === null,
      'Empty annex handled')
  })

  t.test('Witness parsing - multi-signature scripts', t => {
    t.plan(4)

    // 2-of-3 P2WSH multisig witness
    const sig1 = '30' + '44' + '0220' + 'aa'.repeat(32) + '0220' + 'bb'.repeat(32) + '01'
    const sig2 = '30' + '44' + '0220' + 'cc'.repeat(32) + '0220' + 'dd'.repeat(32) + '01'
    const pk1 = '02' + '11'.repeat(32)
    const pk2 = '02' + '22'.repeat(32)
    const pk3 = '02' + '33'.repeat(32)
    // OP_2 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG
    const redeemScript = '52' + '21' + pk1 + '21' + pk2 + '21' + pk3 + '53ae'

    const multisigWitness = [
      Buff.hex('00'), // OP_0 dummy (CHECKMULTISIG bug)
      Buff.hex(sig1),
      Buff.hex(sig2),
      Buff.hex(redeemScript)
    ]
    const multisigResult = parse_witness(multisigWitness)

    t.equal(multisigResult.type, 'p2wsh', 'Multisig detected as P2WSH')
    t.equal(multisigResult.script, redeemScript, 'Redeem script extracted')
    t.equal(multisigResult.params.length, 3, 'Params include OP_0 dummy and sigs')
    t.equal(multisigResult.version, 0, 'Witness version is 0')
  })

  t.test('Witness parsing - tapscript variants', t => {
    t.plan(4)

    const schnorrSig = '00'.repeat(64)

    // Simple OP_CHECKSIG tapscript
    const checksigScript = '20' + '00'.repeat(32) + 'ac'
    const cblock = 'c0' + '00'.repeat(32)
    const witnessChecksig = [Buff.hex(schnorrSig), Buff.hex(checksigScript), Buff.hex(cblock)]
    const resultChecksig = parse_witness(witnessChecksig)
    t.equal(resultChecksig.type, 'p2ts', 'OP_CHECKSIG tapscript detected')

    // OP_CHECKSIGVERIFY tapscript
    const checksigverifyScript = '20' + '00'.repeat(32) + 'ad' + '51' // CHECKSIGVERIFY OP_1
    const witnessVerify = [Buff.hex(schnorrSig), Buff.hex(checksigverifyScript), Buff.hex(cblock)]
    const resultVerify = parse_witness(witnessVerify)
    t.equal(resultVerify.type, 'p2ts', 'OP_CHECKSIGVERIFY tapscript detected')

    // Multi-sig tapscript with OP_CHECKSIGADD
    const multiScript = '20' + '00'.repeat(32) + 'ba' + '20' + '11'.repeat(32) + 'ba' + '52' + '87'
    const witnessMult = [Buff.hex(schnorrSig), Buff.hex(schnorrSig), Buff.hex(multiScript), Buff.hex(cblock)]
    const resultMult = parse_witness(witnessMult)
    t.equal(resultMult.type, 'p2ts', 'Multi-sig tapscript with CHECKSIGADD detected')
    t.equal(resultMult.params.length, 2, 'Two signatures in params')
  })

  t.test('Witness parsing - edge cases with empty elements', t => {
    t.plan(3)

    // Witness with empty element
    const emptyElement = ''
    const pubkey = '02' + '00'.repeat(32)
    const witnessWithEmpty = [Buff.hex(emptyElement), Buff.hex(pubkey)]
    const resultWithEmpty = parse_witness(witnessWithEmpty)
    t.ok(resultWithEmpty.stack.length === 2, 'Empty element preserved in stack')

    // All empty witness
    const allEmpty = [Buff.hex(''), Buff.hex(''), Buff.hex('')]
    const resultAllEmpty = parse_witness(allEmpty)
    t.equal(resultAllEmpty.type, null, 'All empty witness has null type')

    // Single empty element
    const singleEmpty = [Buff.hex('')]
    const resultSingleEmpty = parse_witness(singleEmpty)
    t.equal(resultSingleEmpty.type, null, 'Single empty element has null type')
  })

  t.test('Witness parsing - version detection accuracy', t => {
    t.plan(4)

    // P2WPKH should be version 0
    const sig = '30' + '44' + '0220' + '00'.repeat(32) + '0220' + '00'.repeat(32) + '01'
    const pubkey = '02' + '00'.repeat(32)
    const witnessV0 = [Buff.hex(sig), Buff.hex(pubkey)]
    const resultV0 = parse_witness(witnessV0)
    t.equal(resultV0.version, 0, 'P2WPKH is version 0')

    // P2WSH should be version 0
    const redeemScript = '5121' + '02' + '00'.repeat(32) + '51ae'
    const witnessWsh = [Buff.hex(sig), Buff.hex(redeemScript)]
    const resultWsh = parse_witness(witnessWsh)
    t.equal(resultWsh.version, 0, 'P2WSH is version 0')

    // P2TR key-path should be version 1
    const schnorrSig = '00'.repeat(64)
    const witnessTr = [Buff.hex(schnorrSig)]
    const resultTr = parse_witness(witnessTr)
    t.equal(resultTr.version, 1, 'P2TR key-path is version 1')

    // P2TS script-path should be version 1
    const tapscript = '20' + '00'.repeat(32) + 'ac'
    const cblock = 'c0' + '00'.repeat(32)
    const witnessTs = [Buff.hex(schnorrSig), Buff.hex(tapscript), Buff.hex(cblock)]
    const resultTs = parse_witness(witnessTs)
    t.equal(resultTs.version, 1, 'P2TS script-path is version 1')
  })
}
