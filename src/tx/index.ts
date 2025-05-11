import * as TxCalc     from './calc.js'
import * as TxCreate   from './create.js'
import * as TxDecode   from './decode.js'
import * as TxEncode   from './encode.js'
import * as TxParse    from './parse.js'
import * as TxValidate from './validate.js'

export * from './class.js'
export * from './create.js'
export * from './decode.js'
export * from './encode.js'
export * from './parse.js'
export * from './validate.js'

export namespace TxUtil {
  export const create_tx           = TxCreate.create_tx_data
  export const create_txin         = TxCreate.create_tx_input
  export const create_txout        = TxCreate.create_tx_output
  export const parse_tx            = TxParse.parse_tx_data
  export const encode_tx           = TxEncode.encode_tx_data
  export const decode_tx           = TxDecode.decode_tx_data
  export const get_txid            = TxCalc.get_txid
  export const get_tx_size         = TxCalc.get_txsize
  export const get_txin_size       = TxCalc.get_txin_size
  export const get_txout_size      = TxCalc.get_txout_size
  export const get_witness_vsize   = TxCalc.get_witness_vsize
  export const get_vout_type       = TxCalc.get_vout_type
  export const get_vout_version    = TxCalc.get_vout_version
  export const validate_tx         = TxValidate.validate_tx_data
  export const validate_vin        = TxValidate.validate_tx_input
  export const validate_vout       = TxValidate.validate_tx_output
}
