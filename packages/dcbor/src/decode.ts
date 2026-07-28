/**
 * Copyright © 2023-2026 Blockchain Commons, LLC
 * Copyright © 2025-2026 Parity Technologies
 *
 *
 * dCBOR decoding — delegates to `@blockchaincommons/dcbor`, the canonical
 * implementation, then rewraps the result into this package's legacy node
 * shape. All deterministic-encoding enforcement (canonical numeric forms,
 * NFC text, map-key order, no trailing bytes) happens in the canonical
 * decoder; thrown errors are translated back to the legacy `CborError`.
 */

import { decodeCbor as bcDecodeCbor } from "@blockchaincommons/dcbor";

import type { Cbor } from "./cbor";
import { fromNew, delegating } from "./bridge";

export function decodeCbor(data: Uint8Array): Cbor {
  return fromNew(delegating(() => bcDecodeCbor(data)));
}
