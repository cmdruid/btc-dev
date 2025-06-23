import { zod, byte32, uint } from '@vbyte/micro-lib/schema'

export const taptree = zod.union([ zod.array(byte32), byte32 ])

export const config = zod.object({
  pubkey  : byte32,
  leaves  : taptree.array().optional(),
  target  : byte32.optional(),
  version : uint.optional(),
})
