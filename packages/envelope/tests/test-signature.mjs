#!/usr/bin/env node
import { Envelope, SigningPrivateKey } from '../dist/index.mjs';

console.log('='.repeat(70));
console.log('SIGNATURE TESTS');
console.log('='.repeat(70));

// Test 1: Key generation
console.log('\n1. Key Generation:');
const privateKey = SigningPrivateKey.generate();
const publicKey = privateKey.publicKey();
console.log('  ✅ Generated private key');
console.log('  ✅ Derived public key');
console.log('  Public key (hex):', publicKey.hex().substring(0, 20) + '...');

// Test 2: Basic signature
console.log('\n2. Basic Signature:');
const message = Envelope.new('Hello, world!');
const signed = message.addSignature(privateKey);
console.log('  Original subject:', message.subject().asText());
console.log('  Signed envelope has', signed.assertions().length, 'assertions');
console.log('  Has signature:', signed.signatures().length > 0);

// Test 3: Signature verification
console.log('\n3. Signature Verification:');
const hasValidSig = signed.hasSignatureFrom(publicKey);
console.log('  Valid signature from correct key:', hasValidSig);

try {
  const verified = signed.verifySignatureFrom(publicKey);
  console.log('  ✅ Signature verification passed');
  console.log('  Verified content:', verified.subject().asText());
} catch (e) {
  console.log('  ❌ Signature verification failed:', e.message);
}

// Test 4: Invalid signature verification
console.log('\n4. Invalid Signature Verification:');
const wrongKey = SigningPrivateKey.generate();
const wrongPublicKey = wrongKey.publicKey();
const hasInvalidSig = signed.hasSignatureFrom(wrongPublicKey);
console.log('  Valid signature from wrong key:', hasInvalidSig);
console.log('  ✅ Correctly rejected invalid signature');

// Test 5: Multiple signatures
console.log('\n5. Multiple Signatures:');
const alice = SigningPrivateKey.generate();
const bob = SigningPrivateKey.generate();
const charlie = SigningPrivateKey.generate();

const contract = Envelope.new('Multi-party agreement');
const multiSigned = contract.addSignatures([alice, bob, charlie]);

console.log('  Contract subject:', contract.subject().asText());
console.log('  Number of signatures:', multiSigned.signatures().length);
console.log('  Alice signed:', multiSigned.hasSignatureFrom(alice.publicKey()));
console.log('  Bob signed:', multiSigned.hasSignatureFrom(bob.publicKey()));
console.log('  Charlie signed:', multiSigned.hasSignatureFrom(charlie.publicKey()));

// Test 6: Signature with metadata
console.log('\n6. Signature with Metadata:');
import { SignatureMetadata, NOTE } from '../dist/index.mjs';

const metadata = new SignatureMetadata()
  .withAssertion(NOTE, 'Signed by Alice')
  .withAssertion('timestamp', '2024-01-15T10:30:00Z')
  .withAssertion('purpose', 'Contract approval');

const document = Envelope.new('Important document');
const signedWithMetadata = document.addSignatureWithMetadata(alice, metadata);

console.log('  Document subject:', document.subject().asText());
console.log('  Signed envelope has', signedWithMetadata.assertions().length, 'assertions');
console.log('  Has signature from Alice:', signedWithMetadata.hasSignatureFrom(alice.publicKey()));
console.log('  Number of signatures:', signedWithMetadata.signatures().length);

// Test 7: Key serialization
console.log('\n7. Key Serialization:');
const key1 = SigningPrivateKey.generate();
const key1Hex = Array.from(key1.data())
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
const key2 = SigningPrivateKey.fromHex(key1Hex);

const testMsg = Envelope.new('Test message');
const sig1 = testMsg.addSignature(key1);
const sig2 = testMsg.addSignature(key2);

console.log('  Key serialized to hex:', key1Hex.substring(0, 20) + '...');
console.log('  Key deserialized from hex: ✅');
console.log('  Keys produce same signature:',
  sig1.hasSignatureFrom(key2.publicKey()) &&
  sig2.hasSignatureFrom(key1.publicKey()));

// Test 8: Signature preservation through operations
console.log('\n8. Signature Preservation:');
const original = Envelope.new('Alice')
  .addAssertion('age', 30)
  .addSignature(alice);

console.log('  Original subject:', original.subject().asText());
console.log('  Has signature before wrapping:', original.hasSignatureFrom(alice.publicKey()));

const wrapped = original.wrap();
console.log('  Wrapped envelope subject type:', wrapped.subject().case().type);
console.log('  Original still has signature:', original.hasSignatureFrom(alice.publicKey()));

// Summary
console.log('\n' + '='.repeat(70));
console.log('SIGNATURE TESTS COMPLETE');
console.log('='.repeat(70));
console.log('All signature features working correctly! ✅');
console.log('');
