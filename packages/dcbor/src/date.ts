/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * Date/time support for CBOR with tag(1) encoding.
 *
 * A CBOR-friendly representation of a date and time.
 *
 * The `CborDate` type keeps the historical `@bcts/dcbor` API
 * (`fromTimestamp`/`timestamp()`/`fromDatetime`/`datetime()` alongside the
 * tagged-CBOR protocol methods) but wraps the canonical
 * `@blockchaincommons/dcbor` `CborDate`, which owns timestamp normalization
 * (Rust `Date::from_timestamp` parity), strict RFC-3339 parsing, and
 * ISO-8601 formatting.
 *
 * When encoded to CBOR, dates are represented as tag 1 followed by a numeric
 * value representing the number of seconds since (or before) the Unix epoch
 * (1970-01-01T00:00:00Z). The numeric value can be a positive or negative
 * integer, or a floating-point value for dates with fractional seconds.
 *
 * @module date
 */

import { CborDate as BcCborDate } from "@blockchaincommons/dcbor";

import { type Cbor, MajorType } from "./cbor";
import { cbor } from "./cbor";
import { createTag, type Tag } from "./tag";
import { TAG_EPOCH_DATE_TIME } from "./tags";
import {
  type CborTaggedEncodable,
  type CborTaggedDecodable,
  type CborTagged,
  createTaggedCbor,
  validateTag,
  extractTaggedContent,
} from "./cbor-tagged";
import { CborError } from "./error";
import { delegating } from "./bridge";

/**
 * A CBOR-friendly representation of a date and time.
 *
 * When encoded to CBOR, dates are represented as tag 1 followed by a numeric
 * value representing the number of seconds since (or before) the Unix epoch
 * (1970-01-01T00:00:00Z). The numeric value can be a positive or negative
 * integer, or a floating-point value for dates with fractional seconds.
 *
 * # Features
 *
 * - Supports UTC dates with optional fractional seconds
 * - Provides convenient constructors for common date creation patterns
 * - Implements the `CborTagged`, `CborTaggedEncodable`, and
 *   `CborTaggedDecodable` interfaces
 * - Supports arithmetic operations with durations and between dates
 *
 * @example
 * ```typescript
 * import { CborDate } from './date';
 *
 * // Create a date from a timestamp (seconds since Unix epoch)
 * const date = CborDate.fromTimestamp(1675854714.0);
 *
 * // Create a date from year, month, day
 * const date2 = CborDate.fromYmd(2023, 2, 8);
 *
 * // Convert to CBOR
 * const cborValue = date.taggedCbor();
 *
 * // Decode from CBOR
 * const decoded = CborDate.fromTaggedCbor(cborValue);
 * ```
 */
export class CborDate implements CborTagged, CborTaggedEncodable, CborTaggedDecodable<CborDate> {
  /**
   * The wrapped canonical `@blockchaincommons/dcbor` date. It stores the
   * normalized timestamp (seconds since the Unix epoch as an `f64`), so
   * encoding, equality, and ordering match the Rust reference exactly.
   */
  private _date: BcCborDate;

  /**
   * Creates a new `CborDate` from the given JavaScript `Date`.
   *
   * @param dateTime - A `Date` instance to wrap
   * @returns A new `CborDate` instance
   *
   * @example
   * ```typescript
   * const datetime = new Date();
   * const date = CborDate.fromDatetime(datetime);
   * ```
   */
  static fromDatetime(dateTime: Date): CborDate {
    return new CborDate(delegating(() => BcCborDate.fromDate(dateTime)));
  }

  /**
   * Creates a new `CborDate` from year, month, and day components.
   *
   * This method creates a new `CborDate` with the time set to 00:00:00 UTC.
   *
   * @param year - The year component (e.g., 2023)
   * @param month - The month component (1-12)
   * @param day - The day component (1-31)
   * @returns A new `CborDate` instance
   *
   * @example
   * ```typescript
   * // Create February 8, 2023
   * const date = CborDate.fromYmd(2023, 2, 8);
   * ```
   */
  static fromYmd(year: number, month: number, day: number): CborDate {
    return new CborDate(delegating(() => BcCborDate.fromYmd(year, month, day)));
  }

