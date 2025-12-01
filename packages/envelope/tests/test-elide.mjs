#!/usr/bin/env node
import { Envelope } from '../dist/index.mjs';

console.log('Testing Elision Extension...\n');

// Test 1: Basic elision
console.log('1. Basic elision:');
const envelope = Envelope.new('Secret message');
const elided = envelope.elide();
console.log('Original digest:', envelope.digest().hex().substring(0, 16) + '...');
console.log('Elided digest:', elided.digest().hex().substring(0, 16) + '...');
console.log('Same digest:', envelope.digest().equals(elided.digest()));
console.log('Elided envelope is elided:', elided.case().type === 'elided');

// Test 2: Elide specific assertion
console.log('\n2. Elide specific assertion:');
const person = Envelope.new('Alice')
  .addAssertion('name', 'Alice Smith')
  .addAssertion('age', 30)
  .addAssertion('ssn', '123-45-6789');

console.log('Original envelope:');
console.log(person.treeFormat());

// Get the SSN assertion and elide it
const assertions = person.assertions();
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
  // Create set with SSN assertion digest
  const targetSet = new Set([ssnAssertion.digest()]);
  const redacted = person.elideRemovingSet(targetSet);

  console.log('\nRedacted envelope (SSN elided):');
  console.log(redacted.treeFormat());
  console.log('\nSame top-level digest:', person.digest().equals(redacted.digest()));
}

// Test 3: Reveal only specific elements
console.log('\n3. Reveal only name (elide age and SSN):');
const nameAssertion = assertions.find((a) => {
  const c = a.case();
  if (c.type === 'assertion') {
    const pred = c.assertion.predicate();
    if (pred.case().type === 'leaf') {
      try {
        return pred.asText() === 'name';
      } catch {
        return false;
      }
    }
  }
  return false;
});

if (nameAssertion) {
  // Build reveal set (subject + name assertion)
  const revealSet = new Set([
    person.subject().digest(),
    nameAssertion.digest(),
  ]);

  const selective = person.elideRevealingSet(revealSet);

  console.log('Selectively revealed envelope:');
  console.log(selective.treeFormat());
}

// Test 4: Elide array of targets
console.log('\n4. Elide multiple assertions using array:');
const targets = assertions.slice(1, 3); // Age and SSN
const multiElided = person.elideRemovingArray(targets);
console.log('Envelope with age and SSN elided:');
console.log(multiElided.treeFormat());

// Test 5: Un-elide (reveal)
console.log('\n5. Un-elide / reveal:');
const revealed = elided.unelide(envelope);
console.log('Revealed successfully:', revealed.digest().equals(envelope.digest()));
console.log('Content matches:', revealed.asText() === 'Secret message');

// Test 6: isIdenticalTo
console.log('\n6. Identity check:');
const env1 = Envelope.new('Hello');
const env2 = Envelope.new('Hello');
const wrapped = env1.wrap();
console.log('Same content, same structure:', env1.isIdenticalTo(env2));
console.log('Same content, different structure:', env1.isIdenticalTo(wrapped));

// Test 7: Nested elision
console.log('\n7. Nested envelope elision:');
const company = Envelope.new('Company')
  .addAssertion('name', 'ACME Corp')
  .addAssertion(
    'CEO',
    Envelope.new('Bob')
      .addAssertion('age', 45)
      .addAssertion('email', 'bob@acme.com')
  );

console.log('Original nested envelope:');
console.log(company.treeFormat());

// Elide the entire CEO assertion
const ceoAssertion = company.assertions().find((a) => {
  const c = a.case();
  if (c.type === 'assertion') {
    const pred = c.assertion.predicate();
    if (pred.case().type === 'leaf') {
      try {
        return pred.asText() === 'CEO';
      } catch {
        return false;
      }
    }
  }
  return false;
});

if (ceoAssertion) {
  const nestedElided = company.elideRemovingTarget(ceoAssertion);
  console.log('\nWith CEO assertion elided:');
  console.log(nestedElided.treeFormat());
}

console.log('\n✅ All elision tests complete!');
