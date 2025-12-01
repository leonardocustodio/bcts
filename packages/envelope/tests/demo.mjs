#!/usr/bin/env node
/**
 * Comprehensive demo of bc-envelope-ts features
 *
 * This demonstrates the core functionality that has been ported from bc-envelope-rust.
 */

import { Envelope, SymmetricKey, IS_A, SALT } from '../dist/index.mjs';

console.log('═'.repeat(60));
console.log('  Gordian Envelope TypeScript Demo');
console.log('═'.repeat(60));
console.log();

// ============================================================================
// 1. BASIC ENVELOPE CREATION
// ============================================================================
console.log('1. BASIC ENVELOPE CREATION');
console.log('─'.repeat(60));

const alice = Envelope.new('Alice');
console.log('Simple envelope:', alice.asText());
console.log('Digest:', alice.digest().hex().substring(0, 16) + '...');
console.log();

// ============================================================================
// 2. ASSERTIONS
// ============================================================================
console.log('2. ASSERTIONS');
console.log('─'.repeat(60));

const person = Envelope.new('Alice')
  .addAssertion('age', 30)
  .addAssertion('city', 'Boston')
  .addAssertion('email', 'alice@example.com');

console.log('Person with assertions:');
console.log(person.treeFormat());
console.log();

// ============================================================================
// 3. TYPE SYSTEM
// ============================================================================
console.log('3. TYPE SYSTEM');
console.log('─'.repeat(60));

const typedPerson = Envelope.new('Alice')
  .addType('Person')
  .addType('Employee')
  .addAssertion('employeeId', 12345);

console.log('Envelope with types:');
console.log(typedPerson.treeFormat());
console.log('Has type Person:', typedPerson.hasType('Person'));
console.log('Has type Employee:', typedPerson.hasType('Employee'));
console.log('Has type Manager:', typedPerson.hasType('Manager'));
console.log();

// ============================================================================
// 4. SALT (DECORRELATION)
// ============================================================================
console.log('4. SALT (DECORRELATION)');
console.log('─'.repeat(60));

const message1 = Envelope.new('Secret');
const message2 = Envelope.new('Secret');

console.log('Same content, same digest:');
console.log('  Message 1:', message1.digest().hex().substring(0, 16) + '...');
console.log('  Message 2:', message2.digest().hex().substring(0, 16) + '...');
console.log('  Equal:', message1.digest().equals(message2.digest()));

const salted1 = message1.addSalt();
const salted2 = message2.addSalt();

console.log('\nAfter adding salt, different digests:');
console.log('  Salted 1:', salted1.digest().hex().substring(0, 16) + '...');
console.log('  Salted 2:', salted2.digest().hex().substring(0, 16) + '...');
console.log('  Equal:', salted1.digest().equals(salted2.digest()));
console.log();

// ============================================================================
// 5. COMPRESSION
// ============================================================================
console.log('5. COMPRESSION');
console.log('─'.repeat(60));

const largeText = 'Lorem ipsum dolor sit amet. '.repeat(20);
const large = Envelope.new(largeText);
const compressed = large.compress();

const originalSize = large.cborBytes().length;
const compressedSize = compressed.cborBytes().length;
const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

console.log('Original size:', originalSize, 'bytes');
console.log('Compressed size:', compressedSize, 'bytes');
console.log('Compression ratio:', ratio + '%');
console.log('Digest preserved:', large.digest().equals(compressed.digest()));
console.log('Is compressed:', compressed.isCompressed());

const decompressed = compressed.decompress();
console.log('Decompressed successfully');
console.log('Content matches:', decompressed.asText() === largeText);
console.log();

// ============================================================================
// 6. ENCRYPTION
// ============================================================================
console.log('6. ENCRYPTION');
console.log('─'.repeat(60));

