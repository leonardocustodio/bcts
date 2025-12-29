/**
 * ByteString pattern for dCBOR pattern matching.
 *
 * @module pattern/value/bytestring-pattern
 */

import type { Cbor } from "@bcts/dcbor";
import { asBytes, bytesToHex } from "@bcts/dcbor";
import type { Path } from "../../format";

/**
 * Pattern for matching byte string values in dCBOR.
 *
 * The BinaryRegex variant matches against raw bytes by converting them to
 * a Latin-1 string (where each byte 0-255 maps to exactly one character).
 * This mimics Rust's regex::bytes::Regex behavior.
 *
 * For example:
 * - To match bytes starting with 0x00: `/^\x00/`
 * - To match ASCII digits: `/^\d+$/`
 * - To match specific hex pattern: `/\x48\x65\x6c\x6c\x6f/` (matches "Hello")
 */
export type ByteStringPattern =
  | { readonly variant: "Any" }
  | { readonly variant: "Value"; readonly value: Uint8Array }
  | { readonly variant: "BinaryRegex"; readonly pattern: RegExp };

/**
 * Creates a ByteStringPattern that matches any byte string.
 */
export const byteStringPatternAny = (): ByteStringPattern => ({
  variant: "Any",
});

/**
 * Creates a ByteStringPattern that matches a specific byte string value.
 */
export const byteStringPatternValue = (
  value: Uint8Array,
): ByteStringPattern => ({
  variant: "Value",
  value,
});

/**
 * Creates a ByteStringPattern that matches byte strings by binary regex.
 *
 * The regex matches against raw bytes converted to a Latin-1 string.
 * Use escape sequences like `\x00` to match specific byte values.
 *
 * @example
 * ```typescript
 * // Match bytes starting with 0x00
 * byteStringPatternBinaryRegex(/^\x00/)
 *
 * // Match ASCII "Hello"
 * byteStringPatternBinaryRegex(/Hello/)
 *
 * // Match any digits
 * byteStringPatternBinaryRegex(/^\d+$/)
 * ```
 */
export const byteStringPatternBinaryRegex = (
  pattern: RegExp,
): ByteStringPattern => ({
  variant: "BinaryRegex",
  pattern,
});

/**
 * Compares two Uint8Arrays for equality.
 */
const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Converts a Uint8Array to a Latin-1 string for regex matching.
 * Each byte value (0-255) maps directly to a character code.
 * This mimics Rust's regex::bytes::Regex behavior.
 */
const bytesToLatin1 = (bytes: Uint8Array): string => {
  // Use String.fromCharCode for direct byte-to-char mapping
  // This preserves all byte values including 0x00-0xFF
  let result = "";
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
};

/**
 * Tests if a CBOR value matches this byte string pattern.
 */
export const byteStringPatternMatches = (
  pattern: ByteStringPattern,
  haystack: Cbor,
): boolean => {
  const value = asBytes(haystack);
  if (value === undefined) {
    return false;
  }
  switch (pattern.variant) {
    case "Any":
      return true;
    case "Value":
      return bytesEqual(value, pattern.value);
    case "BinaryRegex": {
      // Convert bytes to Latin-1 string for regex matching
      // This mimics Rust's regex::bytes::Regex behavior
      const latin1String = bytesToLatin1(value);
      return pattern.pattern.test(latin1String);
    }
  }
};

/**
 * Returns paths to matching byte string values.
 */
export const byteStringPatternPaths = (
  pattern: ByteStringPattern,
  haystack: Cbor,
): Path[] => {
  if (byteStringPatternMatches(pattern, haystack)) {
    return [[haystack]];
  }
  return [];
};

/**
 * Formats a ByteStringPattern as a string.
 */
export const byteStringPatternDisplay = (
  pattern: ByteStringPattern,
): string => {
  switch (pattern.variant) {
    case "Any":
      return "bstr";
    case "Value":
      return `h'${bytesToHex(pattern.value)}'`;
    case "BinaryRegex":
      return `h'/${pattern.pattern.source}/'`;
  }
};

/**
 * Compares two ByteStringPatterns for equality.
 */
export const byteStringPatternEquals = (
  a: ByteStringPattern,
  b: ByteStringPattern,
): boolean => {
  if (a.variant !== b.variant) {
    return false;
  }
  switch (a.variant) {
    case "Any":
      return true;
    case "Value":
      return bytesEqual(a.value, (b as typeof a).value);
    case "BinaryRegex":
      return a.pattern.source === (b as typeof a).pattern.source;
  }
};
