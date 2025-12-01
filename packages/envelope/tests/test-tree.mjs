#!/usr/bin/env node
import { Envelope } from '../dist/index.mjs';

console.log('Testing Tree Format...\n');

// Test 1: Simple envelope
console.log('1. Simple envelope:');
const simple = Envelope.new('Hello');
console.log(simple.treeFormat());

// Test 2: Envelope with assertion
console.log('\n2. Envelope with assertion:');
const withAssertion = Envelope.new('Alice').addAssertion('knows', 'Bob');
console.log(withAssertion.treeFormat());

// Test 3: Nested envelope
console.log('\n3. Nested envelope:');
const nested = Envelope.new('Alice')
  .addAssertion('knows', Envelope.new('Bob').addAssertion('age', 30))
  .addAssertion('city', 'Boston');
console.log(nested.treeFormat());

// Test 4: With hideNodes option
console.log('\n4. Same envelope with hideNodes:');
console.log(nested.treeFormat({ hideNodes: true }));

// Test 5: Multiple types
console.log('\n5. With types:');
const typed = Envelope.new('Charlie')
  .addType('Person')
  .addType('Employee')
  .addAssertion('salary', 75000);
console.log(typed.treeFormat());

console.log('\n✅ Tree format tests complete!');
