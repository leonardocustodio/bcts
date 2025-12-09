/**
 * Apparently Random Identifier (ARID) - 32-byte random identifier
 */

declare global {
  interface Global {
    crypto?: Crypto;
  }
  var global: Global;
  var Buffer: any;
}

interface Buffer {
  toString(encoding: string): string;
}

interface BufferConstructor {
  from(data: Uint8Array | string, encoding?: string): Buffer;
}

declare var Buffer: BufferConstructor;

import { CryptoError } from "./error.js";

const ARID_SIZE = 32;

export class ARID {
  private data: Uint8Array;

  private constructor(data: Uint8Array) {
    if (data.length !== ARID_SIZE) {
      throw CryptoError.invalidSize(ARID_SIZE, data.length);
    }
    this.data = new Uint8Array(data);
  }

  /**
   * Create an ARID from raw bytes
   */
  static from(data: Uint8Array): ARID {
    return new ARID(new Uint8Array(data));
  }

  /**
   * Create an ARID from hex string
   */
  static fromHex(hex: string): ARID {
    const data = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      data[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return new ARID(data);
  }

  /**
   * Generate a random ARID
   */
  static random(): ARID {
    const data = new Uint8Array(ARID_SIZE);
    if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(data);
    } else if (typeof global !== "undefined" && typeof global.crypto !== "undefined") {
      global.crypto.getRandomValues(data);
    } else {
      // Fallback: fill with available random data
      for (let i = 0; i < ARID_SIZE; i++) {
        data[i] = Math.floor(Math.random() * 256);
      }
    }
    return new ARID(data);
  }

  /**
   * Get the raw ARID bytes
   */
  toData(): Uint8Array {
    return new Uint8Array(this.data);
  }

  /**
   * Get hex string representation
   */
  toHex(): string {
    return Array.from(this.data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  /**
   * Get base64 representation
   */
  toBase64(): string {
    return Buffer.from(this.data).toString("base64");
  }

  /**
   * Compare with another ARID
   */
  equals(other: ARID): boolean {
    if (this.data.length !== other.data.length) return false;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] !== other.data[i]) return false;
    }
    return true;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `ARID(${this.toHex()})`;
  }
}
