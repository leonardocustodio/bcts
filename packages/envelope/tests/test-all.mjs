#!/usr/bin/env node
/**
 * Comprehensive test suite for bc-envelope-ts
 *
 * Runs all feature tests in sequence and reports results.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
  { name: 'Type System', file: 'test-types.mjs' },
  { name: 'Salt (Decorrelation)', file: 'test-salt.mjs' },
  { name: 'Compression', file: 'test-compress.mjs' },
  { name: 'Encryption', file: 'test-encrypt.mjs' },
  { name: 'Elision (Selective Disclosure)', file: 'test-elide.mjs' },
  { name: 'Signatures (ECDSA)', file: 'test-signature.mjs' },
  { name: 'Attachments (Vendor Metadata)', file: 'test-attachment.mjs' },
  { name: 'Recipients (Public-Key Encryption)', file: 'test-recipient.mjs' },
  { name: 'Expressions (BCR-2023-012)', file: 'test-expression.mjs' },
  { name: 'Proofs (Inclusion Proofs)', file: 'test-proof.mjs' },
  { name: 'String Utilities', file: 'test-string.mjs' },
];

console.log('═'.repeat(70));
console.log('  bc-envelope-ts Comprehensive Test Suite');
console.log('═'.repeat(70));
console.log();

const results = [];

async function runTest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const testPath = join(__dirname, test.file);

    console.log(`Running: ${test.name}`);
    console.log('─'.repeat(70));

    const proc = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: __dirname
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const result = {
        name: test.name,
        file: test.file,
        passed: code === 0,
        duration
      };
      results.push(result);
      console.log();
      resolve(result);
    });

    proc.on('error', (err) => {
      console.error(`Error running ${test.file}:`, err);
      results.push({
        name: test.name,
        file: test.file,
        passed: false,
        duration: Date.now() - startTime,
        error: err.message
      });
      resolve();
    });
  });
}

// Run tests sequentially
for (const test of tests) {
  await runTest(test);
}

// Print summary
console.log('═'.repeat(70));
console.log('  TEST SUMMARY');
console.log('═'.repeat(70));
console.log();

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

for (const result of results) {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  const duration = `${result.duration}ms`;
  console.log(`${status}  ${result.name.padEnd(35)} ${duration.padStart(10)}`);
}

console.log();
console.log(`Total: ${total} tests`);
console.log(`Passed: ${passed} tests`);
console.log(`Failed: ${failed} tests`);
console.log();

if (failed > 0) {
  console.log('⚠️  Some tests failed');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  process.exit(0);
}
