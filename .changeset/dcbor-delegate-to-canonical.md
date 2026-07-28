---
"@bcts/dcbor": minor
---

Delegate all dCBOR wire-format logic (encoding, decoding, canonical map ordering, diagnostics, hex annotation, dates, bignums, varints) to `@blockchaincommons/dcbor`, the canonical dCBOR implementation for TypeScript. The `@bcts/dcbor` public API is unchanged; the package is now a compatibility layer. The `byte-data` and `collections` dependencies were dropped.
