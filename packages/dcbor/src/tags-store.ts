/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Tag registry and management system.
 *
 * The TagsStore provides a centralized registry for CBOR tags,
 * including name resolution and custom summarizer functions.
 *
 * The store wraps the `@blockchaincommons/dcbor` `TagsStore` — and the
 * global singleton wraps the canonical package's *global* store — so tag
 * names and summarizers registered through this legacy API are visible to
 * the delegated diagnostic/hex formatters (and vice versa).
 *
 * @module tags-store
 */

import {
  TagsStore as BcTagsStore,
  Tag as BcTag,
  CborError as BcCborError,
  getGlobalTagsStore as bcGetGlobalTagsStore,
} from "@blockchaincommons/dcbor";

import type { Cbor, CborNumber } from "./cbor";
import type { Tag } from "./tag";
import type { Error as CborErrorType } from "./error";
import { errorToString } from "./error";
import { fromNew } from "./bridge";

/**
 * Result type for summarizer functions, matching Rust's Result<String, Error>.
 */
export type SummarizerResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: CborErrorType };

/**
 * Function type for custom CBOR value summarizers.
 *
 * Summarizers provide custom string representations for tagged values.
 * Returns a Result type matching Rust's `Result<String, Error>`.
 *
 * @param cbor - The CBOR value to summarize
 * @param flat - If true, produce single-line output
 * @returns Result with summary string on success, or error on failure
 */
export type CborSummarizer = (cbor: Cbor, flat: boolean) => SummarizerResult;

/**
 * Selects which tag store the diagnostic/hex formatters consult when resolving
 * tag names and summarizers (mirrors Rust's `TagsStoreOpt`):
 *
 * - a concrete {@link TagsStore} to use
 * - `"global"` for the process-wide store
 * - `"none"` to skip name/summary resolution
 */
export type TagsStoreOpt = TagsStore | "global" | "none";

/**
 * Interface for tag store operations.
 */
export interface TagsStoreTrait {
  /**
   * Get the assigned name for a tag, if any.
   */
  assignedNameForTag(tag: Tag): string | undefined;

  /**
   * Get the name for a tag, falling back to the numeric value as a string.
   */
  nameForTag(tag: Tag): string;

  /**
   * Look up a tag by its numeric value.
   */
  tagForValue(value: CborNumber): Tag | undefined;

  /**
   * Look up a tag by its name.
   */
  tagForName(name: string): Tag | undefined;

  /**
   * Get the name for a numeric tag value, falling back to the value as a string.
   */
  nameForValue(value: CborNumber): string;

  /**
   * Get the registered summarizer for a tag value, if any.
   */
  summarizer(tag: CborNumber): CborSummarizer | undefined;
}

/**
 * Convert a canonical tag (whose `name` may be explicitly `undefined`) to the
 * legacy `Tag` shape, which omits the property instead.
 */
const toLegacyTag = (
  tag: { value: CborNumber; name?: string | undefined } | undefined,
): Tag | undefined => {
  if (tag === undefined) return undefined;
  return tag.name !== undefined ? { value: tag.value, name: tag.name } : { value: tag.value };
};

/**
 * Tag registry implementation.
 *
 * Stores tags with their names and optional summarizer functions, delegating
 * storage to the canonical `@blockchaincommons/dcbor` store.
 */
export class TagsStore implements TagsStoreTrait {
  private _store: BcTagsStore;
  /** Original (legacy-signature) summarizers, for the `summarizer()` accessor. */
  private readonly _legacySummarizers = new Map<string, CborSummarizer>();

  constructor() {
    // Start with empty store, matching Rust's Default implementation
    // Tags must be explicitly registered using insert() or registerTags()
    this._store = new BcTagsStore();
  }

  /**
   * The wrapped canonical `@blockchaincommons/dcbor` store.
   * @internal
   */
  get _inner(): BcTagsStore {
    return this._store;
  }

  /**
   * Wrap an existing canonical store without copying registrations.
   * @internal
   */
  static _fromInner(inner: BcTagsStore): TagsStore {
    const store = new TagsStore();
    store._store = inner;
    return store;
  }

