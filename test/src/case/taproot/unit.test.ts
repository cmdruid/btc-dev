import { Test } from 'tape'
import { P2TR } from 'tapscript2/address'

import { encode_script, prefix_script_size } from 'tapscript2/script'

import {
  encode_taptweak,
  encode_tapleaf,
  encode_tapbranch,
  verify_cblock,
  create_taproot,
  encode_tapscript
} from 'tapscript2/taproot'

import test_vectors from './unit.vectors.json' assert { type: 'json' }

export default function (t : Test) {
  t.test('Testing tapleaf creation:', t => {
    const vectors = test_vectors.tapleaf
    t.plan(vectors.length)
    for (const [ script, target ] of vectors) {
      const preimg = prefix_script_size(script)
      const hash   = encode_tapleaf(preimg)
      t.equal(hash.hex, target, 'Tapleaf should match')
    }
  })
  t.test('Testing tapbranch creation', t => {
    const vectors = test_vectors.tapbranch
    t.plan(vectors.length)
    for (const [ branch_left, branch_right, target ] of vectors) {
      const hash = encode_tapbranch(branch_left, branch_right)
      t.equal(hash.hex, target, 'Tapbranch should match')
    }
  })
  t.test('Testing taproot creation', t => {
    const vectors = test_vectors.taproot
    t.plan(vectors.length)
    for (const [ pubkey, tweak, target ] of vectors) {
      const taptweak = encode_taptweak(pubkey, tweak)
      t.equal(taptweak.hex, target, 'Taptweak should match')
    }
  }),
  t.test('Testing control block creation', t => {
    const vectors = test_vectors.ctrlblock
    t.plan(vectors.length)
    for (const { scripts: asm, index, pubkey, cblock: target } of vectors) {
      const scripts = asm.map(e => encode_script(e))
      const leaves  = scripts.map(e => encode_tapscript(e))
      const tapleaf = encode_tapscript(scripts[index])
      const context = create_taproot({ pubkey, leaves, target : tapleaf })
      t.equal(context.cblock, target, 'Control block should match')
    }
  }),
  t.test('Testing control block validation', t => {
    const vectors = test_vectors.ctrlblock
    t.plan(vectors.length)
    for (const { address, scripts, index, cblock } of vectors) {
      const decoded = P2TR.decode(address)
      const script  = encode_script(scripts[index])
      const target  = encode_tapscript(script).hex
      const isValid = verify_cblock(decoded.data, target, cblock)
      t.true(isValid, 'Control block should be valid.')
    }
  })
}
