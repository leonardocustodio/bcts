/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Hex dump utilities for CBOR data.
 *
 * Affordances for viewing the encoded binary representation of CBOR as hexadecimal.
 * Optionally annotates the output, breaking it up into semantically meaningful lines,
 * formatting dates, and adding names of known tags.
 *
 * The annotated rendering delegates to `@blockchaincommons/dcbor/diagnostic`.
 *
 * @module dump
 */

import { hexAnnotated as bcHexAnnotated } from "@blockchaincommons/dcbor/diagnostic";

import { type Cbor, cborData } from "./cbor";
import type { TagsStore } from "./tags-store";
import { getGlobalTagsStore } from "./tags-store";
import { toNew, delegating } from "./bridge";

/**
 * Options for hex formatting.
 */
export interface HexFormatOpts {
  /** Whether to annotate the hex dump with semantic information */
  annotate?: boolean;
  /** Optional tags store for resolving tag names */
  tagsStore?: TagsStore;
}

/**
 * Convert bytes to hex string.
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * Convert hex string to bytes.
 *
 * **Whitespace tolerance.** This implementation strips ASCII whitespace
 * before decoding so users can paste annotated hex dumps directly. Rust's
 * `hex::decode` is strict and panics on any whitespace. This is a
 * deliberate TS-side ergonomic divergence — callers who need strict
 * Rust-compatible parsing should validate the input first (e.g.
 * `if (/\s/.test(s)) throw …`).
 *
 * (Kept local rather than delegated: `@blockchaincommons/dcbor`'s
 * `hexToBytes` validates its input and throws on odd length or non-hex
 * characters; this legacy version stays permissive for compatibility.)
 */
export const hexToBytes = (hexString: string): Uint8Array => {
  const hex = hexString.replace(/\s/g, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Returns the encoded hexadecimal representation of CBOR.
 *
 * @param cbor - CBOR value to convert
 * @returns Hex string
 */
export const hex = (cbor: Cbor): string => bytesToHex(cborData(cbor));

/**
 * Returns the encoded hexadecimal representation of CBOR with options.
 *
 * Optionally annotates the output, e.g., breaking the output up into
 * semantically meaningful lines, formatting dates, and adding names of
 * known tags.
 *
 * @param cbor - CBOR value to convert
 * @param opts - Formatting options
 * @returns Hex string (possibly annotated)
 */
export const hexOpt = (cbor: Cbor, opts: HexFormatOpts = {}): string => {
  if (opts.annotate !== true) {
    return hex(cbor);
  }
  const tagsStore = opts.tagsStore ?? getGlobalTagsStore();
  return delegating(() => bcHexAnnotated(toNew(cbor), { tagsStore: tagsStore._inner }));
};

/**
 * Returns the encoded hexadecimal representation of CBOR, with annotations.
 *
 * @param cbor - CBOR value to convert
 * @param tagsStore - Optional tags store for tag name resolution
 * @returns Annotated hex string
 */
export const hexAnnotated = (cbor: Cbor, tagsStore?: TagsStore): string => {
  // Use global tags store if not provided
  tagsStore ??= getGlobalTagsStore();
  return hexOpt(cbor, { annotate: true, tagsStore });
};
