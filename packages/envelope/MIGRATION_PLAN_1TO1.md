# bc-envelope-ts 1:1 Migration Plan (Revised)

## Overview

This is a **direct 1:1 port** of bc-envelope-rust to TypeScript. Every Rust file will have a corresponding TypeScript file with the exact same name, structure, and functions. The folder structure will mirror the Rust implementation exactly.

**Source:** bc-envelope-rust v0.37.0
**Target:** bc-envelope-ts (exact TypeScript mirror)
**DCBOR Package:** `@leonardocustodio/dcbor`

---

## Directory Structure Mapping

### Exact 1:1 Folder Structure

```
bc-envelope-rust/                bc-envelope-ts/
├── src/                         ├── src/
│   ├── lib.rs                   │   ├── index.ts
│   ├── prelude.rs               │   ├── prelude.ts
│   ├── seal.rs                  │   ├── seal.ts
│   ├── string_utils.rs          │   ├── string-utils.ts
│   ├── base/                    │   ├── base/
│   │   ├── mod.rs               │   │   ├── index.ts
│   │   ├── assertion.rs         │   │   ├── assertion.ts
│   │   ├── assertions.rs        │   │   ├── assertions.ts
│   │   ├── cbor.rs              │   │   ├── cbor.ts
│   │   ├── digest.rs            │   │   ├── digest.ts
│   │   ├── elide.rs             │   │   ├── elide.ts
│   │   ├── envelope.rs          │   │   ├── envelope.ts
│   │   ├── envelope_encodable.rs│   │   ├── envelope-encodable.ts
│   │   ├── envelope_decodable.rs│   │   ├── envelope-decodable.ts
│   │   ├── error.rs             │   │   ├── error.ts
│   │   ├── leaf.rs              │   │   ├── leaf.ts
│   │   ├── queries.rs           │   │   ├── queries.ts
│   │   ├── walk.rs              │   │   ├── walk.ts
│   │   └── wrap.rs              │   │   └── wrap.ts
│   ├── extension/               │   ├── extension/
│   │   ├── mod.rs               │   │   ├── index.ts
│   │   ├── compress.rs          │   │   ├── compress.ts
│   │   ├── encrypt.rs           │   │   ├── encrypt.ts
│   │   ├── proof.rs             │   │   ├── proof.ts
│   │   ├── recipient.rs         │   │   ├── recipient.ts
│   │   ├── salt.rs              │   │   ├── salt.ts
│   │   ├── secret.rs            │   │   ├── secret.ts
│   │   ├── sskr.rs              │   │   ├── sskr.ts
│   │   ├── types.rs             │   │   ├── types.ts
│   │   ├── attachment/          │   │   ├── attachment/
│   │   │   ├── mod.rs           │   │   │   ├── index.ts
│   │   │   ├── attachment_impl.rs│   │   │   ├── attachment-impl.ts
│   │   │   ├── attachments.rs   │   │   │   ├── attachments.ts
│   │   │   └── impl_attachable_macro.rs│   │   │   └── impl-attachable-macro.ts
│   │   ├── expressions/         │   │   ├── expressions/
│   │   │   ├── mod.rs           │   │   │   ├── index.ts
│   │   │   ├── expression.rs    │   │   │   ├── expression.ts
│   │   │   ├── function.rs      │   │   │   ├── function.ts
│   │   │   ├── parameter.rs     │   │   │   ├── parameter.ts
│   │   │   ├── request.rs       │   │   │   ├── request.ts
│   │   │   ├── response.rs      │   │   │   ├── response.ts
│   │   │   ├── event.rs         │   │   │   ├── event.ts
│   │   │   ├── functions.rs     │   │   │   ├── functions.ts
│   │   │   ├── parameters.rs    │   │   │   ├── parameters.ts
│   │   │   ├── functions_store.rs│   │   │   ├── functions-store.ts
│   │   │   └── parameters_store.rs│   │   │   └── parameters-store.ts
│   │   └── signature/           │   │   └── signature/
│   │       ├── mod.rs           │   │       ├── index.ts
│   │       ├── signature_impl.rs│   │       ├── signature-impl.ts
│   │       └── signature_metadata.rs│   │       └── signature-metadata.ts
│   └── format/                  │   └── format/
│       ├── mod.rs               │       ├── index.ts
│       ├── diagnostic.rs        │       ├── diagnostic.ts
│       ├── envelope_summary.rs  │       ├── envelope-summary.ts
│       ├── format_context.rs    │       ├── format-context.ts
│       ├── hex.rs               │       ├── hex.ts
│       ├── mermaid.rs           │       ├── mermaid.ts
│       ├── notation.rs          │       ├── notation.ts
│       └── tree.rs              │       └── tree.ts
└── tests/                       └── tests/
    ├── core_tests.rs            ├── core-tests.test.ts
    ├── core_encoding_tests.rs   ├── core-encoding-tests.test.ts
    ├── core_nesting_tests.rs    ├── core-nesting-tests.test.ts
    ├── type_tests.rs            ├── type-tests.test.ts
    ├── elision_tests.rs         ├── elision-tests.test.ts
    ├── compression_tests.rs     ├── compression-tests.test.ts
    ├── encrypted_tests.rs       ├── encrypted-tests.test.ts
    ├── signature_tests.rs       ├── signature-tests.test.ts
    ├── ed25519_tests.rs         ├── ed25519-tests.test.ts
    ├── keypair_signing_tests.rs ├── keypair-signing-tests.test.ts
    ├── ssh_tests.rs             ├── ssh-tests.test.ts
    ├── sskr_tests.rs            ├── sskr-tests.test.ts
    ├── attachment_tests.rs      ├── attachment-tests.test.ts
    ├── proof_tests.rs           ├── proof-tests.test.ts
    ├── format_tests.rs          ├── format-tests.test.ts
    ├── multi_permit_tests.rs    ├── multi-permit-tests.test.ts
    ├── non_correlation_tests.rs ├── non-correlation-tests.test.ts
    ├── obscuring_tests.rs       ├── obscuring-tests.test.ts
    ├── encapsulation_tests.rs   ├── encapsulation-tests.test.ts
    ├── crypto_tests.rs          ├── crypto-tests.test.ts
    └── common/                  └── common/
        ├── mod.rs               ├── index.ts
        ├── test_data.rs         ├── test-data.ts
        ├── test_seed.rs         ├── test-seed.ts
        └── check_encoding.rs    └── check-encoding.ts
```

