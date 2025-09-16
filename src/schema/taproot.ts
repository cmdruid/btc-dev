import { z } from 'zod'

import { byte32, uint } from './base.js'

export const taptree = z.union([ z.array(byte32), byte32 ])

export const config = z.object({
  pubkey  : byte32,
  leaves  : taptree.array().optional(),
  target  : byte32.optional(),
  version : uint.optional(),
})
