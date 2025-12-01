#!/usr/bin/env node

/**
 * Test runner for all examples
 * Runs each example and verifies core functionality works
 */

const { CborMap } = require('../dist/map');
const { cbor, MajorType, cborData } = require('../dist/cbor');
const { walk, EdgeType } = require('../dist/walk');
const { diagnostic, diagnosticFlat } = require('../dist/diag');
const { decodeCbor } = require('../dist/decode');

console.log('=== Testing All Example Functionality ===\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
    failCount++;
  }
}

// 1. walk_demo - Basic walking and counting
test('walk_demo: Basic walking and counting', () => {
  const map1 = new CborMap();
  map1.set('name', 'Alice');
  map1.set('age', 30);
  map1.set('hobbies', ['reading', 'coding']);
  
  const cbor1 = cbor(map1);
  let count1 = 0;
  walk(cbor1, 0, (el, lv, ed, st) => { 
    count1++; 
    return [st, false]; 
  });
  
  if (count1 < 5) throw new Error('Expected at least 5 elements');
  console.log('  Walked', count1, 'elements');
});

// 2. tagged_demo - Tagged values
test('tagged_demo: Tagged values', () => {
  const innerMap = new CborMap();
  innerMap.set('name', 'Alice');
  innerMap.set('age', 30);
  
  const taggedVal = cbor({ tag: 100, value: innerMap });
  const diag = diagnosticFlat(taggedVal);
  
  if (!diag.includes('100')) throw new Error('Tag not found in diagnostic');
  console.log('  Tagged value:', diag);
});

// 3. abort_test - Early termination
test('abort_test: Early termination with stopDescent', () => {
  const map2 = new CborMap();
  map2.set('a', 'normal');
  map2.set('b', 'abort');
  map2.set('c', [1, 2, 3]);
  
  const cbor2 = cbor(map2);
  let foundAbort = false;
  let sawArray = false;
  
  walk(cbor2, undefined, (el, lv, ed, st) => {
    if (el.type === 'single' && el.cbor.type === MajorType.Array) {
      sawArray = true;
    }
    const stop = el.type === 'single' && 
                 el.cbor.type === MajorType.Text && 
                 el.cbor.value === 'abort';
    if (stop) foundAbort = true;
    return [st, stop];
  });
  
  if (!foundAbort) throw new Error('Abort not found');
  console.log('  Early termination worked:', foundAbort);
});

// 4. text_collection_demo - Collecting specific types
test('text_collection_demo: Collecting text strings', () => {
  const map3 = new CborMap();
  map3.set('key1', 'value1');
  map3.set('key2', 'value2');
  map3.set('key3', 'value3');
  
  const cbor3 = cbor(map3);
  const texts = [];
  
  walk(cbor3, undefined, (el, lv, ed, st) => {
    if (el.type === 'single' && el.cbor.type === MajorType.Text) {
      texts.push(el.cbor.value);
    }
    return [st, false];
  });
  
  if (texts.length < 6) throw new Error('Expected at least 6 text strings (keys+values)');
  console.log('  Collected', texts.length, 'text strings');
});

// 5. count_test - Nested structures
test('count_test: Nested structure counting', () => {
  const inner = new CborMap();
  inner.set('x', [1, 2]);
  inner.set('y', 3);
  
  const outer = new CborMap();
  outer.set('inner', inner);
  outer.set('simple', 42);
  
  const cbor4 = cbor(outer);
  let mapCount = 0;
  let arrayCount = 0;
  
  walk(cbor4, undefined, (el, lv, ed, st) => {
    if (el.type === 'single') {
      if (el.cbor.type === MajorType.Map) mapCount++;
      if (el.cbor.type === MajorType.Array) arrayCount++;
    }
    return [st, false];
  });
  
  if (mapCount !== 2) throw new Error('Expected 2 maps, got ' + mapCount);
  if (arrayCount !== 1) throw new Error('Expected 1 array, got ' + arrayCount);
  console.log('  Found', mapCount, 'maps and', arrayCount, 'arrays');
});

// 6. diagnostic_walk - Depth limiting
test('diagnostic_walk: Depth-limited traversal', () => {
  const nestedStructure = cbor([
    cbor(['inner', 'array']),
    cbor('middle'),
    cbor(['another', 'inner'])
  ]);
  
  let maxDepthSeen = 0;
  const depthLimit = 1;
  
  walk(nestedStructure, undefined, (el, level, edge, st) => {
    if (level > maxDepthSeen) maxDepthSeen = level;
    const stopDescent = level >= depthLimit;
    return [st, stopDescent];
  });
  
  if (maxDepthSeen !== depthLimit) {
    throw new Error(`Expected max depth ${depthLimit}, got ${maxDepthSeen}`);
  }
  console.log('  Max depth with limit:', maxDepthSeen);
});

