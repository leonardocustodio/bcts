/**
 * @bcts/envelope-pattern - Capture pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust capture_pattern.rs
 *
 * @module envelope-pattern/pattern/meta/capture-pattern
 */

import type { Envelope } from "@bcts/envelope";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory (used for late binding)
export let createMetaCapturePattern: ((pattern: CapturePattern) => Pattern) | undefined;

export function registerCapturePatternFactory(factory: (pattern: CapturePattern) => Pattern): void {
  createMetaCapturePattern = factory;
}

/**
 * A pattern that captures a match with a name.
 *
 * Corresponds to the Rust `CapturePattern` struct in capture_pattern.rs
 */
export class CapturePattern implements Matcher {
  readonly #name: string;
  readonly #pattern: Pattern;

  private constructor(name: string, pattern: Pattern) {
    this.#name = name;
    this.#pattern = pattern;
  }

  /**
   * Creates a new CapturePattern with the given name and pattern.
   */
  static new(name: string, pattern: Pattern): CapturePattern {
    return new CapturePattern(name, pattern);
  }

  /**
   * Gets the name of the capture.
   */
  name(): string {
    return this.#name;
  }

  /**
   * Gets the inner pattern.
   */
  pattern(): Pattern {
    return this.#pattern;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    const matcher = this.#pattern as unknown as Matcher;
    const [paths, caps] = matcher.pathsWithCaptures(haystack);

    if (paths.length > 0) {
      const existing = caps.get(this.#name) ?? [];
      caps.set(this.#name, [...existing, ...paths]);
    }

    return [paths, caps];
  }

  paths(haystack: Envelope): Path[] {
    return this.pathsWithCaptures(haystack)[0];
  }

  matches(haystack: Envelope): boolean {
    return this.paths(haystack).length > 0;
  }

  compile(code: Instr[], literals: Pattern[], captures: string[]): void {
    const id = captures.length;
    captures.push(this.#name);
    code.push({ type: "CaptureStart", captureIndex: id });
    const matcher = this.#pattern as unknown as Matcher;
    matcher.compile(code, literals, captures);
    code.push({ type: "CaptureEnd", captureIndex: id });
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    return `@${this.#name}(${this.#pattern})`;
  }

  /**
   * Equality comparison.
   */
  equals(other: CapturePattern): boolean {
    return this.#name === other.#name && this.#pattern === other.#pattern;
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this.#name.length; i++) {
      hash = (hash * 31 + this.#name.charCodeAt(i)) | 0;
    }
    return hash;
  }
}
