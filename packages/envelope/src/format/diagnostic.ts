import { Envelope } from '../base/envelope';

/// Diagnostic notation formatting for Gordian Envelopes.
///
/// This module provides methods for converting envelopes to CBOR diagnostic
/// notation, a human-readable text format defined in RFC 8949 §8.
///
/// See [RFC-8949 §8](https://www.rfc-editor.org/rfc/rfc8949.html#name-diagnostic-notation)
/// for information on CBOR diagnostic notation.

declare module '../base/envelope' {
  interface Envelope {
    /// Returns the CBOR diagnostic notation for this envelope.
    ///
    /// Diagnostic notation is a human-readable representation of CBOR data
    /// that shows the structure and contents in a format similar to JSON
    /// but with CBOR-specific extensions.
    ///
    /// @returns A string containing the diagnostic notation
    ///
    /// @example
    /// ```typescript
    /// const envelope = Envelope.new("Hello");
    /// console.log(envelope.diagnostic());
    /// // Output: 200(204(101("Hello")))
    /// ```
    diagnostic(): string;
  }
}

/// Converts a CBOR value to diagnostic notation
function cborToDiagnostic(cbor: any, indent: number = 0): string {
  // Handle tagged values (CBOR tags)
  if (
    typeof cbor === 'object' &&
    cbor !== null &&
    'tag' in cbor &&
    'value' in cbor
  ) {
    return `${cbor.tag}(${cborToDiagnostic(cbor.value, indent)})`;
  }

  // Handle arrays
  if (Array.isArray(cbor)) {
    if (cbor.length === 0) {
      return '[]';
    }
    const items = cbor.map((item) => cborToDiagnostic(item, indent + 2));
    return `[${items.join(', ')}]`;
  }

  // Handle Maps
  if (cbor instanceof Map) {
    if (cbor.size === 0) {
      return '{}';
    }
    const entries: string[] = [];
    for (const [key, value] of cbor) {
      const keyStr = cborToDiagnostic(key, indent + 2);
      const valueStr = cborToDiagnostic(value, indent + 2);
      entries.push(`${keyStr}: ${valueStr}`);
    }
    return `{${entries.join(', ')}}`;
  }

  // Handle Uint8Array (byte strings)
  if (cbor instanceof Uint8Array) {
    const hex = Array.from(cbor)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `h'${hex}'`;
  }

  // Handle strings
  if (typeof cbor === 'string') {
    return JSON.stringify(cbor);
  }

  // Handle CBOR objects with type information
  if (typeof cbor === 'object' && cbor !== null && 'type' in cbor) {
    switch (cbor.type) {
      case 0: // Unsigned
        return String(cbor.value);
      case 1: // Negative
        return String(-1 - Number(cbor.value));
      case 7: // Simple
        if (
          cbor.value &&
          typeof cbor.value === 'object' &&
          'type' in cbor.value
        ) {
          if (cbor.value.type === 'Float') {
            return String(cbor.value.value);
          }
        }
        if (cbor.value === 20) return 'false';
        if (cbor.value === 21) return 'true';
        if (cbor.value === 22) return 'null';
        if (cbor.value === 23) return 'undefined';
        return `simple(${cbor.value})`;
    }
  }

  // Fallback for primitives
  if (typeof cbor === 'boolean') return String(cbor);
  if (typeof cbor === 'number') return String(cbor);
  if (typeof cbor === 'bigint') return String(cbor);
  if (cbor === null) return 'null';
  if (cbor === undefined) return 'undefined';

  // Unknown type - try JSON stringify
  try {
    return JSON.stringify(cbor);
  } catch {
    return String(cbor);
  }
}

/// Implementation of diagnostic()
Envelope.prototype.diagnostic = function (this: Envelope): string {
  const cbor = this.taggedCbor();
  return cborToDiagnostic(cbor);
};
