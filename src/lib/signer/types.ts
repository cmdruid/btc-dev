import { Bytes } from '@cmdcode/buff'

export interface SignerAPI {
  sign : (msg : Bytes) => Bytes
}
