/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * CBOR bignum (tags 2 and 3) support.
 *
 * This module provides conversion between CBOR and JavaScript BigInt types,
 * implementing RFC 8949 §3.4.3 (Bignums) with dCBOR/CDE canonical encoding
 * rules — delegated to `@blockchaincommons/dcbor`, the canonical
 * implementation.
 *
 * Encoding:
 * - `biguintToCbor` always encodes as tag 2 (positive bignum) with a byte
 *   string content.
 * - `bigintToCbor` encodes as tag 2 for non-negative values or tag 3
 *   (negative bignum) for negative values.
 * - No numeric reduction is performed: values are always encoded as bignums,
 *   even if they would fit in normal CBOR integers.
 *
 * Decoding:
 * - Accepts CBOR integers (major types 0 and 1) and converts them to bigints.
 * - Accepts tag 2 (positive bignum) and tag 3 (negative bignum) with byte
 *   string content.
 * - Enforces shortest-form canonical representation for bignum magnitudes.
 * - Rejects floating-point values.
 *
 * @module bignum
 */

import {
  biguintToCbor as bcBiguintToCbor,
  bigintToCbor as bcBigintToCbor,
  biguintFromUntaggedCbor as bcBiguintFromUntaggedCbor,
  bigintFromNegativeUntaggedCbor as bcBigintFromNegativeUntaggedCbor,
  cborToBiguint as bcCborToBiguint,
  cborToBigint as bcCborToBigint,
} from "@blockchaincommons/dcbor";

import type { Cbor } from "./cbor";
import { toNew, fromNew, delegating } from "./bridge";

/**
 * Encode a non-negative bigint as a CBOR tag 2 (positive bignum).
 *
 * Matches Rust's `From<BigUint> for CBOR`. The magnitude is encoded as a
 * big-endian byte string with no leading zero bytes; zero is encoded as
 * tag 2 with an empty byte string.
 *
 * @param value - A non-negative bigint (must be >= 0n)
 * @returns CBOR tagged value
 * @throws CborError with type OutOfRange if value is negative
 */
export function biguintToCbor(value: bigint): Cbor {
  return fromNew(delegating(() => bcBiguintToCbor(value)));
}

/**
 * Encode a bigint as a CBOR tag 2 or tag 3 bignum.
 *
 * Matches Rust's `From<BigInt> for CBOR`.
 *
 * - Non-negative values use tag 2 (positive bignum).
 * - Negative values use tag 3 (negative bignum), where the encoded
 *   magnitude is `|value| - 1` per RFC 8949.
 *
 * @param value - Any bigint value
 * @returns CBOR tagged value
 */
export function bigintToCbor(value: bigint): Cbor {
  return fromNew(delegating(() => bcBigintToCbor(value)));
}

/**
 * Decode a BigUint from an untagged CBOR byte string.
 *
 * Matches Rust's `biguint_from_untagged_cbor()`.
 *
 * This function is intended for use in tag summarizers where the tag has
 * already been stripped. It expects a CBOR byte string representing the
 * big-endian magnitude of a positive bignum (tag 2 content).
 *
 * Enforces canonical encoding: no leading zero bytes (except empty for zero).
 *
 * @param cbor - A CBOR value that should be a byte string
 * @returns Non-negative bigint
 * @throws CborError with type WrongType if not a byte string
 * @throws CborError with type NonCanonicalNumeric if encoding is non-canonical
 */
export function biguintFromUntaggedCbor(cbor: Cbor): bigint {
  return delegating(() => bcBiguintFromUntaggedCbor(toNew(cbor)));
}

/**
 * Decode a BigInt from an untagged CBOR byte string for a negative bignum.
 *
 * Matches Rust's `bigint_from_negative_untagged_cbor()`.
 *
 * This function is intended for use in tag summarizers where the tag has
 * already been stripped. It expects a CBOR byte string representing `n` where
 * the actual value is `-1 - n` (tag 3 content per RFC 8949).
 *
 * Enforces canonical encoding: no leading zero bytes (except single `0x00`
 * for -1).
 *
 * @param cbor - A CBOR value that should be a byte string
 * @returns Negative bigint
 * @throws CborError with type WrongType if not a byte string
 * @throws CborError with type NonCanonicalNumeric if encoding is non-canonical
 */
export function bigintFromNegativeUntaggedCbor(cbor: Cbor): bigint {
  return delegating(() => bcBigintFromNegativeUntaggedCbor(toNew(cbor)));
}

/**
 * Convert CBOR to a non-negative bigint.
 *
 * Matches Rust's `TryFrom<CBOR> for BigUint`.
 *
 * Accepts:
 * - Major type 0 (unsigned integer)
 * - Tag 2 (positive bignum) with canonical byte string
 *
 * Rejects:
 * - Major type 1 (negative integer) -> OutOfRange
 * - Tag 3 (negative bignum) -> OutOfRange
 * - Floating-point values -> WrongType
 * - Non-canonical bignum encodings -> NonCanonicalNumeric
 *
 * @param cbor - The CBOR value to convert
 * @returns Non-negative bigint
 * @throws CborError
 */
export function cborToBiguint(cbor: Cbor): bigint {
  return delegating(() => bcCborToBiguint(toNew(cbor)));
}

/**
 * Convert CBOR to a bigint (any sign).
 *
 * Matches Rust's `TryFrom<CBOR> for BigInt`.
 *
 * Accepts:
 * - Major type 0 (unsigned integer)
 * - Major type 1 (negative integer)
 * - Tag 2 (positive bignum) with canonical byte string
 * - Tag 3 (negative bignum) with canonical byte string
 *
 * Rejects:
 * - Floating-point values -> WrongType
 * - Non-canonical bignum encodings -> NonCanonicalNumeric
 *
 * @param cbor - The CBOR value to convert
 * @returns A bigint value
 * @throws CborError
 */
export function cborToBigint(cbor: Cbor): bigint {
  return delegating(() => bcCborToBigint(toNew(cbor)));
}
