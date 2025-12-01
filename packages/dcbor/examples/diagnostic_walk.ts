/**
 * Diagnostic Walk Example
 *
 * This example demonstrates using diagnostic_flat during tree traversal
 * to display CBOR elements at different nesting levels.
 *
 * Port of: bc-dcbor-rust/examples/diagnostic_walk.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, EdgeType, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';

function main() {
  // Test with various CBOR structures to show diagnostic_flat works during
  // traversal
  const testCases: Array<[string, any]> = [
    ['Simple array', cbor([1, 2, 3])],
    ['Simple map', (() => {
      const map = new CborMap();
      map.set('key', 'value');
      return cbor(map);
    })()],
    ['Nested structure', (() => {
      const map = new CborMap();
      map.set('numbers', [1, 2, 3]);
      map.set('text', 'hello');
      return cbor(map);
    })()]
  ];

  for (const [name, cborData] of testCases) {
    console.log(`=== ${name} ===`);
    console.log(`Full diagnostic: ${diagnosticFlat(cborData)}`);

    console.log('Walking elements:');
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
      return [undefined, false];
    };

    walk(cborData, undefined, visitor);
    console.log();
  }
}

main();
