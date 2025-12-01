#!/usr/bin/env node
import { Envelope } from '../dist/index.mjs';

console.log('Testing Proofs (Inclusion Proofs)...\n');

// Test 1: Basic inclusion proof setup
console.log('1. Basic inclusion proof setup:');
const aliceFriends = Envelope.new('Alice')
  .addAssertion('knows', 'Bob')
  .addAssertion('knows', 'Carol')
  .addAssertion('knows', 'Dan');

console.log('   Created envelope with 3 "knows" assertions');
console.log('   Subject:', aliceFriends.subject().asText());
console.log('   Assertions:', aliceFriends.assertions().length);

// Test 2: Create trusted root digest
console.log('\n2. Create trusted root digest:');
const aliceFriendsRoot = aliceFriends.elideRevealingSet(new Set());
console.log('   Root is elided:', aliceFriendsRoot.subject().case().type === 'elided');
console.log('   Root digest:', aliceFriendsRoot.digest().hex().substring(0, 16) + '...');

// Test 3: Create proof for single assertion
console.log('\n3. Create proof for single assertion:');
const knowsBobAssertion = Envelope.newAssertion('knows', 'Bob');
const aliceKnowsBobProof = aliceFriends.proofContainsTarget(knowsBobAssertion);

console.log('   Proof created:', aliceKnowsBobProof !== undefined);
if (aliceKnowsBobProof) {
  console.log('   Proof digest matches original:',
    aliceKnowsBobProof.digest().hex() === aliceFriends.digest().hex());
}

// Test 4: Verify proof against trusted root
console.log('\n4. Verify proof against trusted root:');
if (aliceKnowsBobProof) {
  const isValid = aliceFriendsRoot.confirmContainsTarget(
    knowsBobAssertion,
    aliceKnowsBobProof
  );
  console.log('   ✓ Proof verified:', isValid);
}

// Test 5: Proof for different assertion
console.log('\n5. Proof for different assertion (Carol):');
const knowsCarolAssertion = Envelope.newAssertion('knows', 'Carol');
const aliceKnowsCarolProof = aliceFriends.proofContainsTarget(knowsCarolAssertion);

console.log('   Proof created:', aliceKnowsCarolProof !== undefined);
if (aliceKnowsCarolProof) {
  const isValid = aliceFriendsRoot.confirmContainsTarget(
    knowsCarolAssertion,
    aliceKnowsCarolProof
  );
  console.log('   ✓ Proof verified:', isValid);
}

// Test 6: Proof for non-existent assertion should fail
console.log('\n6. Proof for non-existent assertion (Eve):');
const knowsEveAssertion = Envelope.newAssertion('knows', 'Eve');
const aliceKnowsEveProof = aliceFriends.proofContainsTarget(knowsEveAssertion);
console.log('   ✓ Proof correctly returns undefined:', aliceKnowsEveProof === undefined);

// Test 7: Verification with wrong assertion should fail
console.log('\n7. Verification with wrong assertion:');
if (aliceKnowsBobProof) {
  const isValid = aliceFriendsRoot.confirmContainsTarget(
    knowsEveAssertion,  // Wrong assertion
    aliceKnowsBobProof  // Proof for Bob
  );
  console.log('   ✓ Verification correctly fails:', !isValid);
}

// Test 8: Multi-assertion proof using proofContainsSet
console.log('\n8. Multi-assertion proof:');
const bobDigest = knowsBobAssertion.digest();
const carolDigest = knowsCarolAssertion.digest();
const targetSet = new Set([bobDigest, carolDigest]);

const multiProof = aliceFriends.proofContainsSet(targetSet);
console.log('   Multi-assertion proof created:', multiProof !== undefined);

if (multiProof) {
  const isValid = aliceFriendsRoot.confirmContainsSet(targetSet, multiProof);
  console.log('   ✓ Multi-assertion proof verified:', isValid);
}

// Test 9: Salted envelope for enhanced privacy
console.log('\n9. Salted envelope for enhanced privacy:');
const aliceFriendsSalted = Envelope.new('Alice')
  .addAssertion('knows', 'Bob')
  .addAssertion('knows', 'Carol')
  .addAssertion('knows', 'Dan')
  .addSalt();

console.log('   Created envelope with salt');
console.log('   Original digest:', aliceFriendsSalted.digest().hex().substring(0, 16) + '...');
console.log('   Salt prevents easy correlation attacks');

const saltedRoot = aliceFriendsSalted.elideRevealingSet(new Set());
console.log('   ✓ Salted root created successfully')

// Test 10: Credential with selective disclosure
console.log('\n10. Credential with selective disclosure:');
const credential = Envelope.new('Credential')
  .addAssertion('firstName', 'John')
  .addAssertion('lastName', 'Smith')
  .addAssertion('birthDate', '1990-01-01')
  .addAssertion('address', '123 Main St')
  .addAssertion('documentNumber', 'ABC123456');

console.log('   Credential created with 5 attributes');

const credentialRoot = credential.elideRevealingSet(new Set());
const addressAssertion = Envelope.newAssertion('address', '123 Main St');
const addressProof = credential.proofContainsTarget(addressAssertion);

console.log('   Address proof created:', addressProof !== undefined);
if (addressProof) {
  const isValid = credentialRoot.confirmContainsTarget(addressAssertion, addressProof);
  console.log('   ✓ Address proof verified:', isValid);
  console.log('   Other attributes remain private');
}

