#!/usr/bin/env node
import { Envelope, SymmetricKey } from '../dist/index.mjs';

console.log('Testing Encryption Extension...\n');

async function runTests() {
  // Test 1: Basic encryption and decryption
  console.log('1. Basic encryption of subject:');
  const envelope = Envelope.new('Secret message');
  const key = await SymmetricKey.generate();

  const encrypted = await envelope.encryptSubject(key);
  console.log('Encrypted successfully');
  console.log('Same digest:', envelope.digest().equals(encrypted.digest()));
  console.log('Subject is encrypted:', encrypted.subject().isEncrypted());

  // Test 2: Decryption
  console.log('\n2. Decryption:');
  const decrypted = await encrypted.decryptSubject(key);
  console.log('Decrypted successfully');
  console.log('Same digest:', decrypted.digest().equals(envelope.digest()));
  console.log('Same content:', decrypted.asText() === 'Secret message');
  console.log('Not encrypted:', !decrypted.isEncrypted());

  // Test 3: Encrypt entire envelope with assertions
  console.log('\n3. Encrypt entire envelope:');
  const envelopeWithAssertions = Envelope.new('Alice')
    .addAssertion('email', 'alice@example.com')
    .addAssertion('age', 30);

  const fullyEncrypted = await envelopeWithAssertions.encrypt(key);
  console.log('Fully encrypted');
  console.log('Is encrypted:', fullyEncrypted.isEncrypted());

  // Test 4: Decrypt entire envelope
  console.log('\n4. Decrypt entire envelope:');
  const fullyDecrypted = await fullyEncrypted.decrypt(key);
  console.log('Fully decrypted');
  console.log('Same content:', fullyDecrypted.subject().asText() === 'Alice');
  console.log('Has assertions:', fullyDecrypted.assertions().length === 2);

  // Test 5: Wrong key fails
  console.log('\n5. Decryption with wrong key:');
  const wrongKey = await SymmetricKey.generate();
  try {
    await encrypted.decryptSubject(wrongKey);
    console.log('❌ Should have thrown error');
  } catch (e) {
    console.log('✅ Correctly threw error:', e.message);
  }

  // Test 6: Double encryption fails
  console.log('\n6. Double encryption:');
  try {
    await encrypted.encryptSubject(key);
    console.log('❌ Should have thrown error');
  } catch (e) {
    console.log('✅ Correctly threw error:', e.message);
  }

  // Test 7: Encrypt with assertions but only subject
  console.log('\n7. Encrypt subject with assertions:');
  const partiallyEncrypted = await envelopeWithAssertions.encryptSubject(key);
  console.log('Subject encrypted');
  console.log('Subject is encrypted:', partiallyEncrypted.subject().isEncrypted());
  console.log('Has assertions:', partiallyEncrypted.assertions().length === 2);

  const partiallyDecrypted = await partiallyEncrypted.decryptSubject(key);
  console.log('Subject decrypted');
  console.log('Same digest:', partiallyDecrypted.digest().equals(envelopeWithAssertions.digest()));

  // Test 8: Key persistence
  console.log('\n8. Key from bytes:');
  const keyBytes = key.data();
  const restoredKey = SymmetricKey.from(keyBytes);
  const decryptedWithRestored = await encrypted.decryptSubject(restoredKey);
  console.log('Key restored from bytes');
  console.log('Decryption works:', decryptedWithRestored.asText() === 'Secret message');

  // Test 9: Larger content
  console.log('\n9. Encrypt larger content:');
  const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(100);
  const largeEnvelope = Envelope.new(largeContent);
  const largeEncrypted = await largeEnvelope.encryptSubject(key);
  const largeDecrypted = await largeEncrypted.decryptSubject(key);
  console.log('Large content encrypted and decrypted');
  console.log('Content preserved:', largeDecrypted.asText() === largeContent);

  // Test 10: Nested envelopes
  console.log('\n10. Nested envelope encryption:');
  const nested = Envelope.new('Outer')
    .addAssertion('inner', Envelope.new('Inner secret'));

  const nestedEncrypted = await nested.encryptSubject(key);
  const nestedDecrypted = await nestedEncrypted.decryptSubject(key);
  console.log('Nested envelope encrypted/decrypted');
  console.log('Same digest:', nestedDecrypted.digest().equals(nested.digest()));

  console.log('\n✅ All encryption tests complete!');
}

runTests().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
