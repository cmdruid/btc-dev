import { Buff }               from '@cmdcode/buff'
import { hash340 }            from '../util/hash.js'
import { Assert }             from '../util/index.js'
import { prefix_script_size } from '../script/index.js'

import { TAPLEAF_DEFAULT_VERSION } from '../const.js'

const DEFAULT_VERSION = TAPLEAF_DEFAULT_VERSION

export function encode_tapscript (
  script  : string | Uint8Array,
  version = DEFAULT_VERSION
) : Buff {
  const preimg = prefix_script_size(script)
  return encode_tapleaf(preimg, version)
}

export function encode_tapleaf (
  data : string | Uint8Array,
  version = DEFAULT_VERSION
) : Buff {
  const vbyte = encode_leaf_version(version)
  return hash340('TapLeaf', vbyte, data)
}

export function encode_tapbranch (
  leaf_a : string,
  leaf_b : string
) : Buff {
  // Compare leaves in lexical order.
  if (leaf_b < leaf_a) {
    // Swap leaves if needed.
    [ leaf_a, leaf_b ] = [ leaf_b, leaf_a ]
  }
  // Return digest of leaves as a branch hash.
  return hash340('TapBranch', leaf_a, leaf_b)
}

export function encode_leaf_version (version = 0xc0) : number {
  return version & 0xfe
}

export function encode_taptweak (
  pubkey : string | Uint8Array,
  data   : string | Uint8Array = new Uint8Array()
) : Buff {
  Assert.size(pubkey, 32)
  return hash340('TapTweak', pubkey, data)
}
