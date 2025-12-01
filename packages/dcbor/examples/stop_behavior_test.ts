/**
 * Stop Behavior Test Example
 *
 * This example tests the stop flag behavior during tree traversal,
 * showing how to stop descent into children.
 *
 * Port of: bc-dcbor-rust/examples/stop_behavior_test.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  console.log('=== Testing stop flag behavior ===\n');

  // Create a nested structure to test stop behavior
  const innerMap = new CborMap();
  innerMap.set('inner_key', 'inner_value');

  const map = new CborMap();
  map.set('first', 'stop_here'); // Will trigger stop
  map.set('second', innerMap); // Should not be visited if stop works
  map.set('third', [1, 2, 3]); // Should not be visited if stop works
  const cborData = cbor(map);

  console.log(`CBOR structure: ${diagnosticFlat(cborData)}`);

  // Test 1: Stop on visiting a single element
  console.log('\n=== Test 1: Stop on single element ===');
  const visited: string[] = [];
  walk(cborData, undefined, (element: WalkElement, depth, edge, _state: void) => {
    const indent = '  '.repeat(depth);
    const description = element.type === 'single'
      ? `Single: ${diagnosticFlat(element.cbor)}`
      : `KV: ${diagnosticFlat(element.key)} => ${diagnosticFlat(element.value)}`;

    visited.push(`${indent}[${edge.type}] ${description}`);

    // Stop when we see "stop_here" as a single element
    const shouldStop = element.type === 'single' &&
      element.cbor.type === MajorType.Text &&
      element.cbor.value === 'stop_here';

    if (shouldStop) {
      console.log(`${indent}🛑 STOPPING at: ${description}`);
    } else {
      console.log(`${indent}✅ Visited: ${description}`);
    }

    return [undefined, shouldStop];
  });

  console.log('\nAll visits in order:');
  for (const visit of visited) {
    console.log(`  ${visit}`);
  }

  // Test 2: Stop on visiting a key-value pair
  console.log('\n=== Test 2: Stop on key-value pair ===');
  const visited2: string[] = [];
  walk(cborData, undefined, (element: WalkElement, depth, edge, _state: void) => {
    const indent = '  '.repeat(depth);
    const description = element.type === 'single'
      ? `Single: ${diagnosticFlat(element.cbor)}`
      : `KV: ${diagnosticFlat(element.key)} => ${diagnosticFlat(element.value)}`;

    visited2.push(`${indent}[${edge.type}] ${description}`);

    // Stop when we see a key-value pair with "stop_here"
    const shouldStop = element.type === 'keyvalue' &&
      element.value.type === MajorType.Text &&
      element.value.value === 'stop_here';

    if (shouldStop) {
      console.log(`${indent}🛑 STOPPING at: ${description}`);
    } else {
      console.log(`${indent}✅ Visited: ${description}`);
    }

    return [undefined, shouldStop];
  });

  console.log('\nAll visits in order:');
  for (const visit of visited2) {
    console.log(`  ${visit}`);
  }
}

main();
