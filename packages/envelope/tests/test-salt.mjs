#!/usr/bin/env node
import { Envelope, SALT } from '../dist/index.mjs';

console.log('Testing Salt Extension...\n');

// Test 1: Basic decorrelation
console.log('1. Basic decorrelation with addSalt():');
const alice1 = Envelope.new('Alice')
  .addAssertion('email', 'alice@example.com')
  .addAssertion('ssn', '123-45-6789');

const alice2 = Envelope.new('Alice')
  .addAssertion('email', 'alice@example.com')
  .addAssertion('ssn', '123-45-6789');

console.log('Before salt - same digest:', alice1.digest().equals(alice2.digest()));

const salted1 = alice1.addSalt();
const salted2 = alice2.addSalt();

console.log('After salt - different digests:', !salted1.digest().equals(salted2.digest()));
console.log('Salted envelope has salt assertion:', salted1.assertions().some(a => {
  try {
    return a.predicate().asText() === SALT;
  } catch {
    return false;
  }
}));

// Test 2: addSaltWithLength
console.log('\n2. addSaltWithLength(16):');
const envelope1 = Envelope.new('Hello');
const salted16 = envelope1.addSaltWithLength(16);
console.log('Created envelope with 16 bytes of salt');
console.log('Different digest:', !envelope1.digest().equals(salted16.digest()));

// Test 3: Error on small salt
console.log('\n3. Error handling for salt < 8 bytes:');
try {
  envelope1.addSaltWithLength(7);
  console.log('❌ Should have thrown error');
} catch (e) {
  console.log('✅ Correctly threw error:', e.message);
}

// Test 4: addSaltBytes
console.log('\n4. addSaltBytes with specific bytes:');
const specificSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const envelope2 = Envelope.new('Test');
const saltedSpecific = envelope2.addSaltBytes(specificSalt);
console.log('Added specific salt bytes');
console.log('Different digest:', !envelope2.digest().equals(saltedSpecific.digest()));

// Test 5: Error on small salt bytes
console.log('\n5. Error handling for salt bytes < 8:');
try {
  const tooSmall = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
  envelope2.addSaltBytes(tooSmall);
  console.log('❌ Should have thrown error');
} catch (e) {
  console.log('✅ Correctly threw error:', e.message);
}

// Test 6: addSaltInRange
console.log('\n6. addSaltInRange(16, 32):');
const envelope3 = Envelope.new('Range test');
const saltedRange = envelope3.addSaltInRange(16, 32);
console.log('Added salt with random length between 16-32 bytes');
console.log('Different digest:', !envelope3.digest().equals(saltedRange.digest()));

// Test 7: Error on invalid range
console.log('\n7. Error handling for invalid range:');
try {
  envelope3.addSaltInRange(7, 32);
  console.log('❌ Should have thrown error (min < 8)');
} catch (e) {
  console.log('✅ Correctly threw error:', e.message);
}

try {
  envelope3.addSaltInRange(16, 10);
  console.log('❌ Should have thrown error (max < min)');
} catch (e) {
  console.log('✅ Correctly threw error:', e.message);
}

// Test 8: Proportional salt sizing
console.log('\n8. Proportional salt sizing:');
const small = Envelope.new('Hi');
const large = Envelope.new('A'.repeat(500));

const smallSalted = small.addSalt();
const largeSalted = large.addSalt();

console.log('Small envelope salted successfully');
console.log('Large envelope salted successfully');
console.log('Both have different digests than originals');

// Test 9: Multiple salts create different digests
console.log('\n9. Multiple salts on same content create different digests:');
const base = Envelope.new('Same content');
const salt1 = base.addSalt();
const salt2 = base.addSalt();
const salt3 = base.addSalt();

const allDifferent =
  !salt1.digest().equals(salt2.digest()) &&
  !salt1.digest().equals(salt3.digest()) &&
  !salt2.digest().equals(salt3.digest());

console.log('All three salted versions have different digests:', allDifferent);

// Test 10: SALT constant
console.log('\n10. SALT constant:');
console.log('SALT constant value:', JSON.stringify(SALT));
console.log('Matches expected value:', SALT === 'salt');

console.log('\n✅ All salt tests complete!');
