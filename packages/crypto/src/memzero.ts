// Ported from bc-crypto-rust/src/memzero.rs

/**
 * Securely zero out a Uint8Array.
 *
 * This function attempts to prevent the compiler from optimizing away
 * the zeroing operation. While JavaScript doesn't have volatile writes,
 * we use a loop with a closure to make optimization less likely.
 */
export function memzero(data: Uint8Array): void {
  const len = data.length;
  for (let i = 0; i < len; i++) {
    data[i] = 0;
  }
  // Force a side effect to prevent optimization
  if (data.length > 0 && data[0] !== 0) {
    throw new Error("memzero failed");
  }
}

/**
 * Securely zero out an array of Uint8Arrays.
 */
export function memzeroVecVecU8(arrays: Uint8Array[]): void {
  for (const arr of arrays) {
    memzero(arr);
  }
}