  /**
   * Creates a new `CborDate` from year, month, day, hour, minute, and second
   * components.
   *
   * @param year - The year component (e.g., 2023)
   * @param month - The month component (1-12)
   * @param day - The day component (1-31)
   * @param hour - The hour component (0-23)
   * @param minute - The minute component (0-59)
   * @param second - The second component (0-59)
   * @returns A new `CborDate` instance
   *
   * @example
   * ```typescript
   * // Create February 8, 2023, 15:30:45 UTC
   * const date = CborDate.fromYmdHms(2023, 2, 8, 15, 30, 45);
   * ```
   */
  static fromYmdHms(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
  ): CborDate {
    return new CborDate(
      delegating(() => BcCborDate.fromYmdHms(year, month, day, hour, minute, second)),
    );
  }

  /**
   * Creates a new `CborDate` from seconds since (or before) the Unix epoch.
   *
   * The value is normalized on construction (matching Rust's
   * `Date::from_timestamp`) so the stored value — and thus its encoding,
   * equality, and ordering — matches the reference.
   *
   * @param secondsSinceUnixEpoch - Seconds from the Unix epoch (positive or
   *   negative), which can include a fractional part for sub-second
   *   precision
   * @returns A new `CborDate` instance
   *
   * @example
   * ```typescript
   * // Create a date from a timestamp
   * const date = CborDate.fromTimestamp(1675854714.0);
   *
   * // Create a date one second before the Unix epoch
   * const beforeEpoch = CborDate.fromTimestamp(-1.0);
   *
   * // Create a date with fractional seconds
   * const withFraction = CborDate.fromTimestamp(1675854714.5);
   * ```
   */
  static fromTimestamp(secondsSinceUnixEpoch: number): CborDate {
    return new CborDate(delegating(() => BcCborDate.fromEpochSeconds(secondsSinceUnixEpoch)));
  }

  /**
   * Creates a new `CborDate` from a string containing an ISO-8601 (RFC-3339)
   * date (with or without time).
   *
   * Accepts only strict RFC-3339 date-times (with seconds and an explicit
   * `Z`/±HH:MM offset) or bare `YYYY-MM-DD` dates (read as UTC midnight),
   * matching Rust's `Date::from_string`.
   *
   * @param value - A string containing a date or date-time in ISO-8601/RFC-3339
   *   format
   * @returns A new `CborDate` instance if parsing succeeds
   * @throws Error if the string cannot be parsed as a valid date or date-time
   *
   * @example
   * ```typescript
   * // Parse a date-time string
   * const date = CborDate.fromString("2023-02-08T15:30:45Z");
   *
   * // Parse a date-only string (time will be set to 00:00:00)
   * const date2 = CborDate.fromString("2023-02-08");
   * ```
   */
  static fromString(value: string): CborDate {
    return new CborDate(delegating(() => BcCborDate.fromString(value)));
  }

  /**
   * Creates a new `CborDate` containing the current date and time.
   *
   * @returns A new `CborDate` instance representing the current UTC date and time
   *
   * @example
   * ```typescript
   * const now = CborDate.now();
   * ```
   */
  static now(): CborDate {
    return new CborDate(delegating(() => BcCborDate.now()));
  }

  /**
   * Creates a new `CborDate` containing the current date and time plus the given
   * duration.
   *
   * @param durationMs - The duration in milliseconds to add to the current time
   * @returns A new `CborDate` instance representing the current UTC date and time plus
   * the duration
   *
   * @example
   * ```typescript
   * // Get a date 1 hour from now
   * const oneHourLater = CborDate.withDurationFromNow(3600 * 1000);
   * ```
   */
  static withDurationFromNow(durationMs: number): CborDate {
    const now = new Date();
    const future = new Date(now.getTime() + durationMs);
    return CborDate.fromDatetime(future);
  }

