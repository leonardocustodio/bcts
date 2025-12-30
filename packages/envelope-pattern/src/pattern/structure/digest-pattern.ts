/**
 * @bcts/envelope-pattern - Digest pattern matching
 *
 * This is a 1:1 TypeScript port of bc-envelope-pattern-rust digest_pattern.rs
 *
 * @module envelope-pattern/pattern/structure/digest-pattern
 */

import type { Envelope, Digest } from "@bcts/envelope";
import { bytesToHex } from "@bcts/dcbor";
import type { Path } from "../../format";
import type { Matcher } from "../matcher";
import { compileAsAtomic } from "../matcher";
import type { Instr } from "../vm";
import type { Pattern } from "../index";

// Forward declaration for Pattern factory
let createStructureDigestPattern: ((pattern: DigestPattern) => Pattern) | undefined;

export function registerDigestPatternFactory(factory: (pattern: DigestPattern) => Pattern): void {
  createStructureDigestPattern = factory;
}

/**
 * Helper to convert bytes to Latin-1 string for regex matching.
 */
function bytesToLatin1(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]!);
  }
  return result;
}

/**
 * Pattern type for digest pattern matching.
 *
 * Corresponds to the Rust `DigestPattern` enum in digest_pattern.rs
 */
export type DigestPatternType =
  | { readonly type: "Any" }
  | { readonly type: "Digest"; readonly digest: Digest }
  | { readonly type: "Prefix"; readonly prefix: Uint8Array }
  | { readonly type: "BinaryRegex"; readonly regex: RegExp };

/**
 * Pattern for matching envelopes by their digest.
 *
 * Corresponds to the Rust `DigestPattern` enum in digest_pattern.rs
 */
export class DigestPattern implements Matcher {
  readonly #pattern: DigestPatternType;

  private constructor(pattern: DigestPatternType) {
    this.#pattern = pattern;
  }

  /**
   * Creates a new DigestPattern that matches any digest.
   */
  static any(): DigestPattern {
    return new DigestPattern({ type: "Any" });
  }

  /**
   * Creates a new DigestPattern that matches the exact digest.
   */
  static digest(digest: Digest): DigestPattern {
    return new DigestPattern({ type: "Digest", digest });
  }

  /**
   * Creates a new DigestPattern that matches the prefix of a digest.
   */
  static prefix(prefix: Uint8Array): DigestPattern {
    return new DigestPattern({ type: "Prefix", prefix });
  }

  /**
   * Creates a new DigestPattern that matches the binary regex for a digest.
   */
  static binaryRegex(regex: RegExp): DigestPattern {
    return new DigestPattern({ type: "BinaryRegex", regex });
  }

  /**
   * Gets the pattern type.
   */
  get patternType(): DigestPatternType {
    return this.#pattern;
  }

  pathsWithCaptures(haystack: Envelope): [Path[], Map<string, Path[]>] {
    const digest = haystack.digest();
    const digestData = digest.data();
    let isHit = false;

    switch (this.#pattern.type) {
      case "Any":
        // Any digest matches - every envelope has a digest
        isHit = true;
        break;
      case "Digest":
        isHit = digest.equals(this.#pattern.digest);
        break;
      case "Prefix": {
        const prefix = this.#pattern.prefix;
        if (digestData.length >= prefix.length) {
          isHit = true;
          for (let i = 0; i < prefix.length; i++) {
            if (digestData[i] !== prefix[i]) {
              isHit = false;
              break;
            }
          }
        }
        break;
      }
      case "BinaryRegex": {
        const latin1 = bytesToLatin1(digestData);
        isHit = this.#pattern.regex.test(latin1);
        break;
      }
    }

    const paths = isHit ? [[haystack]] : [];
    return [paths, new Map<string, Path[]>()];
  }

  paths(haystack: Envelope): Path[] {
    return this.pathsWithCaptures(haystack)[0];
  }

  matches(haystack: Envelope): boolean {
    return this.paths(haystack).length > 0;
  }

  compile(code: Instr[], literals: Pattern[], captures: string[]): void {
    if (createStructureDigestPattern === undefined) {
      throw new Error("DigestPattern factory not registered");
    }
    compileAsAtomic(createStructureDigestPattern(this), code, literals, captures);
  }

  isComplex(): boolean {
    return false;
  }

  toString(): string {
    switch (this.#pattern.type) {
      case "Any":
        return "digest";
      case "Digest":
        return `digest(${this.#pattern.digest})`;
      case "Prefix":
        return `digest(${bytesToHex(this.#pattern.prefix)})`;
      case "BinaryRegex":
        return `digest(/${this.#pattern.regex.source}/)`;
    }
  }

  /**
   * Equality comparison.
   */
  equals(other: DigestPattern): boolean {
    if (this.#pattern.type !== other.#pattern.type) {
      return false;
    }
    switch (this.#pattern.type) {
      case "Any":
        return true;
      case "Digest":
        return this.#pattern.digest.equals(
          (other.#pattern as { type: "Digest"; digest: Digest }).digest,
        );
      case "Prefix": {
        const thisPrefix = this.#pattern.prefix;
        const otherPrefix = (other.#pattern as { type: "Prefix"; prefix: Uint8Array }).prefix;
        if (thisPrefix.length !== otherPrefix.length) return false;
        for (let i = 0; i < thisPrefix.length; i++) {
          if (thisPrefix[i] !== otherPrefix[i]) return false;
        }
        return true;
      }
      case "BinaryRegex":
        return (
          this.#pattern.regex.source ===
          (other.#pattern as { type: "BinaryRegex"; regex: RegExp }).regex.source
        );
    }
  }

  /**
   * Hash code for use in Maps/Sets.
   */
  hashCode(): number {
    switch (this.#pattern.type) {
      case "Any":
        return 0;
      case "Digest": {
        // Hash based on first few bytes of digest
        const data = this.#pattern.digest.data();
        let hash = 0;
        for (let i = 0; i < Math.min(8, data.length); i++) {
          hash = (hash * 31 + data[i]!) | 0;
        }
        return hash;
      }
      case "Prefix": {
        let hash = 0;
        for (let i = 0; i < this.#pattern.prefix.length; i++) {
          hash = (hash * 31 + this.#pattern.prefix[i]!) | 0;
        }
        return hash;
      }
      case "BinaryRegex": {
        let hash = 0;
        for (let i = 0; i < this.#pattern.regex.source.length; i++) {
          hash = (hash * 31 + this.#pattern.regex.source.charCodeAt(i)) | 0;
        }
        return hash;
      }
    }
  }
}
