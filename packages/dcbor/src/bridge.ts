/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Bridge to `@blockchaincommons/dcbor` — the canonical dCBOR implementation.
 *
 * This package is a compatibility layer: it keeps the historical `@bcts/dcbor`
 * API surface, but every wire-format operation (encoding, decoding, canonical
 * map ordering, diagnostics, hex annotation, traversal, dates, bignums)
 * delegates to `@blockchaincommons/dcbor`. This module holds the node and
 * error converters between the two representations.
 *
 * The two node shapes are structurally identical (`{ isCbor, type, value }`
 * with the same `MajorType` numbering and the same `Simple` variants) because
 * the canonical package evolved from this code. The only differences are:
 *
 * - map nodes: this package's `CborMap` class wraps the canonical `CborMap`
 *   (see `map.ts`), so converting a map node just (un)wraps the inner map;
 * - methods: this package attaches its richer legacy method set, the
 *   canonical package a minimal one. The canonical functions only read the
 *   structural fields, so plain structural nodes are accepted directly.
 *
 * @internal
 */

import type * as bc from "@blockchaincommons/dcbor";
import { CborError as BcCborError } from "@blockchaincommons/dcbor";

import { type Cbor, MajorType, attachMethods } from "./cbor";
import { CborMap } from "./map";
import type { Error as CborErrorType } from "./error";
import { CborError } from "./error";

/** A structural (methods-less) canonical node. */
type BcNode = bc.Cbor;

/**
 * Convert a legacy node into a canonical `@blockchaincommons/dcbor` node.
 *
 * Leaves are shared, not copied: the canonical functions never mutate their
 * inputs. Map nodes unwrap to the inner canonical `CborMap`, so later
 * mutations through the legacy wrapper stay visible.
 */
export const toNew = (c: Cbor): BcNode => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- leaves share the same value shapes and fall through to `default`
  switch (c.type) {
    case MajorType.Array:
      return {
        isCbor: true,
        type: MajorType.Array,
        value: c.value.map(toNew),
      } as unknown as BcNode;
    case MajorType.Map:
      return { isCbor: true, type: MajorType.Map, value: c.value._inner } as unknown as BcNode;
    case MajorType.Tagged:
      return {
        isCbor: true,
        type: MajorType.Tagged,
        tag: c.tag,
        value: toNew(c.value),
      } as unknown as BcNode;
    default:
      // Unsigned/Negative/ByteString/Text/Simple share the same value shapes.
      return { isCbor: true, type: c.type, value: c.value } as unknown as BcNode;
  }
};

/**
 * Convert a canonical node into a legacy node with the legacy method set.
 * Map nodes wrap the canonical `CborMap` without copying entries.
 */
export const fromNew = (n: BcNode): Cbor => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- leaves share the same value shapes and fall through to `default`
  switch (n.type) {
    case MajorType.Array:
      return attachMethods({
        isCbor: true,
        type: MajorType.Array,
        value: n.value.map(fromNew),
      });
    case MajorType.Map:
      return attachMethods({
        isCbor: true,
        type: MajorType.Map,
        value: CborMap._fromInner(n.value),
      });
    case MajorType.Tagged:
      return attachMethods({
        isCbor: true,
        type: MajorType.Tagged,
        tag: (n as unknown as { tag: number | bigint }).tag,
        value: fromNew((n as unknown as { value: BcNode }).value),
      });
    default:
      return attachMethods({
        isCbor: true,
        type: n.type,
        value: n.value,
      }) as Cbor;
  }
};

/**
 * Translate a canonical `CborError` (code + details) back into the legacy
 * discriminated-union `CborError`. Non-CborError values are re-thrown as-is.
 */
export const toLegacyError = (e: unknown): CborError => {
  if (!BcCborError.isCborError(e)) {
    if (e instanceof CborError) return e;
    throw e;
  }
  const details = e.details as Record<string, unknown>;
  let errorType: CborErrorType;
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- payload-less codes are handled uniformly in `default`
  switch (e.code) {
    case "UnsupportedHeaderValue":
      errorType = { type: "UnsupportedHeaderValue", value: details["headerValue"] as number };
      break;
    case "UnusedData":
      errorType = { type: "UnusedData", count: details["count"] as number };
      break;
    case "WrongTag":
      errorType = {
        type: "WrongTag",
        expected: details["expectedTag"] as { value: number | bigint; name?: string },
        actual: details["actualTag"] as { value: number | bigint; name?: string },
      };
      break;
    case "InvalidString":
      errorType = { type: "InvalidString", message: (details["cause"] as string) ?? e.message };
      break;
    case "InvalidUtf8":
      errorType = { type: "InvalidUtf8", message: (details["cause"] as string) ?? e.message };
      break;
    case "InvalidDate":
      errorType = { type: "InvalidDate", message: (details["cause"] as string) ?? e.message };
      break;
    case "Custom":
      errorType = { type: "Custom", message: e.message };
      break;
    default:
      // Underrun / NonCanonicalNumeric / InvalidSimpleValue /
      // NonCanonicalString / MisorderedMapKey / DuplicateMapKey /
      // MissingMapKey / OutOfRange / WrongType — payload-less in both.
      errorType = { type: e.code };
      break;
  }
  return new CborError(errorType);
};

/** Run a canonical-package operation, translating thrown errors. */
export const delegating = <T>(op: () => T): T => {
  try {
    return op();
  } catch (e) {
    throw toLegacyError(e);
  }
};