  /**
   * Returns the underlying JavaScript `Date` object.
   *
   * @returns The wrapped `Date` instance
   *
   * @example
   * ```typescript
   * const date = CborDate.now();
   * const datetime = date.datetime();
   * const year = datetime.getFullYear();
   * ```
   */
  datetime(): Date {
    return this._date.toDate();
  }

  /**
   * Returns the `CborDate` as the number of seconds since the Unix epoch.
   *
   * Negative values represent times before the epoch. The fractional
   * part represents sub-second precision.
   *
   * @returns Seconds since the Unix epoch as a `number`
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYmd(2023, 2, 8);
   * const timestamp = date.timestamp();
   * ```
   */
  timestamp(): number {
    return this._date.epochSeconds;
  }

  /**
   * Add seconds to this date.
   *
   * @param seconds - Seconds to add (can be fractional)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYmd(2022, 3, 21);
   * const tomorrow = date.add(24 * 60 * 60);
   * ```
   */
  add(seconds: number): CborDate {
    return CborDate.fromTimestamp(this.timestamp() + seconds);
  }

  /**
   * Subtract seconds from this date.
   *
   * @param seconds - Seconds to subtract (can be fractional)
   * @returns New CborDate instance
   *
   * @example
   * ```typescript
   * const date = CborDate.fromYmd(2022, 3, 21);
   * const yesterday = date.subtract(24 * 60 * 60);
   * ```
   */
  subtract(seconds: number): CborDate {
    return CborDate.fromTimestamp(this.timestamp() - seconds);
  }

  /**
   * Get the difference in seconds between this date and another.
   *
   * @param other - Other CborDate to compare with
   * @returns Difference in seconds (this - other)
   *
   * @example
   * ```typescript
   * const date1 = CborDate.fromYmd(2022, 3, 22);
   * const date2 = CborDate.fromYmd(2022, 3, 21);
   * const diff = date1.difference(date2);
   * // Returns 86400 (one day in seconds)
   * ```
   */
  difference(other: CborDate): number {
    return this.timestamp() - other.timestamp();
  }

  /**
   * Implementation of the `CborTagged` interface for `CborDate`.
   *
   * This implementation specifies that `CborDate` values are tagged with CBOR tag 1,
   * which is the standard CBOR tag for date/time values represented as seconds
   * since the Unix epoch per RFC 8949.
   *
   * @returns A vector containing tag 1
   */
  cborTags(): Tag[] {
    return [createTag(TAG_EPOCH_DATE_TIME, "date")];
  }

  /**
   * Implementation of the `CborTaggedEncodable` interface for `CborDate`.
   *
   * Converts this `CborDate` to an untagged CBOR value.
   *
   * The date is converted to a numeric value representing the number of
   * seconds since the Unix epoch. This value may be an integer or a
   * floating-point number, depending on whether the date has fractional
   * seconds.
   *
   * @returns A CBOR value representing the timestamp
   */
  untaggedCbor(): Cbor {
    return cbor(this.timestamp());
  }

  /**
   * Converts this `CborDate` to a tagged CBOR value with tag 1.
   *
   * @returns Tagged CBOR value
   */
  taggedCbor(): Cbor {
    return createTaggedCbor(this);
  }

