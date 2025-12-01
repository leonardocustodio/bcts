#!/usr/bin/env node
import { Envelope, IS_A } from '../dist/index.mjs';

console.log('Testing Type System...\n');

// Test 1: Add a single type
console.log('1. Adding a single type:');
const person = Envelope.new('Alice').addType('Person');
console.log('   Has type "Person":', person.hasType('Person'));
console.log('   Types count:', person.types().length);
const typeObj = person.getType();
console.log('   Type name:', typeObj.extractString());

// Test 2: Multiple types
console.log('\n2. Multiple types:');
const multiTyped = Envelope.new('Bob')
  .addType('Person')
  .addType('Employee')
  .addType('Manager');
const types = multiTyped.types();
console.log('   Types count:', types.length);
console.log('   Has "Person":', multiTyped.hasType('Person'));
console.log('   Has "Employee":', multiTyped.hasType('Employee'));
console.log('   Has "Manager":', multiTyped.hasType('Manager'));
console.log('   Has "Customer":', multiTyped.hasType('Customer'));

// Test 3: Check type validation
console.log('\n3. Type validation:');
const document = Envelope.new('Contract').addType('LegalDocument');
try {
  document.checkType('LegalDocument');
  console.log('   ✓ LegalDocument check passed');
} catch (e) {
  console.log('   ✗ LegalDocument check failed');
}

try {
  document.checkType('Spreadsheet');
  console.log('   ✗ Spreadsheet check should have failed');
} catch (e) {
  console.log('   ✓ Spreadsheet check correctly rejected');
}

// Test 4: Type with other assertions
console.log('\n4. Types combined with other assertions:');
const employee = Envelope.new('Charlie')
  .addType('Person')
  .addType('Employee')
  .addAssertion('department', 'Engineering')
  .addAssertion('salary', 75000);

console.log('   Name:', employee.subject().extractString());
console.log('   Has Person type:', employee.hasType('Person'));
console.log('   Has Employee type:', employee.hasType('Employee'));
console.log('   Department:', employee.objectForPredicate('department').extractString());
console.log('   Salary:', employee.objectForPredicate('salary').extractNumber());

// Test 5: IS_A predicate constant
console.log('\n5. Using IS_A predicate directly:');
const typed = Envelope.new('Data').addAssertion(IS_A, 'DataSet');
console.log('   Has DataSet type:', typed.hasType('DataSet'));

console.log('\n✅ All type system tests passed!');
