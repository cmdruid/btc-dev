import { Test }          from 'tape'
import { CoreWallet }    from '@cmdcode/core-cmd'
import { get_utxo }      from 'test/core.js'
import { assert, check } from '@cmdcode/tapscript2/util'
import { get_pubkey }    from '@cmdcode/crypto-tools/keys'

import {
  parse_address,
  P2TR
} from '@cmdcode/tapscript2/address'

import {
  sign_taproot_tx,
  verify_taproot_tx
} from '@cmdcode/tapscript2/signer'

import {
  encode_tapscript,
  get_taproot_ctx
} from '@cmdcode/tapscript2/taproot'

import {
  encode_tx,
  parse_tx
} from '@cmdcode/tapscript2/tx'

const { VERBOSE = false } = process.env

export async function script_spend (
  wallet : CoreWallet,
  tap    : Test
) : Promise<void> {
  // We are using core command to run this transaction through bitcoin core.
  const ret_addr = await wallet.new_address
  tap.test('Basic spend using tapscript.', async t => {
    t.plan(1)
    try {
      // Create a keypair to use for testing.
      const secret = '0a7d01d1c2e1592a02ea7671bb79ecd31d8d5e660b008f4b10e67787f4f24712'
      const pubkey = get_pubkey(secret, true).hex

      // Specify a basic script to use for testing.
      const script  = [ pubkey, 'OP_CHECKSIG' ]
      const tapleaf = encode_tapscript(script)

      // Generate a tapkey that includes our leaf script. Also, create a merlke proof 
      // (cblock) that targets our leaf and proves its inclusion in the tapped key.
      const { tapkey, cblock } = get_taproot_ctx({ int_key : pubkey, leaves : [ tapleaf ] })

      // A taproot address is simply the tweaked public key, encoded in bech32 format.
      const address = P2TR.create(tapkey, 'regtest')
      // Send funds to the taproot address and receive a utxo.
      const txinput = await get_utxo(address, 100_000, wallet, true)

      if (VERBOSE) console.log('Your address:', address)

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
      const opt = { txindex: 0, extension : tapleaf }
      const sig = sign_taproot_tx(secret, txdata, opt)

      // Add the signature to our witness data for input 0, along with the script
      // and merkle proof (cblock) for the script.
      txdata.vin[0].witness = [ sig.hex, script, cblock ]

      // Check if the signature is valid for the provided public key, and that the
      // transaction is also valid (the merkle proof will be validated as well).
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
