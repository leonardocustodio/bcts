/**
 * Comprehensive Walk Demo Example
 *
 * This example demonstrates various patterns for using the walk module
 * including pattern matching, statistics collection, and early termination.
 *
 * Port of: bc-dcbor-rust/examples/comprehensive_walk_demo.rs
 */

import { CborMap } from '../src/map';
import { cbor } from '../src/cbor';
import { walk, WalkElement } from '../src/walk';
import { diagnosticFlat } from '../src/diag';
import { MajorType } from '../src/cbor';

function main() {
  console.log('=== DCBOR Walk Module Demonstration ===\n');

  // Create a complex nested CBOR structure
  const person = new CborMap();
  person.set('name', 'Alice Smith');
  person.set('age', 30);
  person.set('email', 'alice@example.com');

  const address = new CborMap();
  address.set('street', '123 Main St');
  address.set('city', 'San Francisco');
  address.set('zip', 94102);
  person.set('address', address);

  const profile = new CborMap();
  profile.set('skills', ['Rust', 'CBOR', 'Cryptography']);
  profile.set('years_experience', 5);
  person.set('profile', profile);

  const cborData = cbor(person);

  console.log('CBOR structure:');
  console.log(`${diagnosticFlat(cborData)}\n`);

  // Demo 1: Ergonomic key-value pattern matching
  console.log('=== Demo 1: Key-Value Pattern Matching ===');
  const foundPatterns: string[] = [];

  walk(cborData, undefined, (element: WalkElement, _level, _edge, _state: void) => {
    if (element.type === 'keyvalue') {
      if (element.key.type === MajorType.Text) {
        const keyStr = element.key.value as string;
        switch (keyStr) {
          case 'email':
            if (element.value.type === MajorType.Text) {
              foundPatterns.push(`📧 Email: ${element.value.value}`);
            }
            break;
          case 'name':
            if (element.value.type === MajorType.Text) {
              foundPatterns.push(`👤 Name: ${element.value.value}`);
            }
            break;
          case 'city':
            if (element.value.type === MajorType.Text) {
              foundPatterns.push(`🏙️  City: ${element.value.value}`);
            }
            break;
          case 'zip':
            if (element.value.type === MajorType.Unsigned) {
              foundPatterns.push(`📮 ZIP: ${element.value.value}`);
            }
            break;
        }
      }
    }
    return [undefined, false];
  });

  for (const pattern of foundPatterns) {
    console.log(`  ${pattern}`);
  }
  console.log();

  // Demo 2: Tree structure visualization with element types
  console.log('=== Demo 2: Tree Structure Visualization ===');
  walk(cborData, undefined, (element: WalkElement, level, edge, _state: void) => {
    const indent = '  '.repeat(level);
    const edgeLabel = edge.type;

    let elementType: string;
    if (element.type === 'single') {
      switch (element.cbor.type) {
        case MajorType.Map:
          elementType = '🗂️  Map';
          break;
        case MajorType.Array:
          elementType = '📚 Array';
          break;
        case MajorType.Text:
          elementType = '📝 Text';
          break;
        case MajorType.Unsigned:
          elementType = '🔢 Number';
          break;
        case MajorType.Tagged:
          elementType = '🏷️  Tagged';
          break;
        default:
          elementType = '❓ Other';
      }
    } else {
      elementType = '🔗 Key-Value';
    }

    console.log(
      `${indent}[${edgeLabel}] ${elementType} ${diagnosticFlat(element)}`
    );
    return [undefined, false];
  });
  console.log();

  // Demo 3: Collecting statistics with state
  console.log('=== Demo 3: Statistics Collection ===');

  interface Stats {
    totalElements: number;
    keyValuePairs: number;
    textValues: number;
    numericValues: number;
    nestedStructures: number;
    maxDepth: number;
  }

  const finalStats = walk(cborData, {
    totalElements: 0,
    keyValuePairs: 0,
    textValues: 0,
    numericValues: 0,
    nestedStructures: 0,
    maxDepth: 0
  } as Stats, (element: WalkElement, level, _edge, state: Stats): [Stats, boolean] => {
    const newStats = { ...state };
    newStats.totalElements += 1;
    newStats.maxDepth = Math.max(newStats.maxDepth, level);

    if (element.type === 'keyvalue') {
      newStats.keyValuePairs += 1;
    } else {
      switch (element.cbor.type) {
        case MajorType.Text:
          newStats.textValues += 1;
          break;
        case MajorType.Unsigned:
        case MajorType.Negative:
          newStats.numericValues += 1;
          break;
        case MajorType.Map:
        case MajorType.Array:
          newStats.nestedStructures += 1;
          break;
      }
    }

    return [newStats, false];
  });

  console.log(`  📊 Total elements: ${finalStats.totalElements}`);
  console.log(`  🔗 Key-value pairs: ${finalStats.keyValuePairs}`);
  console.log(`  📝 Text values: ${finalStats.textValues}`);
  console.log(`  🔢 Numeric values: ${finalStats.numericValues}`);
  console.log(`  🗂️  Nested structures: ${finalStats.nestedStructures}`);
  console.log(`  📏 Maximum depth: ${finalStats.maxDepth}`);
  console.log();

  // Demo 4: Early termination for search
  console.log('=== Demo 4: Early Termination Search ===');
  const searchResults: string[] = [];

  walk(cborData, undefined, (element: WalkElement, _level, _edge, _state: void) => {
    if (element.type === 'keyvalue') {
      if (element.key.type === MajorType.Text && element.value.type === MajorType.Text) {
        if (element.key.value === 'email') {
          searchResults.push(`Found email: ${element.value.value}`);
          return [undefined, true]; // Stop traversal
        }
      }
    }
    return [undefined, false];
  });

  for (const result of searchResults) {
    console.log(`  ✅ ${result}`);
  }
  console.log('  ⏹️  Stopped traversal early after finding target\n');

  // Demo 5: API Benefits Summary
  console.log('=== Demo 5: API Benefits Summary ===');
  console.log('🎯 Key-Value Pattern Matching:');
  console.log('  ✅ NEW: Direct access to (key, value) pairs');
  console.log('  ❌ OLD: Required external state management to correlate keys and values');
  console.log();
  console.log('🔍 Element Type Detection:');
  console.log('  ✅ NEW: Single enum match on WalkElement');
  console.log('  ❌ OLD: Always had to check CBOR type first');
  console.log();
  console.log('📝 Code Simplicity:');
  console.log('  ✅ NEW: ~50% less code for pattern matching');
  console.log('  ❌ OLD: Complex state tracking for map traversal');
  console.log();
  console.log('🏗️  Suitable for dcbor-pattern crate: ✅');
}

main();
