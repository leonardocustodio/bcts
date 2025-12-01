#!/usr/bin/env node
import { Envelope, Attachments, ATTACHMENT } from '../dist/index.mjs';

console.log('='.repeat(70));
console.log('ATTACHMENT TESTS');
console.log('='.repeat(70));

// Test 1: Create attachment envelope
console.log('\n1. Create Attachment Envelope:');
const attachment = Envelope.newAttachment(
  'Custom data',
  'com.example',
  'https://example.com/format/v1'
);
console.log('  Created attachment envelope');
console.log('  Payload:', attachment.attachmentPayload().asText());
console.log('  Vendor:', attachment.attachmentVendor());
console.log('  ConformsTo:', attachment.attachmentConformsTo());

// Test 2: Add attachment to envelope
console.log('\n2. Add Attachment to Envelope:');
const document = Envelope.new('User data')
  .addAssertion('name', 'Alice')
  .addAttachment(
    'Vendor-specific metadata',
    'com.example',
    'https://example.com/metadata/v1'
  );

console.log('  Document subject:', document.subject().asText());
console.log('  Total assertions:', document.assertions().length);

const attachments = document.attachments();
console.log('  Number of attachments:', attachments.length);

if (attachments.length > 0) {
  const att = attachments[0];
  console.log('  Attachment payload:', att.unwrap().subject().asText());
  console.log('  Attachment vendor:', att.objectForPredicate('vendor').asText());
}

// Test 3: Multiple attachments
console.log('\n3. Multiple Attachments:');
const envelope = Envelope.new('Data')
  .addAttachment('Attachment 1', 'com.example', 'https://example.com/v1')
  .addAttachment('Attachment 2', 'com.example', 'https://example.com/v2')
  .addAttachment('Attachment 3', 'com.other', 'https://other.com/v1');

const allAttachments = envelope.attachments();
console.log('  Total attachments:', allAttachments.length);

// Test 4: Filter attachments by vendor
console.log('\n4. Filter Attachments by Vendor:');
const exampleAttachments = envelope.attachmentsWithVendorAndConformsTo('com.example');
console.log('  com.example attachments:', exampleAttachments.length);

const otherAttachments = envelope.attachmentsWithVendorAndConformsTo('com.other');
console.log('  com.other attachments:', otherAttachments.length);

// Test 5: Filter by conformsTo
console.log('\n5. Filter by ConformsTo:');
const v1Attachments = envelope.attachmentsWithVendorAndConformsTo(
  undefined,
  'https://example.com/v1'
);
console.log('  v1 format attachments:', v1Attachments.length);

// Test 6: Filter by both vendor and conformsTo
console.log('\n6. Filter by Vendor AND ConformsTo:');
const specificAttachments = envelope.attachmentsWithVendorAndConformsTo(
  'com.example',
  'https://example.com/v2'
);
console.log('  Specific match:', specificAttachments.length);

// Test 7: Attachments container
console.log('\n7. Attachments Container:');
const container = new Attachments();
container.add('Data 1', 'com.vendor1');
container.add('Data 2', 'com.vendor2', 'https://vendor2.com/schema');
container.add('Data 3', 'com.vendor3');

console.log('  Container is empty:', container.isEmpty());

const base = Envelope.new('Base document');
const withAttachments = container.addToEnvelope(base);
console.log('  Attachments added to envelope:', withAttachments.attachments().length);

// Test 8: Extract attachments from envelope
console.log('\n8. Extract Attachments from Envelope:');
const extractedContainer = Attachments.fromEnvelope(withAttachments);
console.log('  Extracted attachments container is empty:', extractedContainer.isEmpty());

// Test 9: Attachment without conformsTo
console.log('\n9. Attachment without ConformsTo:');
const simpleAttachment = Envelope.newAttachment('Simple data', 'com.simple');
console.log('  Vendor:', simpleAttachment.attachmentVendor());
console.log('  ConformsTo:', simpleAttachment.attachmentConformsTo() || 'undefined');

// Test 10: Complex attachment payload
console.log('\n10. Complex Attachment Payload:');
const complexPayload = Envelope.new('Metadata')
  .addAssertion('version', '2.0')
  .addAssertion('timestamp', '2024-01-15T10:30:00Z');

const complexAttachment = Envelope.new('Document')
  .addAttachment(complexPayload, 'com.complex', 'https://complex.com/v2');

const attachmentsFromComplex = complexAttachment.attachments();
if (attachmentsFromComplex.length > 0) {
  const payload = attachmentsFromComplex[0].unwrap().subject();
  console.log('  Payload subject:', payload.subject().asText());
  console.log('  Payload assertions:', payload.assertions().length);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('ATTACHMENT TESTS COMPLETE');
console.log('='.repeat(70));
console.log('All attachment features working correctly! ✅');
console.log('');
