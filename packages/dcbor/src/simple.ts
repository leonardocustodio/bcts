/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * CBOR Simple Values (Major Type 7).
 *
 * The `Simple` value shape is shared verbatim with `@blockchaincommons/dcbor`
 * (the canonical implementation this package delegates to); encoding of
 * simple values happens there. This module keeps the legacy type and the
 * thin inspection helpers.
 *
 * @module simple
 */

/**
 * Represents CBOR simple values (major type 7).
 *
 * In CBOR, simple values are a special category that includes booleans (`true`
 * and `false`), `null`, and floating point numbers.
 *
 * Per Section 2.4 of the dCBOR specification, only these specific simple
 * values are valid in dCBOR. All other major type 7 values (such as undefined
 * or other simple values) are invalid and will be rejected by dCBOR decoders.
 *
 * When encoding floating point values, dCBOR follows specific numeric
 * reduction rules detailed in Section 2.3 of the dCBOR specification,
 * including
 * - Integral floating point values must be reduced to integers when possible
 * - NaN values must be normalized to the canonical form `f97e00`
 */
export type Simple =
  | { readonly type: "False" }
  | { readonly type: "True" }
  | { readonly type: "Null" }
  | { readonly type: "Float"; readonly value: number };

/**
 * Returns the standard name of the simple value as a string.
 *
 * For `False`, `True`, and `Null`, this returns their lowercase string
 * representation. For `Float` values, it returns their numeric representation.
 */
export const simpleName = (simple: Simple): string => {
  switch (simple.type) {
    case "False":
      return "false";
    case "True":
      return "true";
    case "Null":
      return "null";
    case "Float": {
      const v = simple.value;
      if (Number.isNaN(v)) {
        return "NaN";
      } else if (!Number.isFinite(v)) {
        return v > 0 ? "Infinity" : "-Infinity";
      } else {
        return String(v);
      }
    }
  }
};

/**
 * Checks if the simple value is a floating point number.
 */
export const isFloat = (simple: Simple): simple is { type: "Float"; value: number } =>
  simple.type === "Float";

/**
 * Checks if the simple value is the NaN (Not a Number) representation.
 */
export const isNaN = (simple: Simple): boolean =>
  simple.type === "Float" && Number.isNaN(simple.value);
