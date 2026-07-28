/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * CBOR variable-length integer encoding/decoding — delegates to
 * `@blockchaincommons/dcbor`, keeping the legacy signatures and legacy
 * `CborError` on failure.
 */

import {
  encodeVarInt as bcEncodeVarInt,
  decodeVarInt as bcDecodeVarInt,
  decodeVarIntData as bcDecodeVarIntData,
} from "@blockchaincommons/dcbor";

import type { CborNumber, MajorType } from "./cbor";
import { delegating } from "./bridge";

export const encodeVarInt = (value: CborNumber, majorType: MajorType): Uint8Array => {
  return delegating(() => bcEncodeVarInt(value, majorType));
};

export const decodeVarIntData = (
  dataView: DataView,
  offset: number,
): { majorType: MajorType; value: CborNumber; offset: number } => {
  const result = delegating(() => bcDecodeVarIntData(dataView, offset));
  return { majorType: result.majorType, value: result.value, offset: result.offset };
};

export const decodeVarInt = (
  data: Uint8Array,
): { majorType: MajorType; value: CborNumber; offset: number } => {
  const result = delegating(() => bcDecodeVarInt(data));
  return { majorType: result.majorType, value: result.value, offset: result.offset };
};
