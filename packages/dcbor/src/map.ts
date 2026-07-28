/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Map Support in dCBOR
 *
 * A deterministic CBOR map that ensures maps with the same content always
 * produce identical binary encodings, regardless of insertion order.
 *
 * This class keeps the historical `@bcts/dcbor` map API (Rust-flavored
 * `insert`/`containsKey`/`len`/`iter` alongside the JS `Map` vocabulary) but
 * stores its entries in a `@blockchaincommons/dcbor` `CborMap` — the
 * canonical implementation owns key ordering (lexicographic by encoded CBOR
 * bytes), duplicate handling, and the decode-time `setNext` ordering checks.
 *
 * @module map
 */

import { CborMap as BcCborMap } from "@blockchaincommons/dcbor";

import { type Cbor, type CborInput, MajorType } from "./cbor";
import { cbor, encodeCbor } from "./cbor";
import { bytesToHex } from "./dump";
import { diagnostic } from "./diag";
import { extractCbor } from "./conveniences";
import { toNew, fromNew, delegating } from "./bridge";
import { CborError } from "./error";

export interface MapEntry {
  readonly key: Cbor;
  readonly value: Cbor;
}

/**
 * A deterministic CBOR map implementation.
 *
 * Maps are always encoded with keys sorted lexicographically by their
 * encoded CBOR representation, ensuring deterministic encoding.
 */
export class CborMap {
  private _map: BcCborMap;

  /**
   * Creates a new, empty CBOR Map.
   * Optionally initializes from a JavaScript Map.
   */
  constructor(map?: Map<unknown, unknown>) {
    this._map = new BcCborMap();

    if (map !== undefined) {
      for (const [key, value] of map.entries()) {
        this.set(key as CborInput, value as CborInput);
      }
    }
  }

  /**
   * The wrapped canonical `@blockchaincommons/dcbor` map.
   * @internal
   */
  get _inner(): BcCborMap {
    return this._map;
  }

  /**
   * Wrap an existing canonical map without copying entries.
   * @internal
   */
  static _fromInner(inner: BcCborMap): CborMap {
    const map = new CborMap();
    map._map = inner;
    return map;
  }

  /**
   * Creates a new, empty CBOR Map.
   * Matches Rust's Map::new().
   */
  static new(): CborMap {
    return new CborMap();
  }

  /**
   * Inserts a key-value pair into the map.
   * Matches Rust's Map::insert().
   */
  set<K extends CborInput, V extends CborInput>(key: K, value: V): void {
    // Coerce through this package's `cbor()` first so legacy-only input
    // shapes (e.g. `{tag, value}` literals) keep their historical meaning.
    const keyCbor = cbor(key);
    const valueCbor = cbor(value);
    delegating(() => this._map.set(toNew(keyCbor), toNew(valueCbor)));
  }

  /**
   * Alias for set() to match Rust's insert() method.
   */
  insert<K extends CborInput, V extends CborInput>(key: K, value: V): void {
    this.set(key, value);
  }

  /**
   * Get a value from the map, given a key.
   * Returns undefined if the key is not present in the map.
   * Matches Rust's Map::get().
   */
  get<K extends CborInput, V>(key: K): V | undefined {
    const stored = delegating(() => this._map.get(toNew(cbor(key))));
    if (stored === undefined) {
      return undefined;
    }
    // Extract CBOR value: primitives become native types, maps/arrays preserve structure
    return extractCbor(fromNew(stored)) as V;
  }

  /**
   * Get a value from the map, given a key.
   * Throws an error if the key is not present.
   * Matches Rust's Map::extract().
   */
  extract<K extends CborInput, V>(key: K): V {
    const value = this.get<K, V>(key);
    if (value === undefined) {
      throw new CborError({ type: "MissingMapKey" });
    }
    return value;
  }

  /**
   * Tests if the map contains a key.
   * Matches Rust's Map::contains_key().
   */
  containsKey<K extends CborInput>(key: K): boolean {
    return delegating(() => this._map.has(toNew(cbor(key))));
  }

  delete<K extends CborInput>(key: K): boolean {
    return delegating(() => this._map.delete(toNew(cbor(key))));
  }

  has<K extends CborInput>(key: K): boolean {
    return this.containsKey(key);
  }

  clear(): void {
    this._map.clear();
  }

  /**
   * Returns the number of entries in the map.
   * Matches Rust's Map::len().
   */
  get length(): number {
    return this._map.size;
  }

