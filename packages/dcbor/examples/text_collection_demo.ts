/**
 * Text Collection Demo Example
 *
 * This example demonstrates collecting text strings from a CBOR structure,
 * handling both single elements and key-value pairs.
 *
 * Port of: bc-dcbor-rust/examples/text_collection_demo.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  // Create a simple map with text keys and values
  const map = new CborMap();
  map.set('name', 'Alice'); // Both text - should be easy to collect
  map.set('age', 30); // Text key, number value
  map.set('nested', [1, 2]); // Text key, array value
  const cborData = cbor(map);

  console.log(`CBOR: ${diagnosticFlat(cborData)}`);
  console.log('\n=== Current behavior (with has_nested_content check) ===');

  const texts: string[] = [];
  walk(cborData, undefined, (element: WalkElement, depth, edge, _state: void) => {
    const indent = '  '.repeat(depth);
    if (element.type === 'single') {
      console.log(
        `${indent}[${edge.type}] Single: ${diagnosticFlat(element.cbor)}`
      );
      if (element.cbor.type === MajorType.Text) {
        texts.push(`Single: ${element.cbor.value}`);
      }
    } else {
      // KeyValue
      console.log(
        `${indent}[${edge.type}] KeyValue: ${diagnosticFlat(element.key)} => ${diagnosticFlat(element.value)}`
      );

      // User has to manually check both key and value
      if (element.key.type === MajorType.Text) {
        texts.push(`KV-Key: ${element.key.value}`);
      }
      if (element.value.type === MajorType.Text) {
        texts.push(`KV-Value: ${element.value.value}`);
      }
    }
    return [undefined, false];
  });

  console.log(`\nCollected texts: ${JSON.stringify(texts)}`);
  console.log(`Total texts found: ${texts.length}`);
}

main();
