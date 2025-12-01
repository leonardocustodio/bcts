/**
 * Debug Stop Example
 *
 * This example demonstrates debugging stop behavior with nested arrays,
 * showing how to prevent descent into specific elements.
 *
 * Port of: bc-dcbor-rust/examples/debug_stop.rs
 */

import { cbor } from '../src/cbor';
import { walk, EdgeType, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  const nestedStructure = cbor([
    cbor(['should', 'see', 'this']),
    cbor('abort_marker'),
    cbor(['should', 'not', 'see'])
  ]);

  const visitLog: string[] = [];
  let foundAbort = false;

  walk(nestedStructure, undefined, (element: WalkElement, level, edge, _state: void) => {
    const edgeStr = edge.type === EdgeType.ArrayElement
      ? `ArrayElement(${edge.index})`
      : edge.type;
    const desc = `L${level}: ${edgeStr} - ${diagnosticFlat(element.type === 'single' ? element.cbor : element.key)}`;
    visitLog.push(desc);

    // Check if this is our abort marker
    if (element.type === 'single' &&
        element.cbor.type === MajorType.Text &&
        element.cbor.value === 'abort_marker') {
      foundAbort = true;
      console.log('Found abort marker!');
      return [undefined, true];
    }

    // If we've seen the abort marker and this is an array at level 1, stop descent
    const stop = foundAbort &&
      element.type === 'single' &&
      edge.type === EdgeType.ArrayElement &&
      (edge as any).index === 2;

    if (stop) {
      console.log(`Stopping descent for: ${diagnosticFlat(element.cbor)}`);
    }

    return [undefined, stop];
  });

  for (const entry of visitLog) {
    console.log(entry);
  }

  console.log('\nLevel 2 visits from ArrayElement(2):');
  const level2Visits = visitLog.filter(line =>
    line.startsWith('L2:') && line.includes('ArrayElement(2)')
  );

  for (const visit of level2Visits) {
    console.log(`  ${visit}`);
  }

  console.log(`\nLevel2 visits empty: ${level2Visits.length === 0}`);
}

main();