  /**
   * Implementation of the `CborTaggedDecodable` interface for `CborDate`.
   *
   * Creates a `CborDate` from an untagged CBOR value.
   *
   * The CBOR value must be a numeric value (integer or floating-point)
   * representing the number of seconds since the Unix epoch.
   *
   * @param cbor - The untagged CBOR value
   * @returns This CborDate instance (mutated)
   * @throws Error if the CBOR value is not a valid timestamp
   */
  fromUntaggedCbor(cbor: Cbor): CborDate {
    let timestamp: number;

    // Only handle numeric types (Unsigned, Negative, Float); others are invalid for dates
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (cbor.type) {
      case MajorType.Unsigned:
        timestamp = typeof cbor.value === "number" ? cbor.value : Number(cbor.value);
        break;

      case MajorType.Negative:
        // Convert stored magnitude back to actual negative value
        if (typeof cbor.value === "bigint") {
          timestamp = Number(-cbor.value - 1n);
        } else {
          timestamp = -cbor.value - 1;
        }
        break;

      case MajorType.Simple:
        if (cbor.value.type === "Float") {
          timestamp = cbor.value.value;
        } else {
          // Mirrors Rust `f64::try_from(CBOR)` returning `Error::WrongType`
          // for non-numeric / non-Float Simple values.
          throw new CborError({ type: "WrongType" });
        }
        break;

      default:
        throw new CborError({ type: "WrongType" });
    }

    // Normalization (so the value re-encodes to the same bytes as the
    // reference) happens in the canonical `fromEpochSeconds`.
    this._date = delegating(() => BcCborDate.fromEpochSeconds(timestamp));
    return this;
  }

  /**
   * Creates a `CborDate` from a tagged CBOR value with tag 1.
   *
   * @param cbor - Tagged CBOR value
   * @returns This CborDate instance (mutated)
   * @throws Error if the CBOR value has the wrong tag or cannot be decoded
   */
  fromTaggedCbor(cbor: Cbor): CborDate {
    const expectedTags = this.cborTags();
    validateTag(cbor, expectedTags);
    const content = extractTaggedContent(cbor);
    return this.fromUntaggedCbor(content);
  }

  /**
   * Static method to create a CborDate from tagged CBOR.
   *
   * @param cbor - Tagged CBOR value
   * @returns New CborDate instance
   */
  static fromTaggedCbor(cbor: Cbor): CborDate {
    const instance = new CborDate();
    return instance.fromTaggedCbor(cbor);
  }

  /**
   * Static method to create a CborDate from untagged CBOR.
   *
   * @param cbor - Untagged CBOR value
   * @returns New CborDate instance
   */
  static fromUntaggedCbor(cbor: Cbor): CborDate {
    const instance = new CborDate();
    return instance.fromUntaggedCbor(cbor);
  }

  /**
   * Implementation of the `toString` method for `CborDate`.
   *
   * This implementation provides a string representation of a `CborDate` in ISO-8601
   * format. For dates with time exactly at midnight (00:00:00), only the date
   * part is shown. For other times, a full date-time string is shown.
   *
   * @returns String representation in ISO-8601 format
   *
   * @example
   * ```typescript
   * // A date at midnight will display as just the date
   * const date = CborDate.fromYmd(2023, 2, 8);
   * // Returns "2023-02-08"
   * console.log(date.toString());
   *
   * // A date with time will display as date and time
   * const date2 = CborDate.fromYmdHms(2023, 2, 8, 15, 30, 45);
   * // Returns "2023-02-08T15:30:45Z"
   * console.log(date2.toString());
   * ```
   */
  toString(): string {
    return this._date.toString();
  }

  /**
   * Compare two dates for equality.
   *
   * @param other - Other CborDate to compare
   * @returns true if dates represent the same moment in time
   */
  equals(other: CborDate): boolean {
    return this.timestamp() === other.timestamp();
  }

  /**
   * Compare two dates.
   *
   * @param other - Other CborDate to compare
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   */
  compare(other: CborDate): number {
    if (this.timestamp() < other.timestamp()) return -1;
    if (this.timestamp() > other.timestamp()) return 1;
    return 0;
  }

  /**
   * Convert to JSON (returns ISO 8601 string).
   *
   * @returns ISO 8601 string
   */
  toJSON(): string {
    return this.toString();
  }

  private constructor(date?: BcCborDate) {
    this._date = date ?? BcCborDate.now();
  }
}
