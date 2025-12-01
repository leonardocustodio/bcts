#!/usr/bin/env node
import { Envelope } from '../dist/index.mjs';

console.log('Testing Compression Extension...\n');

// Test 1: Basic compression and decompression
console.log('1. Basic compression:');
const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(
    5
  );
const envelope = Envelope.new(lorem);
const originalSize = envelope.cborBytes().length;

const compressed = envelope.compress();
const compressedSize = compressed.cborBytes().length;

console.log('Original size:', originalSize, 'bytes');
console.log('Compressed size:', compressedSize, 'bytes');
console.log('Compression ratio:', ((1 - compressedSize / originalSize) * 100).toFixed(1) + '%');
console.log('Same digest:', envelope.digest().equals(compressed.digest()));
console.log('Is compressed:', compressed.isCompressed());

// Test 2: Decompression
console.log('\n2. Decompression:');
const decompressed = compressed.decompress();
console.log('Decompressed successfully');
console.log('Same digest as original:', decompressed.digest().equals(envelope.digest()));
console.log('Same content:', decompressed.asText() === lorem);
console.log('Is not compressed:', !decompressed.isCompressed());

// Test 3: Double compression (should return same envelope)
console.log('\n3. Double compression:');
const doubleCompressed = compressed.compress();
console.log('Second compress returns same envelope:', doubleCompressed === compressed);

// Test 4: Compression with assertions
console.log('\n4. Compression with assertions:');
const withAssertions = Envelope.new('Subject')
  .addAssertion('key1', 'A'.repeat(100))
  .addAssertion('key2', 'B'.repeat(100))
  .addAssertion('key3', 'C'.repeat(100));

const originalWithAssertionsSize = withAssertions.cborBytes().length;
const compressedWithAssertions = withAssertions.compress();
const compressedWithAssertionsSize = compressedWithAssertions.cborBytes().length;

console.log('Original size:', originalWithAssertionsSize, 'bytes');
console.log('Compressed size:', compressedWithAssertionsSize, 'bytes');
console.log(
  'Compression ratio:',
  ((1 - compressedWithAssertionsSize / originalWithAssertionsSize) * 100).toFixed(1) + '%'
);

const decompressedWithAssertions = compressedWithAssertions.decompress();
console.log('Decompressed successfully');
console.log('Same digest:', decompressedWithAssertions.digest().equals(withAssertions.digest()));

// Test 5: Subject-only compression
console.log('\n5. Subject-only compression:');
const largeSubject = Envelope.new('X'.repeat(200))
  .addAssertion('note', 'Small metadata')
  .addAssertion('tag', 'important');

const subjectCompressed = largeSubject.compressSubject();
console.log('Subject compressed');
console.log('Subject is compressed:', subjectCompressed.subject().isCompressed());
console.log('Same digest:', subjectCompressed.digest().equals(largeSubject.digest()));

// The assertions should still be accessible
try {
  const assertions = subjectCompressed.assertions();
  console.log('Assertions still accessible:', assertions.length === 2);
} catch (e) {
  console.log('Could not access assertions:', e.message);
}

// Test 6: Subject decompression
console.log('\n6. Subject decompression:');
const subjectDecompressed = subjectCompressed.decompressSubject();
console.log('Subject decompressed');
console.log('Subject is not compressed:', !subjectDecompressed.subject().isCompressed());
console.log('Same digest:', subjectDecompressed.digest().equals(largeSubject.digest()));

// Test 7: Error handling - decompress non-compressed
console.log('\n7. Error handling:');
try {
  envelope.decompress();
  console.log('❌ Should have thrown error');
} catch (e) {
  console.log('✅ Correctly threw error:', e.message);
}

// Test 8: Small content (compression may not help)
console.log('\n8. Small content compression:');
const small = Envelope.new('Hi');
const smallCompressed = small.compress();
const smallOriginalSize = small.cborBytes().length;
const smallCompressedSize = smallCompressed.cborBytes().length;

console.log('Small original size:', smallOriginalSize, 'bytes');
console.log('Small compressed size:', smallCompressedSize, 'bytes');
console.log('Still has same digest:', small.digest().equals(smallCompressed.digest()));

// Test 9: Nested envelopes
console.log('\n9. Nested envelope compression:');
const nested = Envelope.new('Alice')
  .addAssertion(
    'profile',
    Envelope.new('Profile data: ' + 'Y'.repeat(100))
      .addAssertion('bio', 'Z'.repeat(100))
  )
  .addAssertion('settings', 'W'.repeat(100));

const nestedOriginalSize = nested.cborBytes().length;
const nestedCompressed = nested.compress();
const nestedCompressedSize = nestedCompressed.cborBytes().length;

console.log('Nested original size:', nestedOriginalSize, 'bytes');
console.log('Nested compressed size:', nestedCompressedSize, 'bytes');
console.log(
  'Compression ratio:',
  ((1 - nestedCompressedSize / nestedOriginalSize) * 100).toFixed(1) + '%'
);

const nestedDecompressed = nestedCompressed.decompress();
console.log('Nested decompressed successfully');
console.log('Same digest:', nestedDecompressed.digest().equals(nested.digest()));

console.log('\n✅ All compression tests complete!');
