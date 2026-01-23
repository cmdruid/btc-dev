import type { ScriptInfo } from "./script.js";

export type AddressFormat = "base58" | "bech32" | "bech32m";
export type AddressType = "p2pkh" | "p2sh" | "p2wpkh" | "p2wsh" | "p2tr";
export type ChainNetwork = "main" | "testnet" | "regtest" | string;

export type AddressConfigEntry = [
	prefix: string,
	type: AddressType,
	network: ChainNetwork,
	size: number,
	format: AddressFormat,
	version: number,
];

export interface EncoderConfig {
	format: AddressFormat;
	data: Uint8Array;
	prefix?: string;
	version?: number;
}

export interface AddressConfig {
	format: AddressFormat;
	network: ChainNetwork;
	prefix: string;
	size: number;
	type: AddressType;
	version: number;
}

export interface AddressInfo extends AddressConfig {
	data: string;
	script: ScriptInfo;
}