  /**
   * Alias for length to match JavaScript Map API.
   * Also matches Rust's Map::len().
   */
  get size(): number {
    return this._map.size;
  }

  /**
   * Returns the number of entries in the map.
   * Matches Rust's Map::len().
   */
  len(): number {
    return this._map.size;
  }

  /**
   * Checks if the map is empty.
   * Matches Rust's Map::is_empty().
   */
  isEmpty(): boolean {
    return this._map.size === 0;
  }

  /**
   * Get the entries of the map as an array.
   * Keys are sorted in lexicographic order of their encoded CBOR bytes.
   */
  get entriesArray(): MapEntry[] {
    const entries: MapEntry[] = [];
    for (const [key, value] of this._map.entries()) {
      entries.push({ key: fromNew(key), value: fromNew(value) });
    }
    return entries;
  }

  /**
   * Gets an iterator over the entries of the CBOR map, sorted by key.
   * Key sorting order is lexicographic by the key's binary-encoded CBOR.
   * Matches Rust's Map::iter().
   */
  iter(): MapEntry[] {
    return this.entriesArray;
  }

  /**
   * Returns an iterator of [key, value] tuples for JavaScript Map API compatibility.
   * This matches the standard JavaScript Map.entries() method behavior.
   */
  *entries(): IterableIterator<[Cbor, Cbor]> {
    for (const entry of this.entriesArray) {
      yield [entry.key, entry.value];
    }
  }

  /**
   * Inserts the next key-value pair into the map during decoding.
   * This is used for efficient map building during CBOR decoding.
   * Throws if the key is not in ascending order or is a duplicate.
   * Matches Rust's Map::insert_next().
   */
  setNext<K extends CborInput, V extends CborInput>(key: K, value: V): void {
    const keyCbor = cbor(key);
    const valueCbor = cbor(value);
    delegating(() => this._map.setNext(toNew(keyCbor), toNew(valueCbor)));
  }

  get debug(): string {
    return `map({${this.entriesArray.map(CborMap.entryDebug).join(", ")}})`;
  }

  get diagnostic(): string {
    return `{${this.entriesArray.map(CborMap.entryDiagnostic).join(", ")}}`;
  }

  private static entryDebug(this: void, entry: MapEntry): string {
    // Format with full type information for debug output
    const keyDebug = CborMap.formatDebug(entry.key);
    const valueDebug = CborMap.formatDebug(entry.value);
    return `0x${bytesToHex(encodeCbor(entry.key))}: (${keyDebug}, ${valueDebug})`;
  }

  private static formatDebug(this: void, cbor: Cbor): string {
    switch (cbor.type) {
      case MajorType.Unsigned:
        return `unsigned(${cbor.value})`;
      case MajorType.Negative: {
        const negValue = typeof cbor.value === "bigint" ? -cbor.value - 1n : -cbor.value - 1;
        return `negative(${negValue})`;
      }
      case MajorType.ByteString: {
        return `bytes(${bytesToHex(cbor.value)})`;
      }
      case MajorType.Text:
        return `text("${cbor.value}")`;
      case MajorType.Array: {
        const items = cbor.value.map(CborMap.formatDebug);
        return `array([${items.join(", ")}])`;
      }
      case MajorType.Map: {
        return cbor.value.debug;
      }
      case MajorType.Tagged:
        return `tagged(${cbor.tag}, ${CborMap.formatDebug(cbor.value)})`;
      case MajorType.Simple: {
        const simple = cbor.value;
        if (typeof simple === "object" && simple !== null && "type" in simple) {
          switch (simple.type) {
            case "True":
              return "simple(true)";
            case "False":
              return "simple(false)";
            case "Null":
              return "simple(null)";
            case "Float":
              return `simple(${simple.value})`;
          }
        }
        return "simple";
      }
      default:
        return diagnostic(cbor);
    }
  }

  private static entryDiagnostic(this: void, entry: MapEntry): string {
    return `${diagnostic(entry.key)}: ${diagnostic(entry.value)}`;
  }

  *[Symbol.iterator](): Iterator<[Cbor, Cbor]> {
    for (const entry of this.entriesArray) {
      yield [entry.key, entry.value];
    }
  }

  toMap<K, V>(): Map<K, V> {
    const map = new Map<K, V>();
    for (const entry of this.entriesArray) {
      map.set(extractCbor(entry.key) as K, extractCbor(entry.value) as V);
    }
    return map;
  }
}
