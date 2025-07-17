import { Buff, Bytes }       from '@vbyte/buff'
import { LOCK_SCRIPT_REGEX } from '@/const.js'

import type {
  LockScriptInfo,
  LockScriptType,
  WitnessVersion
} from '@/types/index.js'

export function is_return_script (script : Bytes) : boolean {
  const bytes = Buff.bytes(script)
  return bytes.at(0) === 0x6a
}

export function get_lock_script_info (script : Bytes) : LockScriptInfo {
  return {
    type    : get_lock_script_type(script),
    version : get_lock_script_version(script)
  }
}

export function get_lock_script_type (script : Bytes) : LockScriptType | null {
  // Get the hex string of the script.
  const hex = Buff.bytes(script).hex
  // Iterate over the lock script regexes.
  for (const [ type, regex ] of Object.entries(LOCK_SCRIPT_REGEX)) {
    // If the script matches the regex, return the type.
    if (regex.test(hex)) return type as LockScriptType
  }
  // If the script does not match any regex, return null.
  return null
}

export function get_lock_script_version (script : Bytes) : WitnessVersion | null {
  // Get the version of the script.
  const version = Buff.bytes(script)
  // Return the version of the script.
  switch (version.at(0)) {
    case 0x00 : return 0
    case 0x51 : return 1
    default   : return null
  }
}

export function is_p2pkh_script (script : Bytes) : boolean {
  const hex = Buff.bytes(script).hex
  return LOCK_SCRIPT_REGEX['p2pkh'].test(hex)
}

export function is_p2sh_script (script : Bytes) : boolean {
  const hex = Buff.bytes(script).hex
  return LOCK_SCRIPT_REGEX['p2sh'].test(hex)
}

export function is_p2wpkh_script (script : Bytes) : boolean {
  const hex = Buff.bytes(script).hex
  return LOCK_SCRIPT_REGEX['p2wpkh'].test(hex)
}

export function is_p2wsh_script (script : Bytes) : boolean {
  const hex = Buff.bytes(script).hex
  return LOCK_SCRIPT_REGEX['p2wsh'].test(hex)
}

export function is_p2tr_script (script : Bytes) : boolean {
  const hex = Buff.bytes(script).hex
  return LOCK_SCRIPT_REGEX['p2tr'].test(hex)
}

export function is_opreturn_script (script : Bytes) : boolean {
  const hex = Buff.bytes(script).hex
  return LOCK_SCRIPT_REGEX['opreturn'].test(hex)
}
