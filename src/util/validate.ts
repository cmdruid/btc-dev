import { Buff, Bytes } from '@cmdcode/buff'
import { z }           from 'zod'

export namespace Test {
  
  export function exists <T> (
    value ?: T | null
  ) : value is NonNullable<T> {
    if (typeof value === 'undefined' || value === null) {
      return false
    }
    return true
  }

  export function has_items (array : unknown) : array is any[] {
    return Array.isArray(array) && array.length > 0
  }

  export function is_int (value : unknown) : value is number {
    return Number.isInteger(value)
  }

  export function is_bigint (value : unknown) : value is bigint {
    return typeof value === 'bigint'
  }

  export function is_hex (
    value : unknown
  ) : value is string {
    if (
      typeof value === 'string'            &&
      value.match(/[^a-fA-F0-9]/) === null &&
      value.length % 2 === 0
    ) {
      return true
    }
    return false
  }

  export function is_hash (value : unknown) : value is string {
    if (is_hex(value) && value.length === 64) {
      return true
    }
    return false
  }

  export function is_schema <S extends z.ZodTypeAny> (
    input  : unknown,
    schema : S
  ) : input is z.infer<S> {
    return schema.safeParse(input).success
  }
}

export namespace Assert {

  export function ok (
    value    : unknown,
    message ?: string
  ) : asserts value {
    if (value === false) {
      throw new Error(message ?? 'assertion failed')
    }
  }

  export function exists <T> (
    value : T | null,
    msg  ?: string
    ) : asserts value is NonNullable<T> {
    if (!Test.exists(value)) {
      throw new Error(msg ?? 'value is null or undefined')
    }
  }

  export function is_int (value : unknown) : asserts value is number {
    if (!Test.is_int(value)) {
      throw new TypeError(`invalid number: ${String(value)}`)
    }
  }

  export function is_bigint (value : unknown) : asserts value is bigint {
    if (!Test.is_bigint(value)) {
      throw new TypeError(`invalid bigint: ${String(value)}`)
    }
  }

  export function is_hex (value : unknown) : asserts value is string {
    if (!Test.is_hex(value)) {
      throw new TypeError(`invalid hex: ${String(value)}`)
    }
  }

  export function is_hash (value : unknown, msg ?: string) : asserts value is string {
    if (!Test.is_hash(value)) {
      throw new TypeError(msg ?? `invalid hash: ${String(value)}`)
    }
  }

  export function size (input : Bytes, size : number, msg ?: string) : void {
    const bytes = Buff.bytes(input)
    if (bytes.length !== size) {
      throw new Error(msg ?? `Invalid input size: ${bytes.hex} !== ${size}`)
    }
  }

  export function has_items (array : unknown, err_msg? : string) : asserts array is any[] {
    if (!Test.has_items(array)) {
      throw new Error(err_msg ?? 'array does not contain any items')
    }
  }

  export function is_schema <S extends z.ZodTypeAny> (
    input  : unknown,
    schema : S,
    msg?   : string
  ) : asserts input is z.infer<S> {
    if (!schema.safeParse(input).success) {
      throw new Error(msg ?? 'input failed schema validation')
    }
  }
}