### File Naming Convention

- Rust `mod.rs` → TypeScript `index.ts`
- Rust `snake_case.rs` → TypeScript `snake-case.ts`
- Test files: `*_tests.rs` → `*-tests.test.ts`

---

## Complete File Mapping

### Core Source Files (52 files)

| # | Rust File | TypeScript File |
|---|-----------|-----------------|
| 1 | `src/lib.rs` | `src/index.ts` |
| 2 | `src/prelude.rs` | `src/prelude.ts` |
| 3 | `src/seal.rs` | `src/seal.ts` |
| 4 | `src/string_utils.rs` | `src/string-utils.ts` |
| 5 | `src/base/mod.rs` | `src/base/index.ts` |
| 6 | `src/base/assertion.rs` | `src/base/assertion.ts` |
| 7 | `src/base/assertions.rs` | `src/base/assertions.ts` |
| 8 | `src/base/cbor.rs` | `src/base/cbor.ts` |
| 9 | `src/base/digest.rs` | `src/base/digest.ts` |
| 10 | `src/base/elide.rs` | `src/base/elide.ts` |
| 11 | `src/base/envelope.rs` | `src/base/envelope.ts` |
| 12 | `src/base/envelope_encodable.rs` | `src/base/envelope-encodable.ts` |
| 13 | `src/base/envelope_decodable.rs` | `src/base/envelope-decodable.ts` |
| 14 | `src/base/error.rs` | `src/base/error.ts` |
| 15 | `src/base/leaf.rs` | `src/base/leaf.ts` |
| 16 | `src/base/queries.rs` | `src/base/queries.ts` |
| 17 | `src/base/walk.rs` | `src/base/walk.ts` |
| 18 | `src/base/wrap.rs` | `src/base/wrap.ts` |
| 19 | `src/extension/mod.rs` | `src/extension/index.ts` |
| 20 | `src/extension/compress.rs` | `src/extension/compress.ts` |
| 21 | `src/extension/encrypt.rs` | `src/extension/encrypt.ts` |
| 22 | `src/extension/proof.rs` | `src/extension/proof.ts` |
| 23 | `src/extension/recipient.rs` | `src/extension/recipient.ts` |
| 24 | `src/extension/salt.rs` | `src/extension/salt.ts` |
| 25 | `src/extension/secret.rs` | `src/extension/secret.ts` |
| 26 | `src/extension/sskr.rs` | `src/extension/sskr.ts` |
| 27 | `src/extension/types.rs` | `src/extension/types.ts` |
| 28 | `src/extension/attachment/mod.rs` | `src/extension/attachment/index.ts` |
| 29 | `src/extension/attachment/attachment_impl.rs` | `src/extension/attachment/attachment-impl.ts` |
| 30 | `src/extension/attachment/attachments.rs` | `src/extension/attachment/attachments.ts` |
| 31 | `src/extension/attachment/impl_attachable_macro.rs` | `src/extension/attachment/impl-attachable-macro.ts` |
| 32 | `src/extension/expressions/mod.rs` | `src/extension/expressions/index.ts` |
| 33 | `src/extension/expressions/expression.rs` | `src/extension/expressions/expression.ts` |
| 34 | `src/extension/expressions/function.rs` | `src/extension/expressions/function.ts` |
| 35 | `src/extension/expressions/parameter.rs` | `src/extension/expressions/parameter.ts` |
| 36 | `src/extension/expressions/request.rs` | `src/extension/expressions/request.ts` |
| 37 | `src/extension/expressions/response.rs` | `src/extension/expressions/response.ts` |
| 38 | `src/extension/expressions/event.rs` | `src/extension/expressions/event.ts` |
| 39 | `src/extension/expressions/functions.rs` | `src/extension/expressions/functions.ts` |
| 40 | `src/extension/expressions/parameters.rs` | `src/extension/expressions/parameters.ts` |
| 41 | `src/extension/expressions/functions_store.rs` | `src/extension/expressions/functions-store.ts` |
| 42 | `src/extension/expressions/parameters_store.rs` | `src/extension/expressions/parameters-store.ts` |
| 43 | `src/extension/signature/mod.rs` | `src/extension/signature/index.ts` |
| 44 | `src/extension/signature/signature_impl.rs` | `src/extension/signature/signature-impl.ts` |
| 45 | `src/extension/signature/signature_metadata.rs` | `src/extension/signature/signature-metadata.ts` |
| 46 | `src/format/mod.rs` | `src/format/index.ts` |
| 47 | `src/format/diagnostic.rs` | `src/format/diagnostic.ts` |
| 48 | `src/format/envelope_summary.rs` | `src/format/envelope-summary.ts` |
| 49 | `src/format/format_context.rs` | `src/format/format-context.ts` |
| 50 | `src/format/hex.rs` | `src/format/hex.ts` |
| 51 | `src/format/mermaid.rs` | `src/format/mermaid.ts` |
| 52 | `src/format/notation.rs` | `src/format/notation.ts` |
| 53 | `src/format/tree.rs` | `src/format/tree.ts` |

