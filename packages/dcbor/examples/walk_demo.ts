/**
 * Walk Demo Example
 *
 * This example demonstrates walking through a complex CBOR structure
 * with multiple visitor patterns including counting by type.
 *
 * Port of: bc-dcbor-rust/examples/walk_demo.rs
 */

import { CborMap } from '../src/map';
import { cbor, MajorType } from '../src/cbor';
import { walk, EdgeType, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';

function main() {
  // Create a complex CBOR structure
  const map = new CborMap();
  map.set('name', 'Alice');
  map.set('age', 30);
  map.set('hobbies', ['reading', 'coding', 'hiking']);

  const nestedMap = new CborMap();
  nestedMap.set('city', 'San Francisco');
  nestedMap.set('zip', 94102);
  map.set('address', nestedMap);

  const cborData = cbor(map);

  console.log(`CBOR structure (flat diagnostic): ${diagnosticFlat(cborData)}`);
  console.log('\nWalking the CBOR tree:');

  // Walk the structure and print each element
  const visitor = (
    element: WalkElement,
    level: number,
    edge: { type: EdgeType; index?: number },
    _state: void
  ): [void, boolean] => {
    const indent = '  '.repeat(level);
    const edgeLabel = edge.type === EdgeType.ArrayElement
      ? `ArrayElement(${edge.index})`
      : edge.type === EdgeType.None
      ? 'root'
      : edge.type;

    console.log(`${indent}[${edgeLabel}] ${diagnosticFlat(element)}`);
    return [undefined, false]; // Continue traversal
  };

  walk(cborData, undefined, visitor);

  // Example: Count different types of elements
  console.log('\nCounting elements by type:');

  interface Counter {
    total: number;
    maps: number;
    arrays: number;
    strings: number;
    numbers: number;
    keyValuePairs: number;
  }

  const counterVisitor = (
    element: WalkElement,
    _level: number,
    _edge: { type: EdgeType; index?: number },
    state: Counter
  ): [Counter, boolean] => {
    const newState = { ...state };
    newState.total += 1;

    if (element.type === 'keyvalue') {
      newState.keyValuePairs += 1;
    } else {
      // element.type === 'single'
      switch (element.cbor.type) {
        case MajorType.Map:
          newState.maps += 1;
          break;
        case MajorType.Array:
          newState.arrays += 1;
          break;
        case MajorType.Text:
          newState.strings += 1;
          break;
        case MajorType.Unsigned:
        case MajorType.Negative:
          newState.numbers += 1;
          break;
      }
    }

    return [newState, false];
  };

  const finalCount = walk(cborData, {
    total: 0,
    maps: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    keyValuePairs: 0
  }, counterVisitor);

  console.log(`Total elements: ${finalCount.total}`);
  console.log(`Maps: ${finalCount.maps}`);
  console.log(`Arrays: ${finalCount.arrays}`);
  console.log(`Strings: ${finalCount.strings}`);
  console.log(`Numbers: ${finalCount.numbers}`);
  console.log(`Key-value pairs: ${finalCount.keyValuePairs}`);
}

main();
