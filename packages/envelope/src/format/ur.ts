import { Envelope } from "../base/envelope";
import { UR } from "@bcts/uniform-resources";

/// UR (Uniform Resource) serialization for Gordian Envelopes.
///
/// This module provides methods for converting envelopes to and from
/// UR format, which is the standard interchange format for Gordian Envelopes.

// Note: Method declarations are in the base Envelope class.
// This module provides the prototype implementations.

/// Implementation of ur()
Envelope.prototype.ur = function (this: Envelope): UR {
  // Note: UR uses untagged CBOR since the type is conveyed by the UR type itself.
  // For envelopes, we use the tagged CBOR since the envelope tag (200) is part
  // of the envelope format.
  return UR.new("envelope", this.taggedCbor());
};

/// Implementation of urString()
Envelope.prototype.urString = function (this: Envelope): string {
  return this.ur().string();
};

// Add static methods to Envelope class
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Envelope as any).fromUr = function (ur: UR): Envelope {
  ur.checkType("envelope");
  // The UR cbor() returns the untagged CBOR content.
  // For envelopes, this is the tagged envelope content.
  return Envelope.fromTaggedCbor(ur.cbor());
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Envelope as any).fromUrString = function (urString: string): Envelope {
  const ur = UR.fromURString(urString);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Envelope as any).fromUr(ur);
};
