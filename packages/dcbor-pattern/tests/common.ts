/**
 * Common test utilities for dCBOR pattern tests.
 *
 * This module provides helper functions and utilities that mirror
 * the Rust test helpers in common/mod.rs.
 *
 * @module tests/common
 */

import { expect } from "vitest";
import { cbor as createCbor, type Cbor } from "@bcts/dcbor";
import {
  parse as parsePattern,
  type Pattern,
  patternMatches,
  patternPaths,
  patternPathsWithCaptures,
  patternDisplay,
  formatPaths,
  formatPathsWithCaptures,
  type Path,
} from "../src";

/**
 * Helper function to parse CBOR diagnostic notation into CBOR objects.
 * Mirrors the Rust `fn cbor(s: &str) -> CBOR` helper.
 */
export const cbor = (value: unknown): Cbor => {
  return createCbor(value);
};

/**
 * Helper function to parse pattern text into Pattern objects.
 * Mirrors the Rust `fn parse(s: &str) -> Pattern` helper.
 */
export const parse = (s: string): Pattern => {
  const result = parsePattern(s);
  if (!result.ok) {
    throw new Error(`Failed to parse pattern "${s}": ${result.error.message}`);
  }
  return result.value;
};

/**
 * Assert that actual equals expected with helpful output on failure.
 * Mirrors the Rust `assert_actual_expected!` macro.
 */
export const assertActualExpected = (actual: string, expected: string): void => {
  if (actual !== expected) {
    console.log(`Actual:\n${actual}\nExpected:\n${expected}`);
  }
  expect(actual).toBe(expected);
};

/**
 * Get paths for a pattern against CBOR data.
 */
export const getPaths = (pattern: Pattern, data: Cbor): Path[] => {
  return patternPaths(pattern, data);
};

/**
 * Get paths with captures for a pattern against CBOR data.
 */
export const getPathsWithCaptures = (
  pattern: Pattern,
  data: Cbor,
): [Path[], Map<string, Path[]>] => {
  return patternPathsWithCaptures(pattern, data);
};

/**
 * Check if a pattern matches CBOR data.
 */
export const matches = (pattern: Pattern, data: Cbor): boolean => {
  return patternMatches(pattern, data);
};

/**
 * Format paths as a string for comparison.
 */
export const formatPathsStr = (paths: Path[]): string => {
  return formatPaths(paths);
};

/**
 * Format paths with captures as a string for comparison.
 */
export const formatPathsWithCapturesStr = (
  paths: Path[],
  captures: Map<string, Path[]>,
): string => {
  // If there are no captures, just format paths
  if (captures.size === 0) {
    return formatPaths(paths);
  }
  return formatPathsWithCaptures(paths, captures);
};

/**
 * Get the display string for a pattern.
 */
export const display = (pattern: Pattern): string => {
  return patternDisplay(pattern);
};

/**
 * Re-export commonly used functions for convenience.
 */
export {
  parsePattern,
  patternMatches,
  patternPaths,
  patternPathsWithCaptures,
  patternDisplay,
  formatPaths,
  formatPathsWithCaptures,
};
