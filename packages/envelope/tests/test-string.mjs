#!/usr/bin/env node
import { flanked } from '../dist/index.mjs';

console.log('Testing String Utilities...\n');

// Test 1: flanked function
console.log('1. flanked function:');
console.log('  Quote string:', flanked('hello', '"', '"'));
console.log('  Single quotes:', flanked('name', "'", "'"));
console.log('  Brackets:', flanked('item', '[', ']'));
console.log('  Braces:', flanked('value', '{', '}'));

// Test 2: String prototype extension
console.log('\n2. String.flankedBy extension:');
console.log('  Quote string:', 'world'.flankedBy('"', '"'));
console.log('  Single quotes:', 'Alice'.flankedBy("'", "'"));
console.log('  Angle brackets:', 'tag'.flankedBy('<', '>'));

console.log('\n✅ All string utility tests complete!');
