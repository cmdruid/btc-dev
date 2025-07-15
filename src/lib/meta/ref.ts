export namespace RefPointer {
  export const outpoint = {
    encode : encode_outpoint,
    decode : decode_outpoint,
    verify : verify_outpoint, 
    assert : assert_outpoint,
  }
  export const record_id = {
    encode : encode_inscription_id,
    decode : decode_inscription_id,
    verify : verify_inscription_id,
    assert : assert_inscription_id,
  }
  export const rune_id = {
    encode : encode_rune_id,
    decode : decode_rune_id,
    verify : verify_rune_id,
    assert : assert_rune_id,
  }
}

function encode_inscription_id (
  txid  : string,
  order : number = 0
) : string {
  return `${txid}i${order}`
}

function decode_inscription_id (
  inscription_id : string
) : { txid : string, order : number } {
  assert_inscription_id(inscription_id)
  const [ txid, order ] = inscription_id.split('i')
  return { txid, order : parseInt(order) }
}

function verify_inscription_id (
  inscription_id : string
) : boolean {
  return inscription_id.match(/^[a-f0-9]{64}i\d+$/) !== null
}

function assert_inscription_id (
  inscription_id : string
) : void {
  if (!verify_inscription_id(inscription_id)) {
    throw new Error(`invalid inscription id: ${inscription_id}`)
  }
}

function encode_rune_id (
  block_height : number,
  block_index  : number
) : string {
  return `${block_height}:${block_index}`
}

function decode_rune_id (
  rune_id : string
) : { block_height : number, block_index : number } {
  assert_rune_id(rune_id)
  const [ block_height, block_index ] = rune_id.split(':')
  return { block_height : parseInt(block_height), block_index : parseInt(block_index) }
}

function verify_rune_id (
  rune_id : string
) : boolean {
  return rune_id.match(/^\d+:\d+$/) !== null
}

function assert_rune_id (
  rune_id : string
) : void {
  if (!verify_rune_id(rune_id)) {
    throw new Error(`invalid rune id: ${rune_id}`)
  }
}

function encode_outpoint (
  txid  : string,
  vout  : number
) : string {
  return `${txid}:${vout}`
}

function decode_outpoint (
  outpoint : string
) : { txid : string, vout : number } {
  assert_outpoint(outpoint)
  const [ txid, vout ] = outpoint.split(':')
  return { txid, vout : parseInt(vout) }
}

function verify_outpoint (
  outpoint : string
) : boolean {
  return outpoint.match(/^[a-f0-9]{64}:[0-9]+$/) !== null
}

function assert_outpoint (
  outpoint : string
) : void {
  if (!verify_outpoint(outpoint)) {
    throw new Error(`invalid outpoint: ${outpoint}`)
  }
}
