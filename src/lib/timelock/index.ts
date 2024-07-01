import { create_sequence } from './lib/create.js'

import {
  parse_locktime,
  parse_sequence
} from './lib/parse.js'

export * from './lib/create.js'
export * from './lib/parse.js'

export default {
  create : {
    sequence : create_sequence
  },
  parse : {
    locktime : parse_locktime,
    sequence : parse_sequence
  }
}
