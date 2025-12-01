/**
 * Improved Text Collection Example
 *
 * This example demonstrates improved text collection patterns,
 * showing how to collect all text values and key-value pairs.
 *
 * Port of: bc-dcbor-rust/examples/improved_text_collection.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  // Create a map with various types
  const map = new CborMap();
  map.set('name', 'Alice');
  map.set('age', 30);
  map.set('nested', ['skill1', 'skill2']);
  const cborData = cbor(map);

  console.log(`CBOR: ${diagnosticFlat(cborData)}`);
  console.log('\n=== NEW: Simple text collection ===');

  const texts: string[] = [];
  walk(cborData, undefined, (element: WalkElement, _depth, _edge, _state: void) => {
    // Now we can collect ALL text nodes with a simple pattern match!
    if (element.type === 'single') {
      if (element.cbor.type === MajorType.Text) {
        texts.push(element.cbor.value as string);
      }
    }
    return [undefined, false];
  });

  console.log(`All text values found: ${JSON.stringify(texts)}`);
  console.log(`Total: ${texts.length}`);

  console.log('\n=== Comparison: Key-value pairs are ALSO available ===');
  const kvPairs: string[] = [];
  walk(cborData, undefined, (element: WalkElement, _depth, _edge, _state: void) => {
    if (element.type === 'keyvalue') {
      if (element.key.type === MajorType.Text && element.value.type === MajorType.Text) {
        kvPairs.push(`${element.key.value} -> ${element.value.value}`);
      }
    }
    return [undefined, false];
  });

  console.log(`Key-value text pairs: ${JSON.stringify(kvPairs)}`);

  console.log('\n=== Benefits ===');
  console.log('✅ Consistent: All elements visited individually');
  console.log('✅ Ergonomic: Simple pattern matching on WalkElement::Single');
  console.log('✅ Complete: No manual checking of key-value pairs required');
  console.log('✅ Flexible: Both individual elements AND semantic pairs available');
}

main();
