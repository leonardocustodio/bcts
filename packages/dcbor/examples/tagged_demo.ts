/**
 * Tagged Demo Example
 *
 * This example demonstrates working with tagged CBOR values
 * and how they appear during tree traversal.
 *
 * Port of: bc-dcbor-rust/examples/tagged_demo.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnostic, diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  // Create a tagged value with nested content
  const innerMap = new CborMap();
  innerMap.set('name', 'Alice');
  innerMap.set('age', 30);

  const taggedCbor = cbor({
    isCbor: true,
    type: MajorType.Tagged,
    tag: 100,
    value: cbor(innerMap)
  });

  console.log(`Tagged CBOR: ${diagnostic(taggedCbor)}`);
  console.log('\nWalk output:');

  walk(taggedCbor, 0, (element: WalkElement, depth: number, edge, count: number) => {
    const indent = '  '.repeat(depth);
    console.log(
      `${indent}${count}[${edge.type}] ${diagnosticFlat(element)}`
    );
    return [count + 1, false];
  });

  console.log('\n--- Comparison: Just the map without tagging ---');
  walk(cbor(innerMap), 0, (element: WalkElement, depth: number, edge, count: number) => {
    const indent = '  '.repeat(depth);
    console.log(
      `${indent}${count}[${edge.type}] ${diagnosticFlat(element)}`
    );
    return [count + 1, false];
  });
}

main();
