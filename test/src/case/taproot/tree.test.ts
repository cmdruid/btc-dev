import { Test } from 'tape'
import { Buff } from '@cmdcode/buff'
import { ECC }  from '@/util/index.js'

import {
  encode_taptweak,
  get_taproot,
  create_taproot,
  encode_tapscript
} from 'tapscript2/taproot'

import tree_vectors from './tree.vectors.json' assert { type: 'json' }

interface Vector {
  internalPubkey : string
  scripts        : string[]
  leafHashes     : Array<string | string[]>
  merkleRoot     : string | null
  tweak          : string
  tweakedPubkey  : string
  scriptPubKey   : string
  address        : string
  cblocks        : string[]
}

function flattenArray (
  arr : Array<string | string[]>
) : string[] {
  const ret : string[] = []
  for (const e of arr) {
    if (Array.isArray(e)) {
      ret.push(...flattenArray(e))
    } else { ret.push(e) }
  }
  return ret
}

export default function (t : Test) {
  t.test('E2E test of tap-key tweaking', t => {
    const vectors : Vector[] = tree_vectors.vectors
    for (const vector of vectors) {
      // Unpack our vector data.
      const { internalPubkey, scripts, merkleRoot, tweakedPubkey, tweak, cblocks, leafHashes } = vector
      // Copy leaf array (so the original does not get mutated).
      if (scripts.length === 0) {
        t.test('Testing empty key tweak.', t => {
          t.plan(1)
          const taptweak = encode_taptweak(internalPubkey)
          const tapkey   = ECC.tweak_pubkey(internalPubkey, taptweak, 'bip340')
          t.equal(tapkey.hex, tweakedPubkey, 'Tweaked pubs should match.')
        })
      } else {
        t.test('Testing key: ' + tweakedPubkey, t => {
          t.plan(3)
          const root     = get_taproot(leafHashes)
          t.equal(root, merkleRoot, 'Root hash should match.')
          const taptweak = encode_taptweak(internalPubkey, merkleRoot as string)
          t.equal(taptweak.hex, tweak, 'Tweak hash should match.')
          const tapkey   = ECC.tweak_pubkey(internalPubkey, tweak, 'bip340')
          t.equal(tapkey.hex, tweakedPubkey, 'Tweaked pubs should match.')
        })

        const leaves = flattenArray(leafHashes)
        
        for (let i = 0; i < leaves.length; i++) {
          t.test('Testing leaf: ' + leaves[i], t => {
            t.plan(2)
            const pubkey  = internalPubkey
            const cbyte   = Buff.hex(cblocks[i]).slice(0, 1).num
            const version = cbyte & 0xfe
            const leaves  = scripts.map(e => encode_tapscript(e, version))
            const target  = encode_tapscript(scripts[i], version)
            const ctx     = create_taproot({ pubkey, leaves: leafHashes, target, version })
            t.equal(target.hex, leaves[i].hex, 'Leaf hash should match.')
            t.equal(ctx.cblock, cblocks[i],    'Control blocks should be equal.')
          })
        }
      }
    }
  })
}
