/**
 * @bcts/envelope-pattern - Subject pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust subject_pattern.rs
 *
 * @module envelope-pattern/pattern/structure/subject-pattern
 */

import type { Envelope } from "@bcts/envelope";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory (used for late binding)
export let createStructureSubjectPattern: ((pattern: SubjectPattern) => Pattern) | undefined;

export function registerSubjectPatternFactory(factory: (pattern: SubjectPattern) => Pattern): void {
  createStructureSubjectPattern = factory;
}

/**
 * Pattern type for subject pattern matching.
 *
 * Corresponds to the Rust `SubjectPattern` enum in subject_pattern.rs
 */
export type SubjectPatternType =
  | { readonly type: "Any" }
  | { readonly type: "Pattern"; readonly pattern: Pattern };

/**
 * Pattern for matching subjects in envelopes.
 *
 * Corresponds to the Rust `SubjectPattern` enum in subject_pattern.rs
 */
export class SubjectPattern implements Matcher {
  readonly #pattern: SubjectPatternType;

  private constructor(pattern: SubjectPatternType) {
    this.#pattern = pattern;
  }

  /**
   * Creates a new SubjectPattern that matches any subject.
   */
  static any(): SubjectPattern {
    return new SubjectPattern({ type: "Any" });
  }

  /**
   * Creates a new SubjectPattern that matches subjects matching the given pattern.
   */
  static pattern(pattern: Pattern): SubjectPattern {
    return new SubjectPattern({ type: "Pattern", pattern });
  }

  /**
   * Gets the pattern type.
   */
  get patternType(): SubjectPatternType {
    return this.#pattern;
  }

  /**
   * Gets the inner pattern if this is a Pattern type, undefined otherwise.
   */
  innerPattern(): Pattern | undefined {
    return this.#pattern.type === "Pattern" ? this.#pattern.pattern : undefined;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    const subject = haystack.subject();
    let paths: Path[];

    switch (this.#pattern.type) {
      case "Any":
        paths = [[subject]];
        break;
      case "Pattern": {
        const innerMatcher = this.#pattern.pattern as unknown as Matcher;
        if (innerMatcher.matches(subject)) {
          paths = [[subject]];
        } else {
          paths = [];
        }
        break;
      }
    }

    return [paths, new Map<string, Path[]>()];
  }

  paths(haystack: Envelope): Path[] {
    return this.pathsWithCaptures(haystack)[0];
  }

  matches(haystack: Envelope): boolean {
    return this.paths(haystack).length > 0;
  }

  compile(code: Instr[], literals: Pattern[], captures: string[]): void {
    switch (this.#pattern.type) {
      case "Any":
        code.push({ type: "NavigateSubject" });
        break;
      case "Pattern":
        // Navigate to the subject first
        code.push({ type: "NavigateSubject" });
        // Save the path and run the inner pattern relative to the subject
        code.push({ type: "ExtendTraversal" });
        (this.#pattern.pattern as unknown as Matcher).compile(code, literals, captures);
        code.push({ type: "CombineTraversal" });
        break;
    }
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    switch (this.#pattern.type) {
      case "Any":
        return "subj";
      case "Pattern":
        return `subj(${this.#pattern.pattern})`;
    }
  }

  /**
   * Equality comparison.
   */
  equals(other: SubjectPattern): boolean {
    if (this.#pattern.type !== other.#pattern.type) {
      return false;
    }
    if (this.#pattern.type === "Any") {
      return true;
    }
    // For Pattern type, compare the inner patterns
    const thisPattern = (this.#pattern as { type: "Pattern"; pattern: Pattern }).pattern;
    const otherPattern = (other.#pattern as { type: "Pattern"; pattern: Pattern }).pattern;
    return thisPattern === otherPattern; // Reference equality for now
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    return this.#pattern.type === "Any" ? 0 : 1;
  }
}