async function demoEncryption() {
  const secret = Envelope.new('Classified information');
  const key = await SymmetricKey.generate();

  console.log('Original:', secret.asText());
  console.log('Original digest:', secret.digest().hex().substring(0, 16) + '...');

  const encrypted = await secret.encryptSubject(key);
  console.log('\nEncrypted successfully');
  console.log('Is encrypted:', encrypted.isEncrypted());
  console.log('Digest preserved:', secret.digest().equals(encrypted.digest()));

  const decrypted = await encrypted.decryptSubject(key);
  console.log('\nDecrypted successfully');
  console.log('Content:', decrypted.asText());
  console.log('Content matches:', decrypted.asText() === 'Classified information');

  // Test wrong key
  const wrongKey = await SymmetricKey.generate();
  try {
    await encrypted.decryptSubject(wrongKey);
    console.log('❌ Wrong key should have failed');
  } catch {
    console.log('✅ Correctly rejected wrong key');
  }

  console.log();

  // ============================================================================
  // 7. WRAPPING
  // ============================================================================
  console.log('7. WRAPPING');
  console.log('─'.repeat(60));

  const envelopeWithAssertions = Envelope.new('Document')
    .addAssertion('author', 'Alice')
    .addAssertion('date', '2024-01-15');

  console.log('Original envelope:');
  console.log(envelopeWithAssertions.treeFormat());

  const wrapped = envelopeWithAssertions.wrap();
  console.log('Wrapped envelope:');
  console.log(wrapped.treeFormat());

  const unwrapped = wrapped.unwrap();
  console.log('Unwrapped successfully');
  console.log('Same digest:', unwrapped.digest().equals(envelopeWithAssertions.digest()));
  console.log();

  // ============================================================================
  // 8. NESTED ENVELOPES
  // ============================================================================
  console.log('8. NESTED ENVELOPES');
  console.log('─'.repeat(60));

  const nested = Envelope.new('Company')
    .addAssertion('name', 'ACME Corp')
    .addAssertion(
      'CEO',
      Envelope.new('Bob')
        .addType('Person')
        .addAssertion('age', 45)
        .addAssertion('email', 'bob@acme.com')
    )
    .addAssertion(
      'CTO',
      Envelope.new('Carol')
        .addType('Person')
        .addAssertion('age', 42)
    );

  console.log('Nested envelope structure:');
  console.log(nested.treeFormat());
  console.log();

  // ============================================================================
  // 9. COMBINED FEATURES
  // ============================================================================
  console.log('9. COMBINED FEATURES (Compression then Encryption)');
  console.log('─'.repeat(60));

  const sensitive = Envelope.new('Sensitive data: ' + 'X'.repeat(100));

  console.log('Original size:', sensitive.cborBytes().length, 'bytes');

  // Compress first
  const compressedSensitive = sensitive.compress();
  console.log('After compression:', compressedSensitive.cborBytes().length, 'bytes');
  console.log('Compression ratio:', ((1 - compressedSensitive.cborBytes().length / sensitive.cborBytes().length) * 100).toFixed(1) + '%');

  // Then encrypt the compressed data
  const encKey = await SymmetricKey.generate();
  const fullyProtected = await compressedSensitive.encryptSubject(encKey);
  console.log('Is encrypted:', fullyProtected.isEncrypted());
  console.log('Digest preserved:', sensitive.digest().equals(fullyProtected.digest()));

  // Decrypt and decompress
  const decryptedProtected = await fullyProtected.decryptSubject(encKey);
  const recoveredSensitive = decryptedProtected.decompress();
  console.log('\nDecrypted and decompressed successfully');
  console.log('Content matches:', recoveredSensitive.asText() === sensitive.asText());
  console.log();

  // ============================================================================
  // 10. ELISION (SELECTIVE DISCLOSURE)
  // ============================================================================
  console.log('10. ELISION (SELECTIVE DISCLOSURE)');
  console.log('─'.repeat(60));

  const credentials = Envelope.new('Alice')
    .addAssertion('name', 'Alice Smith')
    .addAssertion('age', 30)
    .addAssertion('ssn', '123-45-6789');

  console.log('Original credentials:');
  console.log(credentials.treeFormat());

  // Elide the entire envelope
  const completelyElided = credentials.elide();
  console.log('\nCompletely elided (only digest visible):');
  console.log(completelyElided.treeFormat());
  console.log('Digest preserved:', credentials.digest().equals(completelyElided.digest()));

  // Find and elide the SSN assertion
  const assertions = credentials.assertions();
  const ssnAssertion = assertions.find((a) => {
    const c = a.case();
    if (c.type === 'assertion') {
      const pred = c.assertion.predicate();
      if (pred.case().type === 'leaf') {
        try {
          return pred.asText() === 'ssn';
        } catch {
          return false;
        }
      }
    }
    return false;
  });

  if (ssnAssertion) {
    const targetSet = new Set([ssnAssertion.digest()]);
    const redacted = credentials.elideRemovingSet(targetSet);
    console.log('\nRedacted (SSN elided):');
    console.log(redacted.treeFormat());
    console.log('Top-level digest preserved:', credentials.digest().equals(redacted.digest()));
  }

  // Unelide to restore
  const revealed = completelyElided.unelide(credentials);
  console.log('\nRevealed successfully:', revealed.digest().equals(credentials.digest()));

  console.log();

  // ============================================================================
  // 11. FORMAT EXPORTS
  // ============================================================================
  console.log('11. FORMAT EXPORTS');
  console.log('─'.repeat(60));

  const demo = Envelope.new('Demo')
    .addAssertion('version', '0.37.0')
    .addAssertion('status', 'active');

  console.log('Hex format:');
  console.log(demo.hex().substring(0, 80) + '...');
  console.log('\nDiagnostic format:');
  console.log(demo.diagnostic().substring(0, 80) + '...');
  console.log('\nTree format:');
  console.log(demo.treeFormat());

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('═'.repeat(60));
  console.log('  DEMO COMPLETE');
  console.log('═'.repeat(60));
  console.log();
  console.log('✅ All features demonstrated successfully!');
  console.log();
  console.log('Ported features:');
  console.log('  • Basic envelopes and assertions');
  console.log('  • Type system (isA)');
  console.log('  • Salt (decorrelation)');
  console.log('  • Compression (DEFLATE/pako)');
  console.log('  • Encryption (XChaCha20-Poly1305/libsodium)');
  console.log('  • Elision (selective disclosure)');
  console.log('  • Wrapping/unwrapping');
  console.log('  • Nested envelopes');
  console.log('  • Tree format visualization');
  console.log('  • Hex and diagnostic exports');
  console.log();
}

demoEncryption().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
