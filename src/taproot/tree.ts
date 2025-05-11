import { Buff }             from '@cmdcode/buff'
import { encode_tapbranch } from './encode.js'

import {
  TapTree,
  MerkleProof
} from '../types/index.js'

/**
 * Get the root of a taproot tree.
 * @param leaves - The leaves of the tree.
 * @returns The root of the tree.
 */
export function get_taproot (leaves : TapTree) {
  // Process the merkle tree, and return the root.
  return merkleize(leaves)[0]
}

/**
 * Process a taproot tree into a merkle proof.
 * @param taptree - The leaves of the tree.
 * @param target  - The target leaf of the tree.
 * @param path    - The recursive path of the tree.
 * @returns The root of the tree.
 */
export function merkleize (
  taptree : TapTree,
  target ?: string,
  path    : string[] = []
) : MerkleProof {
  // Initialize the leaves and tree arrays.
  const leaves : string[] = []
  const tree   : string[] = []
  // If there are no leaves, throw an error.
  if (taptree.length < 1) {
    throw new Error('Tree is empty!')
  }
  // Crawl through the tree, and find each leaf.
  for (let i = 0; i < taptree.length; i++) {
    // Get the current leaf as bytes.
    const bytes = taptree[i]
    // If the leaf is an array,
    if (Array.isArray(bytes)) {
      // Recursively process the nested tree.
      let [ tapleaf, new_target, branches ] = merkleize(bytes, target)
      // Update the target leaf.
      target = new_target
      // Add the nested tapleaf to the leaves array.
      leaves.push(tapleaf)
      // For each branch node,
      for (const branch of branches) {
        // Add the branch to the path.
        path.push(branch)
      }
    } else {
      // Convert the leaf to a hex string.
      const leaf = Buff.bytes(bytes).hex
      // Add the leaf to the leaves array.
      leaves.push(leaf)
    }
  }

  // If there is only one leaf,
  if (leaves.length === 1) {
    // Return the leaf as the root.
    return [ leaves[0], target, path ]
  }
  // Ensure the tree is sorted at this point.
  leaves.sort()
  // Ensure the tree is balanced evenly.
  if (leaves.length % 2 !== 0) {
    // If uneven, duplicate the last leaf.
    leaves.push(leaves[leaves.length - 1])
  }
  // Sort through the leaves (two at a time).
  for (let i = 0; i < leaves.length - 1; i += 2) {
    // Compute two leaves into a branch.
    const branch = encode_tapbranch(leaves[i], leaves[i + 1]).hex
    // Push our branch to the tree.
    tree.push(branch)
    // Check if a proof target is specified.
    if (typeof target === 'string') {
      // Check if this branch is part of our proofs.
      if (target === leaves[i]) {
        // If so, include right-side of branch.
        path.push(leaves[i + 1])
        target = branch
      } else if (target === leaves[i + 1]) {
        // If so, include left-side of branch.
        path.push(leaves[i])
        target = branch
      }
    }
  }
  // Recursively process the tree.
  return merkleize(tree, target, path)
}
