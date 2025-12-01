/**
 * Abort Test Example
 *
 * This example demonstrates early termination of tree traversal
 * by setting the stopDescent flag when a specific value is encountered.
 *
 * Port of: bc-dcbor-rust/examples/abort_test.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, EdgeType, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  const map = new CborMap();
  map.set('first', 'normal');
  map.set('second', 'abort');
  map.set('third', 'should_not_see');
  const cborData = cbor(map);

  const visitLog: string[] = [];
  let shouldAbort = false;

  const visitor = (
    element: WalkElement,
    level: number,
    edge: { type: EdgeType; index?: number },
    state: void
  ): [void, boolean] => {
    const edgeStr = edge.type === EdgeType.ArrayElement
      ? `ArrayElement(${edge.index})`
      : edge.type;

    const desc = `L${level} [${edgeStr}] ${diagnosticFlat(element)}`;

    // If we're already aborting, still log but return true to stop descent
    if (shouldAbort) {
      visitLog.push(`ABORT_STATE: ${desc}`);
      return [undefined, true];
    }

    visitLog.push(desc);

    // Check if this triggers abort
    if (element.type === 'single') {
      if (element.cbor.type === MajorType.Text && element.cbor.value === 'abort') {
        shouldAbort = true;
        console.log(`ABORT TRIGGERED at: ${desc}`);
      }
    }

    return [undefined, false];
  };

  walk(cborData, undefined, visitor);

  for (const entry of visitLog) {
    console.log(entry);
  }

  const logStr = visitLog.join(' | ');
  console.log(`\nFull log: ${logStr}`);
  console.log(`Contains 'should_not_see': ${logStr.includes('should_not_see')}`);
}

main();
