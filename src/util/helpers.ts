export function now () {
  return Math.floor(Date.now() / 1000)
}

export async function sleep (ms : number = 1000) {
  return new Promise(res => setTimeout(res, ms))
}

export function parse_error (err : unknown) : string {
  if (err instanceof Error) {
    return err.message
  }
  return String(err)
}