### Test Files (24 files)

| # | Rust Test File | TypeScript Test File |
|---|----------------|----------------------|
| 1 | `tests/core_tests.rs` | `tests/core-tests.test.ts` |
| 2 | `tests/core_encoding_tests.rs` | `tests/core-encoding-tests.test.ts` |
| 3 | `tests/core_nesting_tests.rs` | `tests/core-nesting-tests.test.ts` |
| 4 | `tests/type_tests.rs` | `tests/type-tests.test.ts` |
| 5 | `tests/elision_tests.rs` | `tests/elision-tests.test.ts` |
| 6 | `tests/compression_tests.rs` | `tests/compression-tests.test.ts` |
| 7 | `tests/encrypted_tests.rs` | `tests/encrypted-tests.test.ts` |
| 8 | `tests/signature_tests.rs` | `tests/signature-tests.test.ts` |
| 9 | `tests/ed25519_tests.rs` | `tests/ed25519-tests.test.ts` |
| 10 | `tests/keypair_signing_tests.rs` | `tests/keypair-signing-tests.test.ts` |
| 11 | `tests/ssh_tests.rs` | `tests/ssh-tests.test.ts` |
| 12 | `tests/sskr_tests.rs` | `tests/sskr-tests.test.ts` |
| 13 | `tests/attachment_tests.rs` | `tests/attachment-tests.test.ts` |
| 14 | `tests/proof_tests.rs` | `tests/proof-tests.test.ts` |
| 15 | `tests/format_tests.rs` | `tests/format-tests.test.ts` |
| 16 | `tests/multi_permit_tests.rs` | `tests/multi-permit-tests.test.ts` |
| 17 | `tests/non_correlation_tests.rs` | `tests/non-correlation-tests.test.ts` |
| 18 | `tests/obscuring_tests.rs` | `tests/obscuring-tests.test.ts` |
| 19 | `tests/encapsulation_tests.rs` | `tests/encapsulation-tests.test.ts` |
| 20 | `tests/crypto_tests.rs` | `tests/crypto-tests.test.ts` |
| 21 | `tests/common/mod.rs` | `tests/common/index.ts` |
| 22 | `tests/common/test_data.rs` | `tests/common/test-data.ts` |
| 23 | `tests/common/test_seed.rs` | `tests/common/test-seed.ts` |
| 24 | `tests/common/check_encoding.rs` | `tests/common/check-encoding.ts` |

