/**
 * Count Test Example
 *
 * This example demonstrates walking through a nested CBOR structure
 * and logging each element with its level and edge type.
 *
 * Port of: bc-dcbor-rust/examples/count_test.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, EdgeType } from '../src/walk';
import { diagnosticFlat } from '../src/diag';

function main() {
  // Create nested structure: { inner: { x: [1, 2] }, simple: 42 }
  const innerMap = new CborMap();
  innerMap.set('x', [1, 2]);

  const outerMap = new CborMap();
  outerMap.set('inner', innerMap);
  outerMap.set('simple', 42);

  const nested = cbor(outerMap);

  // Log to collect visit information
  const visitLog: string[] = [];

  // Visitor function that logs each element
  const visitor = (
    element: any,
    level: number,
    edge: { type: EdgeType; index?: number },
    state: void
  ): [void, boolean] => {
    const edgeStr = edge.type === EdgeType.ArrayElement
      ? `ArrayElement(${edge.index})`
      : edge.type;
    const desc = `L${level} [${edgeStr}] ${diagnosticFlat(element)}`;
    visitLog.push(desc);
    return [state, false]; // Continue walking
  };

  // Walk the structure
  walk(nested, undefined, visitor);

  // Print results
  visitLog.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry}`);
  });
  console.log(`Total count: ${visitLog.length}`);
}

main();
