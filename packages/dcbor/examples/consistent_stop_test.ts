/**
 * Consistent Stop Test Example
 *
 * This example demonstrates consistent stop behavior across different
 * scenarios including depth limiting and abort conditions.
 *
 * Port of: bc-dcbor-rust/examples/consistent_stop_test.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  console.log("=== Testing CONSISTENT stop behavior: 'Prevent descent into children' ===\n");

  // Test case 1: Depth-limited traversal
  console.log('Test 1: Depth-limited traversal (max_level = 1)');
  const map = new CborMap();
  map.set('shallow', 'value');
  map.set('deep', ['nested', 'array']);
  const cborData = cbor(map);

  const maxLevel = 1;
  const visited: string[] = [];

  walk(cborData, undefined, (element: WalkElement, level, edge, _state: void) => {
    const indent = '  '.repeat(level);
    const description = element.type === 'single'
      ? `Single: ${diagnosticFlat(element.cbor)}`
      : `KV: ${diagnosticFlat(element.key)} => ${diagnosticFlat(element.value)}`;

    visited.push(`L${level} ${indent}[${edge.type}] ${description}`);

    const shouldStop = level >= maxLevel;
    if (shouldStop) {
      console.log(`L${level} ${indent}🛑 STOP (max level): ${description}`);
    } else {
      console.log(`L${level} ${indent}✅ Visit: ${description}`);
    }

    return [undefined, shouldStop];
  });

  console.log('\nAll visits:');
  for (const visit of visited) {
    console.log(`  ${visit}`);
  }

  // Test case 2: Abort entire walk via visitor state
  console.log('\n\nTest 2: Abort entire walk when finding \'abort\' text');
  const abortMap = new CborMap();
  abortMap.set('first', 'normal');
  abortMap.set('second', 'abort'); // This should trigger abort
  abortMap.set('third', 'should_not_see');
  const abortCbor = cbor(abortMap);

  let abortFlag = false;
  const visited2: string[] = [];

  walk(abortCbor, undefined, (element: WalkElement, level, edge, _state: void) => {
    // Check if we should abort
    if (abortFlag) {
      console.log('🚨 Already aborted, stopping this element too');
      return [undefined, true];
    }

    let description: string;
    if (element.type === 'single') {
      if (element.cbor.type === MajorType.Text && element.cbor.value === 'abort') {
        abortFlag = true;
        description = `Single: ${element.cbor.value} (TRIGGER ABORT!)`;
      } else {
        description = `Single: ${diagnosticFlat(element.cbor)}`;
      }
    } else {
      description = `KV: ${diagnosticFlat(element.key)} => ${diagnosticFlat(element.value)}`;
    }

    visited2.push(`L${level} [${edge.type}] ${description}`);
    console.log(`L${level} ✅ Visit: ${description}`);

    // Stop if abort flag is set
    return [undefined, abortFlag];
  });

  console.log('\nAll visits before abort:');
  for (const visit of visited2) {
    console.log(`  ${visit}`);
  }

  console.log('\n=== Conclusion ===');
  console.log('✅ Depth limiting works consistently');
  console.log('✅ Full abort works via visitor state');
  console.log("✅ Stop flag means 'prevent descent into children' everywhere");
}

main();
