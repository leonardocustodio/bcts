# Blockchain Commons Gordian Envelope for TypeScript

### _Port of bc-envelope-rust by Wolf McNally and Blockchain Commons_

---

## Introduction

[Gordian Envelope](https://www.blockchaincommons.com/introduction/Envelope-Intro/) is a structured format for hierarchical binary data focused on privacy. This is a TypeScript port of the Rust implementation.

Envelopes are designed to facilitate "smart documents" with a number of unique features:

- **Hierarchical structure**: Easy representation of a variety of semantic structures, from simple key-value pairs to complex property graphs
- **Merkle-like digest tree**: Built-in integrity verification at any level of the structure
- **Deterministic representation**: Uses CBOR with deterministic encoding rules for consistent serialization
- **Privacy-focused**: The holder of a document can selectively encrypt or elide specific parts without invalidating the structure, signatures, or digest tree
- **Progressive trust**: Holders can reveal information incrementally to build trust with verifiers

## Installation

```bash
npm install bc-envelope
# or
pnpm add bc-envelope
# or
yarn add bc-envelope
```

## Quick Start

```typescript
import { Envelope, SymmetricKey } from 'bc-envelope';

// Create a simple envelope with a string subject
const envelope = Envelope.new("Hello, world!");

// Add assertions to an envelope
const document = Envelope.new("Document")
  .addAssertion("created", "2025-01-15")
  .addAssertion("author", "Alice");

// Compress large content
const large = Envelope.new("Large content...".repeat(100));
const compressed = large.compress();
console.log(`Compressed to ${(compressed.cborBytes().length / large.cborBytes().length * 100).toFixed(1)}%`);

// Encrypt sensitive data
const key = await SymmetricKey.generate();
const secret = Envelope.new("Secret data");
const encrypted = await secret.encryptSubject(key);
const decrypted = await encrypted.decryptSubject(key);

// Add salt for decorrelation
const salted = envelope.addSalt();
```

## Features

### ✅ Core Features (Ported)

- **Basic Envelopes**: Create envelopes from strings, numbers, booleans, bytes
- **Assertions**: Attach predicate-object assertions to envelopes
- **Type System**: Add semantic types using the `isA` predicate
- **Wrapping**: Wrap envelopes to treat them as atomic units
- **Nested Envelopes**: Build hierarchical structures
- **Digest Tree**: Cryptographic hashes for integrity verification

### ✅ Privacy Extensions (Ported)

- **Salt**: Add random data to prevent digest correlation
  - `addSalt()` - Proportional salt sizing
  - `addSaltWithLength(bytes)` - Specific size
  - `addSaltInRange(min, max)` - Random range

- **Compression**: DEFLATE compression via pako
  - `compress()` - Compress entire envelope
  - `decompress()` - Decompress envelope
  - `compressSubject()` - Compress only subject
  - Preserves digest tree

- **Encryption**: XChaCha20-Poly1305 via libsodium
  - `encryptSubject(key)` - Encrypt subject only
  - `decryptSubject(key)` - Decrypt subject
  - `encrypt(key)` - Encrypt entire envelope (wraps first)
  - `decrypt(key)` - Decrypt and unwrap
  - Preserves digest tree

- **Elision**: Selective disclosure support
  - `elide()` - Replace envelope with just its digest
  - `elideRemovingSet(digests)` - Elide specific elements
  - `elideRevealingSet(digests)` - Reveal only specific elements
  - `elideRemovingTarget(provider)` - Elide single target
  - `unelide(envelope)` - Restore elided content
  - `walkUnelide(envelopes)` - Restore multiple elided nodes
  - Maintains digest tree integrity
  - Enables progressive trust

- **Signatures**: ECDSA digital signatures (secp256k1)
  - `addSignature(signer)` - Sign envelope subject
  - `addSignatureWithMetadata(signer, metadata)` - Sign with optional metadata
  - `addSignatures(signers)` - Multi-signature support
  - `hasSignatureFrom(verifier)` - Check for valid signature
  - `verifySignatureFrom(verifier)` - Verify and return envelope
  - `signatures()` - Get all signature assertions
  - Key generation and serialization
  - Signature metadata (notes, timestamps, etc.)

- **Attachments**: Vendor-specific metadata (BCR-2023-006)
  - `addAttachment(payload, vendor, conformsTo?)` - Add vendor metadata
  - `newAttachment(payload, vendor, conformsTo?)` - Create attachment envelope
  - `attachmentPayload()` - Extract attachment payload
  - `attachmentVendor()` - Get vendor identifier
  - `attachmentConformsTo()` - Get format URI
  - `attachments()` - Get all attachment assertions
  - `attachmentsWithVendorAndConformsTo(vendor?, conformsTo?)` - Filter attachments
  - `Attachments` container class for managing multiple attachments

- **Recipients**: Public-key encryption (X25519/sealed boxes via libsodium)
  - `encryptSubjectToRecipient(publicKey)` - Encrypt for single recipient
  - `encryptSubjectToRecipients(publicKeys)` - Encrypt for multiple recipients
  - `decryptSubjectToRecipient(privateKey)` - Decrypt as recipient
  - `addRecipient(publicKey, contentKey)` - Add recipient to encrypted envelope
  - `encryptToRecipients(publicKeys)` - Encrypt entire envelope (wraps first)
  - `decryptToRecipient(privateKey)` - Decrypt and unwrap
  - `recipients()` - Get all recipient sealed messages
  - `PrivateKeyBase.generate()` - Generate X25519 key pair
  - Ephemeral key construction for forward secrecy
  - Multiple recipients with privacy (no recipient can see others)

### ✅ Format Exports (Ported)

- **Hex**: Raw CBOR bytes as hex string
- **Diagnostic**: Human-readable CBOR notation
- **Tree**: Hierarchical visualization with digests

### ✅ Utilities (Ported)

- **String Helpers**: `flanked()`, `flankedBy()`
- **Walk/Traversal**: Tree walking with visitor pattern

### 🚧 Pending Features
- Expressions (parameter and function expressions)
- Proofs (zero-knowledge, inclusion, existence)
- SSKR (Shamir Secret Sharing)
- Envelope Notation format (human-readable parser/formatter)
- Mermaid diagram export (visual diagrams)

## API Documentation

### Creating Envelopes

```typescript
// From primitives
const text = Envelope.new("Hello");
const number = Envelope.new(42);
const bool = Envelope.new(true);
const bytes = Envelope.new(new Uint8Array([1, 2, 3]));

// With assertions
const person = Envelope.new("Alice")
  .addAssertion("age", 30)
  .addAssertion("city", "Boston");

// With types
const typed = Envelope.new("Alice")
  .addType("Person")
  .addType("Employee");

// Check types
if (typed.hasType("Person")) {
  console.log("Is a Person");
}
```

### Working with Digests

```typescript
const env1 = Envelope.new("Same content");
const env2 = Envelope.new("Same content");

// Same content = same digest
console.log(env1.digest().equals(env2.digest())); // true

// Get digest as hex
console.log(env1.digest().hex());

// Salt prevents correlation
const salted1 = env1.addSalt();
const salted2 = env2.addSalt();
console.log(salted1.digest().equals(salted2.digest())); // false
```

### Compression

```typescript
const large = Envelope.new("Lorem ipsum...".repeat(100));

// Compress
const compressed = large.compress();
console.log(`${compressed.cborBytes().length} bytes`);

// Decompress
const decompressed = compressed.decompress();
console.log(decompressed.asText());

// Check if compressed
if (envelope.isCompressed()) {
  envelope = envelope.decompress();
}
```

### Encryption

```typescript
// Generate a key
const key = await SymmetricKey.generate();

// Or create from existing bytes
const keyBytes = new Uint8Array(32);
crypto.getRandomValues(keyBytes);
const key = SymmetricKey.from(keyBytes);

// Encrypt subject only
const envelope = Envelope.new("Secret").addAssertion("public", "data");
const encrypted = await envelope.encryptSubject(key);

// Encrypt entire envelope (including assertions)
const fullyEncrypted = await envelope.encrypt(key);

// Decrypt
const decrypted = await encrypted.decryptSubject(key);
const fullyDecrypted = await fullyEncrypted.decrypt(key);

// Check if encrypted
if (envelope.isEncrypted()) {
  envelope = await envelope.decryptSubject(key);
}
```

### Recipients (Public-Key Encryption)

```typescript
import { PrivateKeyBase, PublicKeyBase } from 'bc-envelope';

// Generate recipient key pairs
const alice = await PrivateKeyBase.generate();
const bob = await PrivateKeyBase.generate();
const charlie = await PrivateKeyBase.generate();

// Encrypt to a single recipient
const message = Envelope.new("Secret message");
const encrypted = await message.encryptSubjectToRecipient(bob.publicKeys());

// Bob can decrypt
const bobDecrypted = await encrypted.decryptSubjectToRecipient(bob);

// Encrypt to multiple recipients
const multiEncrypted = await message.encryptSubjectToRecipients([
  alice.publicKeys(),
  bob.publicKeys(),
  charlie.publicKeys()
]);

// All three can decrypt
const aliceDecrypted = await multiEncrypted.decryptSubjectToRecipient(alice);
const bobDecrypted2 = await multiEncrypted.decryptSubjectToRecipient(bob);
const charlieDecrypted = await multiEncrypted.decryptSubjectToRecipient(charlie);

// Encrypt entire envelope to recipients
const document = Envelope.new("Contract");
const encryptedDoc = await document.encryptToRecipients([
  alice.publicKeys(),
  bob.publicKeys()
]);

// Decrypt and unwrap
const aliceDoc = await encryptedDoc.decryptToRecipient(alice);

// Add a recipient to already encrypted envelope
const contentKey = await SymmetricKey.generate();
const encrypted2 = await message.encryptSubject(contentKey);
const withAlice = await encrypted2.addRecipient(alice.publicKeys(), contentKey);
const withBob = await withAlice.addRecipient(bob.publicKeys(), contentKey);

// Get list of recipients (sealed messages)
const recipients = multiEncrypted.recipients();
console.log(`Envelope has ${recipients.length} recipients`);

// Key serialization
const privateHex = alice.hex();
const publicHex = alice.publicKeys().hex();
const restored = await PrivateKeyBase.fromHex(privateHex, publicHex);
```

**How it works:**

Recipients use libsodium's sealed box construction with X25519 key agreement:
1. A random symmetric content key is generated
2. The envelope's subject is encrypted with the content key
3. The content key is encrypted to each recipient's public key using an ephemeral key pair
4. The ephemeral private key is discarded, ensuring even the sender cannot decrypt later
5. Recipients try each sealed message until one decrypts successfully

**Note:** Each recipient sees the same decrypted content, but cannot identify other recipients from the envelope structure.

### Elision (Selective Disclosure)

```typescript
// Create an envelope with sensitive data
const person = Envelope.new("Alice")
  .addAssertion("name", "Alice Smith")
  .addAssertion("age", 30)
  .addAssertion("ssn", "123-45-6789");

// Elide the entire envelope (show only digest)
const completelyElided = person.elide();

// Elide specific assertions
const ssnAssertion = person.assertions().find(/* find SSN assertion */);
const targetSet = new Set([ssnAssertion.digest()]);
const redacted = person.elideRemovingSet(targetSet);

// Reveal only specific assertions (elide the rest)
const nameAssertion = person.assertions().find(/* find name assertion */);
const revealSet = new Set([
  person.subject().digest(),
  nameAssertion.digest(),
]);
const selective = person.elideRevealingSet(revealSet);

// Restore elided content
const revealed = completelyElided.unelide(person);

// Restore multiple elided nodes
const restoredMultiple = redacted.walkUnelide([ssnAssertion]);

// Check digest integrity
console.log(person.digest().equals(redacted.digest())); // true
```

### Signatures

```typescript
import { SigningPrivateKey, SignatureMetadata, NOTE } from 'bc-envelope';

// Generate a key pair
const privateKey = SigningPrivateKey.generate();
const publicKey = privateKey.publicKey();

// Basic signature
const message = Envelope.new("Hello, world!");
const signed = message.addSignature(privateKey);

// Verify signature
if (signed.hasSignatureFrom(publicKey)) {
  console.log("Valid signature!");
}

// Throws if signature is invalid
const verified = signed.verifySignatureFrom(publicKey);

// Signature with metadata
const metadata = new SignatureMetadata()
  .withAssertion(NOTE, "Signed by Alice")
  .withAssertion("timestamp", "2024-01-15T10:30:00Z")
  .withAssertion("purpose", "Contract approval");

const document = Envelope.new("Contract");
const signedWithMetadata = document.addSignatureWithMetadata(privateKey, metadata);

// Multi-signature
const alice = SigningPrivateKey.generate();
const bob = SigningPrivateKey.generate();
const charlie = SigningPrivateKey.generate();

const contract = Envelope.new("Multi-party agreement");
const multiSigned = contract.addSignatures([alice, bob, charlie]);

// Verify all signatures
console.log(multiSigned.hasSignatureFrom(alice.publicKey())); // true
console.log(multiSigned.hasSignatureFrom(bob.publicKey())); // true
console.log(multiSigned.hasSignatureFrom(charlie.publicKey())); // true

// Key serialization
const keyHex = Array.from(privateKey.data())
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');
const restored = SigningPrivateKey.fromHex(keyHex);
```

### Attachments

```typescript
import { Attachments, ATTACHMENT } from 'bc-envelope';

// Add vendor-specific metadata to an envelope
const document = Envelope.new('User data')
  .addAssertion('name', 'Alice')
  .addAttachment(
    'Vendor-specific metadata',
    'com.example',
    'https://example.com/metadata/v1'
  );

// Create standalone attachment envelope
const attachment = Envelope.newAttachment(
  'Custom data',
  'com.example',
  'https://example.com/format/v1'
);

console.log(attachment.attachmentPayload().asText()); // "Custom data"
console.log(attachment.attachmentVendor()); // "com.example"
console.log(attachment.attachmentConformsTo()); // "https://example.com/format/v1"

// Multiple attachments from different vendors
const envelope = Envelope.new('Data')
  .addAttachment('Data 1', 'com.vendor1', 'https://vendor1.com/v1')
  .addAttachment('Data 2', 'com.vendor1', 'https://vendor1.com/v2')
  .addAttachment('Data 3', 'com.vendor2', 'https://vendor2.com/v1');

// Get all attachments
const allAttachments = envelope.attachments();
console.log(allAttachments.length); // 3

// Filter by vendor
const vendor1Attachments = envelope.attachmentsWithVendorAndConformsTo('com.vendor1');
console.log(vendor1Attachments.length); // 2

// Filter by format
const v1Attachments = envelope.attachmentsWithVendorAndConformsTo(
  undefined,
  'https://vendor1.com/v1'
);
console.log(v1Attachments.length); // 1

// Filter by both
const specific = envelope.attachmentsWithVendorAndConformsTo(
  'com.vendor1',
  'https://vendor1.com/v2'
);
console.log(specific.length); // 1

// Use Attachments container for batch operations
const container = new Attachments();
container.add('Attachment 1', 'com.app');
container.add('Attachment 2', 'com.app', 'https://app.com/schema');

const base = Envelope.new('Document');
const withAttachments = container.addToEnvelope(base);
```

### Wrapping and Unwrapping

```typescript
const document = Envelope.new("Document")
  .addAssertion("author", "Alice");

// Wrap to treat as atomic unit
const wrapped = document.wrap();

// Add assertions about the wrapped envelope
const signed = wrapped.addAssertion("signature", "...");

// Unwrap to get original
const unwrapped = signed.unwrap();
```

### Format Exports

```typescript
const envelope = Envelope.new("Demo")
  .addAssertion("version", "1.0");

// Hex format (raw CBOR bytes)
console.log(envelope.hex());
// Output: d8c883d8cc...

// Diagnostic format (CBOR structure)
console.log(envelope.diagnostic());
// Output: 200(204({"isCbor":true...

// Tree format (hierarchical view)
console.log(envelope.treeFormat());
// Output:
// e659008 NODE
//     0aa3346 subj "Demo"
//     154fa8a ASSERTION
//         433dcb3 pred "version"
//         b848725 obj "1.0"

// Tree with options
console.log(envelope.treeFormat({ hideNodes: true }));
```

## Demo

Run the comprehensive demo to see all features in action:

```bash
node demo.mjs
```

The demo showcases:
1. Basic envelope creation
2. Assertions
3. Type system
4. Salt (decorrelation)
5. Compression
6. Encryption
7. Wrapping
8. Nested envelopes
9. Combined features (compression + encryption)
10. Elision (selective disclosure)
11. Signatures (ECDSA)
12. Format exports

## Testing

Run the comprehensive test suite:

```bash
npm test                  # Run all tests
npm run demo              # Run feature demo
npm run test:types        # Test type system
npm run test:salt         # Test salt/decorrelation
npm run test:elide        # Test elision
npm run test:signature    # Test signatures
npm run test:attachment   # Test attachments
npm run test:recipient    # Test recipients (public-key encryption)
npm run test:string       # Test string utilities
```

**Test Status**: 7/9 test suites passing (77.8%)
- ✅ Type System
- ✅ Salt (Decorrelation)
- ✅ Elision (Selective Disclosure)
- ✅ Signatures (ECDSA)
- ✅ Attachments (Vendor Metadata)
- ✅ Recipients (Public-Key Encryption)
- ✅ String Utilities
- ⚠️ Compression (works for simple envelopes, known CborMap issue with assertions)
- ⚠️ Encryption (works for simple envelopes, known CborMap issue with assertions)

## Architecture

The library is organized into modules:

- **`src/base/`** - Core envelope functionality
  - `envelope.ts` - Main Envelope class
  - `digest.ts` - SHA-256 digest provider
  - `assertion.ts` - Predicate-object assertions
  - `leaf.ts` - Leaf envelope creation
  - `wrap.ts` - Wrapping/unwrapping
  - `walk.ts` - Tree traversal

- **`src/base/`** (continued)
  - `elide.ts` - Elision/selective disclosure

- **`src/extension/`** - Extended features
  - `types.ts` - Type system (`isA`)
  - `salt.ts` - Salt/decorrelation
  - `compress.ts` - Compression (pako)
  - `encrypt.ts` - Encryption (libsodium)
  - `signature.ts` - Digital signatures (secp256k1)
  - `attachment.ts` - Vendor-specific metadata (BCR-2023-006)
  - `recipient.ts` - Public-key encryption (X25519/sealed boxes)

- **`src/utils/`** - Utility functions
  - `string.ts` - String formatting helpers

- **`src/format/`** - Output formats
  - `hex.ts` - Hex encoding
  - `diagnostic.ts` - CBOR diagnostic notation
  - `tree.ts` - Tree visualization

## Dependencies

- `@leonardocustodio/dcbor` - Deterministic CBOR encoding
- `@noble/hashes` - SHA-256 hashing
- `pako` - DEFLATE compression
- `libsodium-wrappers` - XChaCha20-Poly1305 encryption

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run tests
node test-types.mjs
node test-salt.mjs
node test-compress.mjs
node test-encrypt.mjs

# Run demo
node demo.mjs
```

## Known Issues

- CborMap parsing for assertions with certain complex structures may fail
- Simple envelopes and basic assertions work correctly
- Compression and encryption work on simple envelopes

## Version

Current version: **0.37.0** (matching bc-envelope-rust)

## License

This project follows the same license as bc-envelope-rust.

## Credits

- Original Rust implementation by Wolf McNally and Blockchain Commons
- TypeScript port maintains API compatibility where possible
- See [bc-envelope-rust](https://github.com/BlockchainCommons/bc-envelope-rust) for the reference implementation

## Links

- [Gordian Envelope Introduction](https://www.blockchaincommons.com/introduction/Envelope-Intro/)
- [bc-envelope-rust](https://github.com/BlockchainCommons/bc-envelope-rust)
- [Blockchain Commons](https://www.blockchaincommons.com/)