  /**
   * Insert a tag into the registry.
   *
   * Matches Rust's TagsStore::insert() behavior:
   * - Throws if the tag name is undefined or empty
   * - Throws if a tag with the same value exists with a different name
   * - Allows re-registering the same tag value with the same name
   *
   * @param tag - The tag to register (must have a non-empty name)
   * @throws Error if tag has no name, empty name, or conflicts with existing registration
   *
   * @example
   * ```typescript
   * const store = new TagsStore();
   * store.insert(createTag(12345, 'myCustomTag'));
   * ```
   */
  insert(tag: Tag): void {
    const name = tag.name;

    // Rust: let name = tag.name().unwrap(); assert!(!name.is_empty());
    if (name === undefined || name === "") {
      throw new Error(`Tag ${tag.value} must have a non-empty name`);
    }

    const existing = this._store.tagForValue(tag.value);

    // Rust: if old_name != name { panic!(...) }
    if (existing?.name !== undefined && existing.name !== name) {
      throw new Error(
        `Attempt to register tag: ${tag.value} '${existing.name}' with different name: '${name}'`,
      );
    }

    this._store.register(BcTag.from(tag.value, name));
  }

  /**
   * Insert multiple tags into the registry.
   * Matches Rust's insert_all() method.
   *
   * @param tags - Array of tags to register
   *
   * @example
   * ```typescript
   * const store = new TagsStore();
   * store.insertAll([
   *   createTag(1, 'date'),
   *   createTag(100, 'custom')
   * ]);
   * ```
   */
  insertAll(tags: Tag[]): void {
    for (const tag of tags) {
      this.insert(tag);
    }
  }

  /**
   * Register a custom summarizer function for a tag.
   *
   * The summarizer is adapted and forwarded to the canonical store, so the
   * delegated diagnostic formatters invoke it (with a legacy-shaped node).
   *
   * @param tagValue - The numeric tag value
   * @param summarizer - The summarizer function
   *
   * @example
   * ```typescript
   * store.setSummarizer(1, (cbor, flat) => {
   *   // Custom date formatting
   *   return `Date(${extractCbor(cbor)})`;
   * });
   * ```
   */
  setSummarizer(tagValue: CborNumber, summarizer: CborSummarizer): void {
    this._legacySummarizers.set(this._valueKey(tagValue), summarizer);
    this._store.setSummarizer(tagValue, (cbor, flat) => {
      const result = summarizer(fromNew(cbor), flat);
      if (result.ok) {
        return result;
      }
      return { ok: false, error: BcCborError.custom(errorToString(result.error)) };
    });
  }

  assignedNameForTag(tag: Tag): string | undefined {
    return this._store.tagForValue(tag.value)?.name;
  }

  nameForTag(tag: Tag): string {
    return this.assignedNameForTag(tag) ?? tag.value.toString();
  }

  tagForValue(value: CborNumber): Tag | undefined {
    return toLegacyTag(this._store.tagForValue(value));
  }

  tagForName(name: string): Tag | undefined {
    return toLegacyTag(this._store.tagForName(name));
  }

  nameForValue(value: CborNumber): string {
    const tag = this.tagForValue(value);
    return tag !== undefined ? this.nameForTag(tag) : value.toString();
  }

  summarizer(tag: CborNumber): CborSummarizer | undefined {
    return this._legacySummarizers.get(this._valueKey(tag));
  }

  private _valueKey(value: CborNumber): string {
    return value.toString();
  }
}

// ============================================================================
// Global Tags Store Singleton
// ============================================================================

/**
 * Global singleton instance of the tags store.
 */
let globalTagsStore: TagsStore | undefined;

/**
 * Get the global tags store instance.
 *
 * Creates the instance on first access, wrapping the canonical package's
 * global store so registrations are shared with the delegated formatters.
 *
 * @returns The global TagsStore instance
 *
 * @example
 * ```typescript
 * const store = getGlobalTagsStore();
 * store.insert(createTag(999, 'myTag'));
 * ```
 */
export const getGlobalTagsStore = (): TagsStore => {
  globalTagsStore ??= TagsStore._fromInner(bcGetGlobalTagsStore());
  return globalTagsStore;
};

/**
 * Execute a function with access to the global tags store.
 *
 * @template T - Return type of the action function
 * @param action - Function to execute with the tags store
 * @returns Result of the action function
 *
 * @example
 * ```typescript
 * const tagName = withTags(store => store.nameForValue(1));
 * console.log(tagName); // 'date'
 * ```
 */
export const withTags = <T>(action: (tags: TagsStore) => T): T => {
  return action(getGlobalTagsStore());
};

/**
 * Execute a function with mutable access to the global tags store.
 *
 * This is an alias for withTags() for consistency with Rust API.
 *
 * @template T - Return type of the action function
 * @param action - Function to execute with the tags store
 * @returns Result of the action function
 */
export const withTagsMut = <T>(action: (tags: TagsStore) => T): T => {
  return action(getGlobalTagsStore());
};
