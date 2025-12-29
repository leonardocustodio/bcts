/**
 * Late-binding registry for pattern matching functions.
 * This avoids circular dependencies between pattern modules.
 *
 * @module pattern/match-registry
 */

import type { Cbor } from "@bcts/dcbor";
import type { Pattern } from "./index";

/**
 * Registry for the pattern matching function.
 * This gets set by pattern/index.ts after all modules are loaded.
 */
export let matchFn: ((pattern: Pattern, haystack: Cbor) => boolean) | undefined;

/**
 * Sets the pattern matching function.
 * Called by pattern/index.ts during module initialization.
 */
export const setMatchFn = (fn: (pattern: Pattern, haystack: Cbor) => boolean): void => {
  matchFn = fn;
};

/**
 * Matches a pattern against a CBOR value using the registered function.
 * @throws Error if the match function hasn't been registered yet.
 */
export const matchPattern = (pattern: Pattern, haystack: Cbor): boolean => {
  if (!matchFn) {
    throw new Error("Pattern match function not initialized");
  }
  return matchFn(pattern, haystack);
};
