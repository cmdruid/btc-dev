import { Buff, Bytes } from '@cmdcode/buff'

import * as check from './check.js'

export function ok (
  value    : unknown,
  message ?: string
) : asserts value {
  if (value === false) {
    throw new Error(message ?? 'Assertion failed!')
  }
}

export function exists <T> (
  value : T | null,
  msg  ?: string
  ) : asserts value is NonNullable<T> {
  if (!check.exists(value)) {
    throw new Error(msg ?? 'Value is null or undefined!')
  }
}

export function size (input : Bytes, size : number) : void {
  const bytes = Buff.bytes(input)
  if (bytes.length !== size) {
    throw new Error(`Invalid input size: ${bytes.hex} !== ${size}`)
  }
}

export function is_hex (
  value : unknown,
  msg  ?: string
  ) : asserts value is string {
  if (!check.is_hex(value)) {
    throw new Error(msg ?? 'Value is invalid hex.')
  }
}
