import { get_ctrl_block, get_taproot_key } from './lib/api.js'
import { get_taproot_ctx } from './lib/ctx.js'
import { encode_tapleaf }  from './lib/encode.js'

export * from './const.js'
export * from './lib/api.js'
export * from './lib/ctx.js'
export * from './lib/decode.js'
export * from './lib/encode.js'
export * from './lib/tree.js'
export * from './lib/tweak.js'

export default {
  get_block : get_ctrl_block,
  get_ctx   : get_taproot_ctx,
  get_key   : get_taproot_key,
  get_leaf  : encode_tapleaf
}
