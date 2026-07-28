/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Float utilities.
 *
 * All floating point encoding (numeric reduction, shortest-form selection,
 * canonical NaN/±Infinity) now lives in `@blockchaincommons/dcbor`; this
 * module keeps only the public `hasFractionalPart` helper, delegated to the
 * canonical implementation.
 *
 * @module float
 */

export { hasFractionalPart } from "@blockchaincommons/dcbor";

/**
 * Format a float the way Rust's `Display` for `f64` does: whole values get a
 * `.0` suffix, values in the non-exponential range print plainly, and
 * everything else prints in exponential form. Zero prints as `0.0`/`-0.0`.
 *
 * JS already produces the same shortest round-tripping digits; we only fix up
 * the notation threshold, the `e+` → `e` exponent, and the `.0` suffix.
 *
 * (Kept local: the canonical package uses this rendering internally in its
 * diagnostic formatter but does not export it.)
 *
 * @param value - The float value
 * @returns Rust-`Display`-compatible string
 */
export const floatDisplayString = (value: number): string => {
  if (Number.isNaN(value)) return "NaN";
  if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
  if (value === 0) return Object.is(value, -0) ? "-0.0" : "0.0";

  const abs = Math.abs(value);
  if (abs >= 1e-4 && abs < 1e16) {
    // In this range String() never switches to exponential. Ensure at least
    // one fractional digit.
    let str = String(value);
    if (!str.includes(".")) {
      str = `${str}.0`;
    }
    return str;
  }

  // Drop the `+` in the exponent to match Rust (`1.5e+20` → `1.5e20`);
  // negative exponents keep their sign.
  return value.toExponential().replace("e+", "e");
};
