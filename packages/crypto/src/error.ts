// Ported from bc-crypto-rust/src/error.rs

/**
 * AEAD-specific error for authentication failures
 */
export class AeadError extends Error {
  constructor(message = "AEAD authentication failed") {
    super(message);
    this.name = "AeadError";
  }
}

/**
 * Generic crypto error type
 */
export class CryptoError extends Error {
  override readonly cause?: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "CryptoError";
    this.cause = cause;
  }

  static aead(error?: AeadError): CryptoError {
    return new CryptoError("AEAD error", error ?? new AeadError());
  }
}

/**
 * Result type for crypto operations (using standard Error)
 */
export type CryptoResult<T> = T;
