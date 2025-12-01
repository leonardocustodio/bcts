import { Envelope } from './envelope';
import { EnvelopeError } from './error';

/// Support for wrapping and unwrapping envelopes.
///
/// Wrapping allows treating an envelope (including its assertions) as a single
/// unit, making it possible to add assertions about the envelope as a whole.

declare module './envelope' {
  interface Envelope {
    /// Returns a new envelope which wraps the current envelope.
    ///
    /// Wrapping an envelope allows you to treat an envelope (including its
    /// assertions) as a single unit, making it possible to add assertions
    /// about the envelope as a whole.
    ///
    /// @returns A new wrapped envelope
    ///
    /// @example
    /// ```typescript
    /// // Create an envelope with an assertion
    /// const envelope = Envelope.new("Hello.").addAssertion("language", "English");
    ///
    /// // Wrap it to add an assertion about the envelope as a whole
    /// const wrapped = envelope.wrap().addAssertion("authenticated", true);
    /// ```
    wrap(): Envelope;

    /// Unwraps and returns the inner envelope.
    ///
    /// This extracts the envelope contained within a wrapped envelope.
    ///
    /// @returns The unwrapped envelope
    /// @throws {EnvelopeError} If this is not a wrapped envelope
    ///
    /// @example
    /// ```typescript
    /// // Create an envelope and wrap it
    /// const envelope = Envelope.new("Hello.");
    /// const wrapped = envelope.wrap();
    ///
    /// // Unwrap to get the original envelope
    /// const unwrapped = wrapped.tryUnwrap();
    /// ```
    tryUnwrap(): Envelope;

    /// Alias for tryUnwrap() - unwraps and returns the inner envelope.
    ///
    /// @returns The unwrapped envelope
    /// @throws {EnvelopeError} If this is not a wrapped envelope
    unwrap(): Envelope;
  }
}

/// Implementation of wrap()
Envelope.prototype.wrap = function (this: Envelope): Envelope {
  return Envelope.newWrapped(this);
};

/// Implementation of tryUnwrap()
Envelope.prototype.tryUnwrap = function (this: Envelope): Envelope {
  const c = this.subject().case();
  if (c.type === 'wrapped') {
    return c.envelope;
  }
  throw EnvelopeError.notWrapped();
};

/// Implementation of unwrap() - alias for tryUnwrap()
Envelope.prototype.unwrap = function (this: Envelope): Envelope {
  return this.tryUnwrap();
};
