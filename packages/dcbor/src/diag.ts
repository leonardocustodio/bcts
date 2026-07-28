/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Enhanced diagnostic formatting for CBOR values.
 *
 * Provides multiple formatting options including
 * - Annotated diagnostics with tag names
 * - Summarized values using custom summarizers
 * - Flat (single-line) vs. pretty (multi-line) formatting
 * - Configurable tag store usage
 *
 * Rendering delegates to `@blockchaincommons/dcbor/diagnostic` (which shares
 * this module's option vocabulary); summarizers registered through this
 * package's `TagsStore` are consulted through the wrapped canonical store.
 *
 * @module diag
 */

import { diagnostic as bcDiagnostic } from "@blockchaincommons/dcbor/diagnostic";
import type { TagsStoreOpt as BcTagsStoreOpt } from "@blockchaincommons/dcbor";

import type { Cbor } from "./cbor";
import { TagsStore, type TagsStoreOpt } from "./tags-store";
import type { WalkElement } from "./walk";
import { toNew, delegating } from "./bridge";

/**
 * Options for diagnostic formatting.
 */
export interface DiagFormatOpts {
  /**
   * Add tag names as annotations.
   * When true, tagged values are displayed as "tagName(content)" instead of "tagValue(content)".
   *
   * @default false
   */
  annotate?: boolean;

  /**
   * Use custom summarizers for tagged values.
   * When true, calls registered summarizers for tagged values.
   *
   * @default false
   */
  summarize?: boolean;

  /**
   * Single-line (flat) output.
   * When true, arrays and maps are formatted without line breaks.
   *
   * @default false
   */
  flat?: boolean;

  /**
   * Tag store to use for tag name resolution.
   *
   * Mirrors Rust's `TagsStoreOpt<'a>` enum (`Custom(&'a dyn TagsStoreTrait)`,
   * `Global`, `None`). The TS port models the same three-way choice as a
   * string-literal union — semantically equivalent, just stringly-typed.
   *
   * - `TagsStore` instance: use this specific store (Rust `Custom`)
   * - `'global'`: use global singleton store (Rust `Global`)
   * - `'none'`: don't resolve names; print bare tag numbers (Rust `None`)
   *
   * @default 'global'
   */
  tags?: TagsStoreOpt;
}

/**
 * Convert the legacy tags-store option to the canonical one (unwrap a
 * wrapped store; pass the string variants through).
 */
const toBcTagsOpt = (tags?: TagsStoreOpt): BcTagsStoreOpt | undefined => {
  if (tags instanceof TagsStore) {
    return tags._inner;
  }
  return tags;
};

/**
 * Format CBOR value as diagnostic notation with options.
 *
 * @param cbor - CBOR value to format
 * @param opts - Formatting options
 * @returns Diagnostic string
 *
 * @example
 * ```typescript
 * const value = cbor({ name: 'Alice', age: 30 });
 * console.log(diagnosticOpt(value, { flat: true }));
 * // {\"name\": \"Alice\", \"age\": 30}
 * ```
 */
export function diagnosticOpt(cbor: Cbor, opts?: DiagFormatOpts): string {
  return delegating(() =>
    bcDiagnostic(toNew(cbor), {
      annotate: opts?.annotate,
      summarize: opts?.summarize,
      // `summarize` implies `flat` per Rust `DiagFormatOpts::summarize`.
      flat: opts?.summarize === true ? true : opts?.flat,
      tags: toBcTagsOpt(opts?.tags),
    }),
  );
}

/**
 * Format CBOR value as standard diagnostic notation.
 *
 * @param cbor - CBOR value to format
 * @returns Diagnostic string (pretty-printed with multiple lines for complex structures)
 *
 * @example
 * ```typescript
 * const value = cbor([1, 2, 3]);
 * console.log(diagnostic(value));
 * // For simple arrays: "[1, 2, 3]"
 * // For nested structures: multi-line formatted output
 * ```
 */
export function diagnostic(cbor: Cbor): string {
  return diagnosticOpt(cbor);
}

/**
 * Format CBOR value with tag name annotations.
 *
 * Tagged values are displayed with their registered names instead of numeric tags.
 *
 * @param cbor - CBOR value to format
 * @returns Annotated diagnostic string (pretty-printed format)
 *
 * @example
 * ```typescript
 * const date = CborDate.now().taggedCbor();
 * console.log(diagnosticAnnotated(date));
 * // date(1234567890) instead of 1(1234567890)
 * ```
 */
export function diagnosticAnnotated(cbor: Cbor): string {
  return diagnosticOpt(cbor, { annotate: true });
}

/**
 * Format CBOR value as flat (single-line) diagnostic notation.
 *
 * Arrays and maps are formatted without line breaks.
 *
 * @param cbor - CBOR value to format
 * @returns Flat diagnostic string
 *
 * @example
 * ```typescript
 * const nested = cbor([[1, 2], [3, 4]]);
 * console.log(diagnosticFlat(nested));
 * // "[[1, 2], [3, 4]]"
 * ```
 */
export function diagnosticFlat(cbor: Cbor): string;
// eslint-disable-next-line no-redeclare
export function diagnosticFlat(element: WalkElement): string;
// eslint-disable-next-line no-redeclare
export function diagnosticFlat(input: Cbor | WalkElement): string {
  // Check if it's a WalkElement by checking for 'type' property
  if (
    typeof input === "object" &&
    input !== null &&
    "type" in input &&
    (input.type === "single" || input.type === "keyvalue")
  ) {
    if (input.type === "single") {
      return diagnosticOpt(input.cbor, { flat: true });
    } else {
      return `${diagnosticOpt(input.key, { flat: true })}: ${diagnosticOpt(input.value, { flat: true })}`;
    }
  }
  // Otherwise treat as Cbor
  return diagnosticOpt(input, { flat: true });
}

/**
 * Format CBOR value using custom summarizers for tagged values.
 *
 * If a summarizer is registered for a tagged value, uses that instead of
 * showing the full content.
 *
 * @param cbor - CBOR value to format
 * @returns Summarized diagnostic string
 *
 * @example
 * ```typescript
 * // If a summarizer is registered for tag 123:
 * const tagged = cbor({ type: MajorType.Tagged, tag: 123, value: ... });
 * console.log(summary(tagged));
 * // "custom-summary" (instead of full content)
 * ```
 */
export function summary(cbor: Cbor): string {
  return diagnosticOpt(cbor, { summarize: true, flat: true });
}