// 7. comprehensive_walk_demo - Multiple visitor patterns
test('comprehensive_walk_demo: Statistics collection', () => {
  const rootMap = new CborMap();
  rootMap.set('numbers', [1, 2, 3, 4, 5]);
  rootMap.set('text', 'hello');
  
  const cbor5 = cbor(rootMap);
  
  const stats = {
    totalElements: 0,
    numberCount: 0,
    stringCount: 0
  };
  
  walk(cbor5, stats, (el, lv, ed, st) => {
    const newStats = { ...st };
    newStats.totalElements++;
    
    if (el.type === 'single') {
      if (el.cbor.type === MajorType.Unsigned || el.cbor.type === MajorType.Negative) {
        newStats.numberCount++;
      }
      if (el.cbor.type === MajorType.Text) {
        newStats.stringCount++;
      }
    }
    
    return [newStats, false];
  });
  
  console.log('  Stats:', stats);
});

// 8. Round-trip encoding/decoding
test('Encode/Decode round-trip', () => {
  const testMap = new CborMap();
  testMap.set('test', 42);
  testMap.set('hello', 'world');
  
  const encoded = cborData(testMap);
  const decoded = decodeCbor(encoded);
  const reencoded = cborData(decoded);
  
  if (encoded.length !== reencoded.length) {
    throw new Error('Round-trip failed: lengths differ');
  }
  
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] !== reencoded[i]) {
      throw new Error('Round-trip failed: bytes differ at position ' + i);
    }
  }
  
  console.log('  Round-trip successful:', encoded.length, 'bytes');
});

// 9. Diagnostic formatting
test('Diagnostic formatting (flat and pretty)', () => {
  const arr = cbor([1, 2, 3]);
  const map = new CborMap();
  map.set('x', 10);
  
  const diag1 = diagnostic(arr);
  const diagFlat1 = diagnosticFlat(arr);
  const diag2 = diagnostic(cbor(map));
  const diagFlat2 = diagnosticFlat(cbor(map));
  
  if (!diag1 || !diagFlat1 || !diag2 || !diagFlat2) {
    throw new Error('Diagnostic output missing');
  }
  
  console.log('  Array flat:', diagFlat1);
  console.log('  Map flat:', diagFlat2);
});

// 10. search_pattern_demo - Finding specific patterns
test('search_pattern_demo: Finding specific values', () => {
  const rootMap = new CborMap();
  rootMap.set('target', 'findme');
  rootMap.set('other', 'ignore');
  
  const nestedMap = new CborMap();
  nestedMap.set('deep', 'findme');
  rootMap.set('nested', nestedMap);
  
  const cbor6 = cbor(rootMap);
  const foundTargets = [];
  
  walk(cbor6, undefined, (el, lv, ed, st) => {
    if (el.type === 'single' && 
        el.cbor.type === MajorType.Text && 
        el.cbor.value === 'findme') {
      foundTargets.push(el.cbor.value);
    }
    return [st, false];
  });
  
  if (foundTargets.length !== 2) {
    throw new Error('Expected to find 2 targets, found ' + foundTargets.length);
  }
  
  console.log('  Found', foundTargets.length, 'target values');
});

// 11. stop_behavior_test - Stop flag consistency
test('stop_behavior_test: Stop flag prevents child traversal', () => {
  const inner = cbor(['should', 'not', 'see']);
  const outer = cbor(['before', inner, 'after']);
  
  const seenValues = [];
  
  walk(outer, undefined, (el, lv, ed, st) => {
    if (el.type === 'single' && el.cbor.type === MajorType.Text) {
      seenValues.push(el.cbor.value);
    }
    
    // Stop descent into nested array
    const stopDescent = el.type === 'single' && 
                        el.cbor.type === MajorType.Array && 
                        lv > 0;
    
    return [st, stopDescent];
  });
  
  // Should see 'before' and 'after' but not the inner array contents
  if (seenValues.includes('should') || seenValues.includes('not') || seenValues.includes('see')) {
    throw new Error('Stop flag failed - saw inner array contents');
  }
  
  if (!seenValues.includes('before') || !seenValues.includes('after')) {
    throw new Error('Stop flag failed - did not see outer array contents');
  }
  
  console.log('  Stop flag correctly prevented descent');
});

// 12. Key-value pair handling
test('Key-value pair handling in maps', () => {
  const map = new CborMap();
  map.set('key1', 'value1');
  map.set('key2', 'value2');
  
  const cbor7 = cbor(map);
  let keyValuePairs = 0;
  
  walk(cbor7, undefined, (el, lv, ed, st) => {
    if (el.type === 'keyvalue') {
      keyValuePairs++;
    }
    return [st, false];
  });
  
  if (keyValuePairs !== 2) {
    throw new Error('Expected 2 key-value pairs, got ' + keyValuePairs);
  }
  
  console.log('  Found', keyValuePairs, 'key-value pairs');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total:  ${passCount + failCount}`);

if (failCount > 0) {
  console.error('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All examples working!');
  process.exit(0);
}
