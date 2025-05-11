import { Test }          from 'tape'
import { CoreWallet }    from '@cmdcode/core-cmd'
import { get_utxo }      from '#/core.js'
import { get_pubkey }    from '@cmdcode/crypto-tools/keys'
import { assert, check } from '@cmdcode/tapscript2/util'

import {
  parse_address,
  P2TR
} from '@cmdcode/tapscript2/address'

import {
  encode_tapscript,
  get_taproot_ctx
} from '@cmdcode/tapscript2/taproot'

import {
  encode_tx,
  parse_tx
} from '@cmdcode/tapscript2/tx'
import { sign_taproot_tx, verify_taproot_tx } from '@cmdcode/tapscript2/signer'

const { VERBOSE = false } = process.env

export async function tree_spend (
  wallet : CoreWallet,
  tap    : Test
) : Promise<void> {
  const ret_addr = await wallet.new_address
  tap.test('Spend a script inside a tree.', async t => {
    t.plan(1)
    try {
      // Create a keypair to use for testing.
      const secret = '0a7d01d1c2e1592a02ea7671bb79ecd31d8d5e660b008f4b10e67787f4f24712'
      const pubkey = get_pubkey(secret, true).hex

      // Specify an array of scripts to use for testing.
      const scripts = [
        [ 1, 7, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ],
        [ 2, 6, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ],
        [ 3, 5, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ],
        [ 4, 4, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ],
        [ 5, 3, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ],
        [ 6, 2, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ],
        [ 7, 1, 'OP_ADD', 8, 'OP_EQUALVERIFY', pubkey, 'OP_CHECKSIG' ]
      ]

      // Convert our array of scripts into tapleaves.
      const leaves = scripts.map(s => encode_tapscript(s))

      if (VERBOSE) console.log('tree:', leaves)

      // Pick one of our scripts as a target for spending.
      const index  = Math.floor(Math.random() * 10) % 7
      const script = scripts[index]
      const target = encode_tapscript(script)

      if (VERBOSE) console.log('target script:', script)

      // Generate a tapkey that includes our tree. Also, create a merlke proof 
      // (cblock) that targets our leaf and proves its inclusion in the tapkey.
      const { tapkey, cblock } = get_taproot_ctx({ int_key : pubkey, leaves, target })

      // A taproot address is simply the tweaked public key, encoded in bech32 format.
      const address = P2TR.create(tapkey, 'regtest')

      // Send funds to the taproot address and receive a utxo.
      const txinput = await get_utxo(address, 100_000, wallet, true)

      if (VERBOSE) console.log('Your address:', address)

      /* NOTE: To continue with this example, send 100_000 sats to the above address.
        You will also need to make a note of the txid and vout of that transaction,
        so that you can include that information below in the redeem tx.
      */ 

      const txdata = parse_tx({
        vin  : [ txinput ],
        vout : [{
          // We are leaving behind 1000 sats as a fee to the miners.
          value: 99_000,
          // This is the new script that we are locking our funds to.
          scriptPubKey: parse_address(ret_addr).asm
        }]
      })

      // For this example, we are signing for input 0 of our transaction,
      // using the untweaked secret key. We are also extending the signature 
      // to include a commitment to the tapleaf script that we wish to use.
      const opt = { txindex: 0, script }
      const sig = sign_taproot_tx(secret, txdata, opt)

      // Add the signature to our witness data for input 0, along with the script
      // and merkle proof (cblock) for the script.
      txdata.vin[0].witness = [ sig.hex, script, cblock ]

      // Test if the transaction is valid using our verify method.
      const is_valid = verify_taproot_tx(txdata, { txindex : 0, pubkey, throws : true })
      assert.ok(is_valid, 'Transaction failed validation.')
      // Test if the transaction is valid through bitcoin core.
      const txhex = encode_tx(txdata)
      const txid  = await wallet.client.publish_tx(txhex)
      assert.ok(check.is_hex(txid), 'transaction failed to broadcast')

      if (VERBOSE) {
        console.log('Your txid:', txid)
        console.dir(txdata, { depth: null })
      }

      t.pass('transaction broadcast ok')
    } catch (err) {
      if (VERBOSE) console.error(err)
      const { message } = err as Error
      t.fail(message)   
    }
  })
}
