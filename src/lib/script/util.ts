import { Buff } from '@cmdcode/buff'

export function prefix_script_size (script: string | Uint8Array): string {
  return Buff.bytes(script).add_varint('le').hex
}

export function parse_script_pubkeys (script: string | Uint8Array): string[] {
  // Convert the script to a string if it's a Uint8Array
  const scriptHex = typeof script === 'string' ? script : Buff.bytes(script).hex
  
  // Define the regex pattern to match the specified pattern
  // 20 = pushdata byte for 32 bytes (0x20)
  // [0-9a-f]{64} = 32-byte hex string (64 hex characters)
  // (ac|ad|ba) = OP_CHECKSIG (0xac), OP_CHECKSIGVERIFY (0xad), or OP_CHECKSIGADD (0xba)
  const pubkeyPattern = /20([0-9a-f]{64})(ac|ad|ba)/gi
  
  // Find all matches in the script
  const matches = [...scriptHex.matchAll(pubkeyPattern)]
  
  // Extract the public keys from the matches
  return matches.map(match => match[1])
}

// export function parse_witness_pubkeys (
//   witness : string[] | TxWitnessData
// ) : string[] {
//   // Parse the witness data if it is an array.
//   if (witness instanceof Array) {
//     witness = parse_witness_data(witness)
//   }
//   // Define the set of pubkeys.
//   const pubkeys = new Set<string>()
//   // Get the witness type.
//   const type = witness.type
//   // If the witness type is a p2tr-ts:
//   if (type === 'p2tr-ts') {
//     // Parse the internal pubkey from the cblock.
//     const int_pk = witness.cblock?.slice(2, 66)
//     // If the internal pubkey is present, add it to the list.
//     if (int_pk !== undefined) pubkeys.add(int_pk)
//     // Parse any pubkeys witness parameters.
//     witness.params
//       .filter(p => p.length === 64)
//       .forEach(p => pubkeys.add(p))
//     // Parse any pubkeys from the script.
//     parse_taproot_pubkeys(witness.script!)
//       .forEach(p => pubkeys.add(p))
//   // If the witness type is a p2w-pkh:
//   } else if (type === 'p2w-pkh') {
//     // Parse the witness parameter pubkey.
//     const params_pk = witness.params.find(p => p.length === 66)
//     // If the parameter pubkey is present, add it to the list.
//     if (params_pk !== undefined) pubkeys.add(params_pk)
//   // If the witness type is a p2w-sh:
//   } else if (type === 'p2w-sh') {
//     // Parse any witness parameter pubkeys.
//     witness.params
//       .filter(p => p.length === 66)
//       .forEach(p => pubkeys.add(p))
//     // Parse any script pubkeys.
//     parse_segwit_pubkeys(witness.script!)
//       .forEach(p => pubkeys.add(p))
//   }
//   // Return the list of pubkeys.
//   return Array.from(pubkeys)
// }

// function parse_segwit_pubkeys (script : string) : string[] {
//   const regex = /21([0-9a-f]{66})(ac|ad)/gi
//   const matches = [...script.matchAll(regex)]
//   return matches.map(match => match[1])
// }

// function parse_taproot_pubkeys (script : string) : string[] {
//   const regex = /20([0-9a-f]{64})(ac|ad|ba)/gi
//   const matches = [...script.matchAll(regex)]
//   return matches.map(match => match[1])
// }
