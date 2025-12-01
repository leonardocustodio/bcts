/**
 * Search Pattern Demo Example
 *
 * This example demonstrates various search patterns including
 * finding specific types, key-value patterns, and depth analysis.
 *
 * Port of: bc-dcbor-rust/examples/search_pattern_demo.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  // Create a complex CBOR structure similar to what SearchPattern might encounter
  const rootMap = new CborMap();

  // Add some basic values
  rootMap.set('name', 'SearchPattern Test');
  rootMap.set('version', 1);

  // Add nested structures
  const userMap = new CborMap();
  userMap.set('id', 12345);
  userMap.set('email', 'test@example.com');
  userMap.set('roles', ['admin', 'user']);
  rootMap.set('user', userMap);

  // Add an array with mixed content
  const mixedArray = [cbor('string'), cbor(42), cbor([1, 2, 3])];
  rootMap.set('mixed', mixedArray);

  const cborData = cbor(rootMap);

  console.log(`CBOR structure: ${diagnosticFlat(cborData)}`);
  console.log();

  // Example 1: Find all string values
  console.log('=== Finding all string values ===');
  const stringValues: string[] = [];

  walk(cborData, undefined, (element: WalkElement, _level, _edge, _state: void) => {
    if (element.type === 'single') {
      if (element.cbor.type === MajorType.Text) {
        stringValues.push(element.cbor.value as string);
      }
    }
    return [undefined, false];
  });

  for (const [i, s] of stringValues.entries()) {
    console.log(`  String ${i + 1}: "${s}"`);
  }
  console.log();

  // Example 2: Find all numeric values
  console.log('=== Finding all numeric values ===');
  const numericValues: string[] = [];

  walk(cborData, undefined, (element: WalkElement, _level, edge, _state: void) => {
    if (element.type === 'single') {
      if (element.cbor.type === MajorType.Unsigned) {
        const edgeDesc = edge.type;
        numericValues.push(`Unsigned ${element.cbor.value} at ${edgeDesc}`);
      } else if (element.cbor.type === MajorType.Negative) {
        const edgeDesc = edge.type;
        numericValues.push(`Negative ${element.cbor.value} at ${edgeDesc}`);
      }
    }
    return [undefined, false];
  });

  for (const [i, desc] of numericValues.entries()) {
    console.log(`  Number ${i + 1}: ${desc}`);
  }
  console.log();

  // Example 3: Search for specific patterns
  console.log('=== Searching for specific key-value patterns ===');
  const matches: string[] = [];

  walk(cborData, undefined, (element: WalkElement, _level, _edge, _state: void) => {
    if (element.type === 'keyvalue') {
      if (element.key.type === MajorType.Text) {
        const keyStr = element.key.value as string;
        if (keyStr === 'email' && element.value.type === MajorType.Text) {
          matches.push(`Found email: ${diagnosticFlat(element.value)}`);
        } else if (keyStr === 'id' && element.value.type === MajorType.Unsigned) {
          matches.push(`Found ID: ${diagnosticFlat(element.value)}`);
        }
      }
    }
    return [undefined, false];
  });

  for (const [i, m] of matches.entries()) {
    console.log(`  Match ${i + 1}: ${m}`);
  }
  console.log();

  // Example 4: Count elements by depth
  console.log('=== Element count by depth ===');
  const depthCounts = new Map<number, number>();

  walk(cborData, undefined, (_element: WalkElement, level, _edge, _state: void) => {
    depthCounts.set(level, (depthCounts.get(level) || 0) + 1);
    return [undefined, false];
  });

  const depths = Array.from(depthCounts.entries()).sort((a, b) => a[0] - b[0]);

  for (const [depth, count] of depths) {
    console.log(`  Depth ${depth}: ${count} elements`);
  }
}

main();
