import { generate_sighash_vectors } from './src/generate/sighash.js'

const vectors = generate_sighash_vectors()

console.log(JSON.stringify(vectors, null, 2))