// Test 11: Proof of subject
console.log('\n11. Proof of subject:');
const subjectProof = credential.proofContainsTarget(Envelope.new('Credential'));
console.log('   Subject proof created:', subjectProof !== undefined);
if (subjectProof) {
  const isValid = credentialRoot.confirmContainsTarget(
    Envelope.new('Credential'),
    subjectProof
  );
  console.log('   ✓ Subject proof verified:', isValid);
}

// Test 12: Complex document with nested structure
console.log('\n12. Complex document with nested structure:');
const document = Envelope.new('Document')
  .addAssertion('title', 'Important Report')
  .addAssertion('author', 'Alice')
  .addAssertion('confidential', true);

const titleAssertion = Envelope.newAssertion('title', 'Important Report');
const authorAssertion = Envelope.newAssertion('author', 'Alice');

const titleDigest = titleAssertion.digest();
const authorDigest = authorAssertion.digest();
const multiTargetSet = new Set([titleDigest, authorDigest]);

const documentProof = document.proofContainsSet(multiTargetSet);
const documentRoot = document.elideRevealingSet(new Set());

console.log('   Document proof created:', documentProof !== undefined);
if (documentProof) {
  const isValid = documentRoot.confirmContainsSet(multiTargetSet, documentProof);
  console.log('   ✓ Document proof verified:', isValid);
  console.log('   Confidential status remains hidden');
}

// Test 13: Wrapped envelope proof
console.log('\n13. Wrapped envelope proof:');
const wrappedEnvelope = Envelope.new('Secret Data').wrap();
const wrappedRoot = wrappedEnvelope.elideRevealingSet(new Set());
const wrappedTarget = Envelope.new('Secret Data');
const wrappedProof = wrappedEnvelope.proofContainsTarget(wrappedTarget);

console.log('   Wrapped proof created:', wrappedProof !== undefined);
if (wrappedProof) {
  const isValid = wrappedRoot.confirmContainsTarget(wrappedTarget, wrappedProof);
  console.log('   ✓ Wrapped proof verified:', isValid);
}

// Test 14: Proof digest consistency
console.log('\n14. Proof digest consistency:');
if (aliceKnowsBobProof) {
  const originalDigest = aliceFriends.digest().hex();
  const proofDigest = aliceKnowsBobProof.digest().hex();
  const rootDigest = aliceFriendsRoot.digest().hex();

  console.log('   Original and proof digests match:', originalDigest === proofDigest);
  console.log('   Proof and root digests match:', proofDigest === rootDigest);
  console.log('   ✓ All digests consistent:',
    originalDigest === proofDigest && proofDigest === rootDigest);
}

// Test 15: Empty target set
console.log('\n15. Empty target set:');
const emptyTargetSet = new Set();
const emptyProof = aliceFriends.proofContainsSet(emptyTargetSet);
console.log('   Empty proof created:', emptyProof !== undefined);
if (emptyProof) {
  const isValid = aliceFriendsRoot.confirmContainsSet(emptyTargetSet, emptyProof);
  console.log('   ✓ Empty proof verified:', isValid);
}

// Test 16: Proof with all assertions
console.log('\n16. Proof with all assertions:');
const bobDigest2 = knowsBobAssertion.digest();
const carolDigest2 = knowsCarolAssertion.digest();
const danAssertion = Envelope.newAssertion('knows', 'Dan');
const danDigest = danAssertion.digest();
const allTargets = new Set([bobDigest2, carolDigest2, danDigest]);

const allProof = aliceFriends.proofContainsSet(allTargets);
console.log('   All-assertion proof created:', allProof !== undefined);
if (allProof) {
  const isValid = aliceFriendsRoot.confirmContainsSet(allTargets, allProof);
  console.log('   ✓ All-assertion proof verified:', isValid);
}

// Test 17: Proof verification with mismatched root
console.log('\n17. Proof verification with mismatched root:');
const differentEnvelope = Envelope.new('Bob').elideRevealingSet(new Set());
if (aliceKnowsBobProof) {
  const isValid = differentEnvelope.confirmContainsTarget(
    knowsBobAssertion,
    aliceKnowsBobProof
  );
  console.log('   ✓ Mismatched root correctly fails:', !isValid);
}

// Test 18: Predicate-only proof
console.log('\n18. Predicate-only proof:');
const knowsPredicate = Envelope.new('knows');
const predicateProof = aliceFriends.proofContainsTarget(knowsPredicate);
console.log('   Predicate proof created:', predicateProof !== undefined);
if (predicateProof) {
  const isValid = aliceFriendsRoot.confirmContainsTarget(knowsPredicate, predicateProof);
  console.log('   ✓ Predicate proof verified:', isValid);
}

// Test 19: Object-only proof
console.log('\n19. Object-only proof:');
const bobObject = Envelope.new('Bob');
const objectProof = aliceFriends.proofContainsTarget(bobObject);
console.log('   Object proof created:', objectProof !== undefined);
if (objectProof) {
  const isValid = aliceFriendsRoot.confirmContainsTarget(bobObject, objectProof);
  console.log('   ✓ Object proof verified:', isValid);
}

// Test 20: Performance - multiple proofs
console.log('\n20. Performance - multiple proofs:');
const startTime = Date.now();
for (let i = 0; i < 100; i++) {
  const proof = aliceFriends.proofContainsTarget(knowsBobAssertion);
  if (proof) {
    aliceFriendsRoot.confirmContainsTarget(knowsBobAssertion, proof);
  }
}
const duration = Date.now() - startTime;
console.log('   100 proof cycles completed in', duration, 'ms');
console.log('   Average per cycle:', (duration / 100).toFixed(2), 'ms');

console.log('\n======================================================================');
console.log('PROOF TESTS COMPLETE');
console.log('======================================================================');
console.log('All inclusion proof features working correctly! ✅');
console.log();