---

## Dependencies

### package.json

```json
{
  "name": "bc-envelope",
  "version": "0.37.0",
  "description": "Gordian Envelope for TypeScript - 1:1 port from Rust",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./prelude": {
      "import": "./dist/prelude.mjs",
      "require": "./dist/prelude.js",
      "types": "./dist/prelude.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\""
  },
  "dependencies": {
    "@leonardocustodio/dcbor": "latest",
    "@noble/curves": "^1.4.0",
    "@noble/hashes": "^1.4.0",
    "libsodium-wrappers": "^0.7.13",
    "pako": "^2.1.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.7",
    "@types/pako": "^2.0.3",
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "@typescript-eslint/parser": "^7.7.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "prettier": "^3.2.5",
    "ts-jest": "^29.1.2",
    "tsup": "^8.0.2",
    "typescript": "^5.4.5"
  },
  "keywords": [
    "envelope",
    "cbor",
    "gordian",
    "blockchain-commons",
    "privacy",
    "encryption"
  ],
  "author": "Blockchain Commons",
  "license": "BSD-2-Clause-Patent"
}
```

---

## Implementation Strategy

### Phase 1: Base Module (Weeks 1-3)

Port in exact order:

1. **src/base/error.ts** - Error types first
2. **src/base/digest.ts** - Digest utilities (depends on @leonardocustodio/dcbor)
3. **src/base/cbor.ts** - CBOR encoding/decoding
4. **src/base/envelope-encodable.ts** - Encodable interface
5. **src/base/envelope-decodable.ts** - Decodable interface
6. **src/base/assertion.ts** - Assertion class
7. **src/base/assertions.ts** - Assertion collections
8. **src/base/leaf.ts** - Leaf handling
9. **src/base/envelope.ts** - Main Envelope class and EnvelopeCase enum
10. **src/base/queries.ts** - Query methods
11. **src/base/elide.ts** - Elision functionality
12. **src/base/wrap.ts** - Wrapping/unwrapping
13. **src/base/walk.ts** - Tree walking
14. **src/base/index.ts** - Module exports

### Phase 2: Extension Module (Weeks 4-8)

Port in exact order:

15. **src/extension/compress.ts**
16. **src/extension/encrypt.ts**
17. **src/extension/salt.ts**
18. **src/extension/signature/signature-metadata.ts**
19. **src/extension/signature/signature-impl.ts**
20. **src/extension/signature/index.ts**
21. **src/extension/recipient.ts**
22. **src/extension/secret.ts**
23. **src/extension/sskr.ts**
24. **src/extension/proof.ts**
25. **src/extension/types.ts**
26. **src/extension/attachment/attachment-impl.ts**
27. **src/extension/attachment/attachments.ts**
28. **src/extension/attachment/impl-attachable-macro.ts**
29. **src/extension/attachment/index.ts**
30. **src/extension/expressions/function.ts**
31. **src/extension/expressions/parameter.ts**
32. **src/extension/expressions/functions.ts**
33. **src/extension/expressions/parameters.ts**
34. **src/extension/expressions/functions-store.ts**
35. **src/extension/expressions/parameters-store.ts**
36. **src/extension/expressions/expression.ts**
37. **src/extension/expressions/request.ts**
38. **src/extension/expressions/response.ts**
39. **src/extension/expressions/event.ts**
40. **src/extension/expressions/index.ts**
41. **src/extension/index.ts**

### Phase 3: Format Module (Weeks 9-10)

42. **src/format/format-context.ts**
43. **src/format/notation.ts**
44. **src/format/diagnostic.ts**
45. **src/format/hex.ts**
46. **src/format/tree.ts**
47. **src/format/mermaid.ts**
48. **src/format/envelope-summary.ts**
49. **src/format/index.ts**

### Phase 4: Root Files (Week 11)

50. **src/seal.ts**
51. **src/string-utils.ts**
52. **src/prelude.ts**
53. **src/index.ts** (main entry point)

### Phase 5: Tests (Weeks 12-14)

Port all 24 test files maintaining exact test names and structure.

---

## Port Guidelines

### 1. Function Naming
- Keep exact same function names (convert to camelCase)
- Rust `add_assertion()` → TypeScript `addAssertion()`
- Maintain all function signatures

### 2. Type Conversions
- `Vec<T>` → `T[]`
- `Option<T>` → `T | undefined`
- `Result<T, E>` → Throw errors (use try/catch)
- `Rc<T>` / `Arc<T>` → Direct references (no RC needed in JS)
- `&str` / `String` → `string`
- `u8` / `i32` / `u64` → `number` or `bigint`
- `[u8]` → `Uint8Array`

### 3. Class Structure
Maintain same structure:
```typescript
// Rust: pub struct Envelope(Rc<EnvelopeCase>)
export class Envelope {
  readonly #case: EnvelopeCase;

  constructor(envelopeCase: EnvelopeCase) {
    this.#case = envelopeCase;
  }
}
```

### 4. Enum Conversions
```rust
// Rust enum
pub enum EnvelopeCase {
    Node { subject: Envelope, assertions: Vec<Envelope>, digest: Digest },
    Leaf { cbor: CBOR, digest: Digest },
}
```

```typescript
// TypeScript discriminated union
export type EnvelopeCase =
  | { type: 'node'; subject: Envelope; assertions: Envelope[]; digest: Digest }
  | { type: 'leaf'; cbor: CBOR; digest: Digest };
```

### 5. Module Exports
Each `mod.rs` becomes `index.ts` with re-exports:
```typescript
// src/base/index.ts
export * from './assertion';
export * from './envelope';
export * from './error';
// etc.
```

---

## Quality Checklist

For each file ported:
- [ ] Exact same function names (camelCase)
- [ ] All public functions ported
- [ ] All types ported
- [ ] Comments preserved
- [ ] Tests pass
- [ ] TypeScript strict mode compliant
- [ ] No `any` types in public API

---

## Implementation Order

### Week 1-2: Foundation
1. Set up project structure
2. Configure build system
3. Port error types
4. Port digest utilities
5. Port CBOR encoding

### Week 3-5: Core Envelope
6. Port Assertion class
7. Port Envelope class
8. Port queries
9. Port elision
10. Port wrapping

### Week 6-10: Extensions
11. Port compression
12. Port encryption
13. Port signatures
14. Port SSKR
15. Port expressions

### Week 11-12: Format & Root
16. Port formatting
17. Port root files

### Week 13-14: Tests
18. Port all test files
19. Verify 100% compatibility

---

**Status:** Ready to implement
**Next Step:** Create directory structure and begin porting base/error.ts
