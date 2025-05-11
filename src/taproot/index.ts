import * as TapCtrl    from './cblock.js'
import * as TapParser  from './parse.js'
import * as TapEncoder from './encode.js'
import * as TapTree    from './tree.js'

export * from './cblock.js'
export * from './encode.js'
export * from './parse.js'
export * from './tree.js'

export namespace TxTaproot {
  export const create = TapCtrl.create_taproot
  export const verify = TapCtrl.verify_cblock

  export const encode = {
    branch  : TapEncoder.encode_tapbranch,
    leaf    : TapEncoder.encode_tapleaf,
    script  : TapEncoder.encode_tapscript,
    tweak   : TapEncoder.encode_taptweak,
    version : TapEncoder.encode_leaf_version
  }

  export const parse = {
    cblock  : TapParser.parse_cblock,
    witness : TapParser.parse_taproot_witness
  }

  export const tree = {
    merkleize : TapTree.merkleize,
    get_root  : TapTree.get_taproot
  }
}
