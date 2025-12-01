/**
 * Tag registry and management system.
 *
 * The TagsStore provides a centralized registry for CBOR tags,
 * including name resolution and custom summarizer functions.
 *
 * @module tags-store
 */

import type { Cbor, CborNumber } from './cbor';
import type { Tag } from './tag';

/**
 * Function type for custom CBOR value summarizers.
 *
 * Summarizers provide custom string representations for tagged values.
 *
 * @param cbor - The CBOR value to summarize
 * @param flat - If true, produce single-line output
 * @returns String summary of the value
 */
export type CborSummarizer = (cbor: Cbor, flat: boolean) => string;

/**
 * Interface for tag store operations.
 */
export interface TagsStoreTrait {
  /**
   * Get the assigned name for a tag, if any.
   *
   * @param tag - The tag to look up
   * @returns The assigned name, or undefined if no name is registered
   */
  assignedNameForTag(tag: Tag): string | undefined;

  /**
   * Get a display name for a tag.
   *
   * @param tag - The tag to get a name for
   * @returns The assigned name if available, otherwise the tag value as a string
   */
  nameForTag(tag: Tag): string;

  /**
   * Look up a tag by its numeric value.
   *
   * @param value - The numeric tag value
   * @returns The Tag object if found, undefined otherwise
   */
  tagForValue(value: CborNumber): Tag | undefined;

  /**
   * Look up a tag by its name.
   *
   * @param name - The tag name
   * @returns The Tag object if found, undefined otherwise
   */
  tagForName(name: string): Tag | undefined;

  /**
   * Get a display name for a tag value.
   *
   * @param value - The numeric tag value
   * @returns The tag name if registered, otherwise the value as a string
   */
  nameForValue(value: CborNumber): string;

  /**
   * Get a custom summarizer function for a tag, if registered.
   *
   * @param tag - The numeric tag value
   * @returns The summarizer function if registered, undefined otherwise
   */
  summarizer(tag: CborNumber): CborSummarizer | undefined;
}

/**
 * Tag registry implementation.
 *
 * Stores tags with their names and optional summarizer functions.
 */
export class TagsStore implements TagsStoreTrait {
  readonly #tagsByValue = new Map<string, Tag>();
  readonly #tagsByName = new Map<string, Tag>();
  readonly #summarizers = new Map<string, CborSummarizer>();

  constructor() {
    // Start with empty store, matching Rust's Default implementation
    // Tags must be explicitly registered using insert() or registerTags()
  }

  /**
   * Insert a tag into the registry.
   *
   * @param tag - The tag to register
   *
   * @example
   * ```typescript
   * const store = new TagsStore();
   * store.insert(createTag(12345, 'myCustomTag'));
   * ```
   */
  insert(tag: Tag): void {
    const key = this.#valueKey(tag.value);
    this.#tagsByValue.set(key, tag);
    if (tag.name !== undefined) {
      this.#tagsByName.set(tag.name, tag);
    }
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
    const key = this.#valueKey(tagValue);
    this.#summarizers.set(key, summarizer);
  }

  /**
   * Remove a tag from the registry.
   *
   * @param tagValue - The numeric tag value to remove
   * @returns true if a tag was removed, false otherwise
   */
  remove(tagValue: CborNumber): boolean {
    const key = this.#valueKey(tagValue);
    const tag = this.#tagsByValue.get(key);
    if (tag === undefined) {
      return false;
    }

    this.#tagsByValue.delete(key);
    if (tag.name !== undefined) {
      this.#tagsByName.delete(tag.name);
    }
    this.#summarizers.delete(key);
    return true;
  }

  assignedNameForTag(tag: Tag): string | undefined {
    const key = this.#valueKey(tag.value);
    const stored = this.#tagsByValue.get(key);
    return stored?.name;
  }

  nameForTag(tag: Tag): string {
    return this.assignedNameForTag(tag) ?? tag.value.toString();
  }

  tagForValue(value: CborNumber): Tag | undefined {
    const key = this.#valueKey(value);
    return this.#tagsByValue.get(key);
  }

  tagForName(name: string): Tag | undefined {
    return this.#tagsByName.get(name);
  }

  nameForValue(value: CborNumber): string {
    const tag = this.tagForValue(value);
    return tag !== undefined ? this.nameForTag(tag) : value.toString();
  }

  summarizer(tag: CborNumber): CborSummarizer | undefined {
    const key = this.#valueKey(tag);
    return this.#summarizers.get(key);
  }

  /**
   * Get all registered tags.
   *
   * @returns Array of all registered tags
   */
  getAllTags(): Tag[] {
    return Array.from(this.#tagsByValue.values());
  }

  /**
   * Clear all registered tags and summarizers.
   */
  clear(): void {
    this.#tagsByValue.clear();
    this.#tagsByName.clear();
    this.#summarizers.clear();
  }

  /**
   * Get the number of registered tags.
   *
   * @returns Number of tags in the registry
   */
  get size(): number {
    return this.#tagsByValue.size;
  }

  /**
   * Create a string key for a numeric tag value.
   * Handles both number and bigint types.
   *
   * @private
   */
  #valueKey(value: CborNumber): string {
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
 * Creates the instance on first access.
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
  globalTagsStore ??= new TagsStore();
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
