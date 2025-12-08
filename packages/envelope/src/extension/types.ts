import { Envelope } from "../base/envelope";
import { type EnvelopeEncodableValue } from "../base/envelope-encodable";
import { EnvelopeError } from "../base/error";

/// Type system for Gordian Envelopes.
///
/// This module provides functionality for adding, querying, and verifying types
/// within envelopes. In Gordian Envelope, types are implemented using the
/// special `'isA'` predicate (the string "isA"), which is semantically
/// equivalent to the RDF `rdf:type` concept.
///
/// Type information enables:
/// - Semantic classification of envelopes
/// - Type verification before processing content
/// - Conversion between domain objects and envelopes
/// - Schema validation
///
/// ## Type Representation
///
/// Types are represented as assertions with the `'isA'` predicate and an object
/// that specifies the type. The type object is typically a string or an envelope.
///
/// ## Usage Patterns
///
/// The type system is commonly used in two ways:
///
/// 1. **Type Tagging**: Adding type information to envelopes to indicate their
///    semantic meaning
///
///    ```typescript
///    // Create an envelope representing a person
///    const person = Envelope.new("Alice")
///      .addType("Person")
///      .addAssertion("age", 30);
///    ```
///
/// 2. **Type Checking**: Verifying that an envelope has the expected type
///    before processing
///
///    ```typescript
///    function processPerson(envelope: Envelope): void {
///      // Verify this is a person before processing
///      envelope.checkType("Person");
///
///      // Now we can safely extract person-specific information
///      const name = envelope.subject().extractString();
///      const age = envelope.objectForPredicate("age").extractNumber();
///
///      console.log(`${name} is ${age} years old`);
///    }
///    ```

/// The standard predicate for type assertions
export const IS_A = "isA";

declare module "../base/envelope" {
  interface Envelope {
    /// Adds a type assertion to the envelope using the `'isA'` predicate.
    ///
    /// This method provides a convenient way to declare the type of an envelope
    /// using the standard `'isA'` predicate. The type can be any value that can
    /// be converted to an envelope, typically a string.
    ///
    /// @param object - The type to assign to this envelope
    /// @returns A new envelope with the type assertion added
    ///
    /// @example
    /// ```typescript
    /// // Create a document and declare its type
    /// const document = Envelope.new("Important Content").addType("Document");
    ///
    /// // Verify the type was added
    /// assert(document.hasType("Document"));
    /// ```
    addType(object: EnvelopeEncodableValue): Envelope;

    /// Returns all type objects from the envelope's `'isA'` assertions.
    ///
    /// This method retrieves all objects of assertions that use the `'isA'`
    /// predicate. Each returned envelope represents a type that has been
    /// assigned to this envelope.
    ///
    /// @returns An array of envelopes, each representing a type assigned to
    ///   this envelope
    ///
    /// @example
    /// ```typescript
    /// // Create an envelope with multiple types
    /// const multiTyped = Envelope.new("Versatile Entity")
    ///   .addType("Person")
    ///   .addType("Employee")
    ///   .addType("Manager");
    ///
    /// // Get all the type objects
    /// const types = multiTyped.types();
    ///
    /// // There should be 3 types
    /// console.log(types.length); // 3
    /// ```
    types(): Envelope[];

    /// Gets a single type object from the envelope's `'isA'` assertions.
    ///
    /// This method is useful when an envelope is expected to have exactly one
    /// type. It throws an error if the envelope has zero or multiple types.
    ///
    /// @returns The single type object if exactly one exists
    /// @throws {EnvelopeError} If multiple types exist or no types exist
    ///
    /// @example
    /// ```typescript
    /// // Create an envelope with a single type
    /// const person = Envelope.new("Alice").addType("Person");
    ///
    /// // Get the type
    /// const typeObj = person.getType();
    /// const typeString = typeObj.extractString();
    /// console.log(typeString); // "Person"
    /// ```
    getType(): Envelope;

    /// Checks if the envelope has a specific type, using an envelope as the
    /// type identifier.
    ///
    /// This method compares the digest of each type object with the digest of
    /// the provided value to determine if the envelope has the specified type.
    ///
    /// @param t - The type to check for, which will be converted to an envelope
    /// @returns `true` if the envelope has the specified type, `false`
    ///   otherwise
    ///
    /// @example
    /// ```typescript
    /// // Create a typed envelope
    /// const document = Envelope.new("Contract")
    ///   .addType("LegalDocument")
    ///   .addAssertion("status", "Draft");
    ///
    /// // Check for various types
    /// console.log(document.hasType("LegalDocument")); // true
    /// console.log(document.hasType("Spreadsheet")); // false
    /// ```
    hasType(t: EnvelopeEncodableValue): boolean;

    /// Verifies that the envelope has a specific type.
    ///
    /// This method is similar to `hasType` but throws an error instead of
    /// returning false, making it suitable for use in validation chains.
    ///
    /// @param t - The type to check for, which will be converted to an envelope
    /// @throws {EnvelopeError} If the envelope does not have the specified type
    ///
    /// @example
    /// ```typescript
    /// // Function that processes a person
    /// function processPerson(envelope: Envelope): string {
    ///   // Verify this is a person
    ///   envelope.checkType("Person");
    ///
    ///   // Extract the name
    ///   const name = envelope.subject().extractString();
    ///   return name;
    /// }
    ///
    /// // Create a person envelope
    /// const person = Envelope.new("Alice").addType("Person");
    ///
    /// // Process the person
    /// const result = processPerson(person);
    /// console.log(result); // "Alice"
    ///
    /// // Create a non-person envelope
    /// const document = Envelope.new("Contract").addType("Document");
    ///
    /// // Processing will throw an error
    /// try {
    ///   processPerson(document);
    /// } catch (e) {
    ///   console.log("Not a person!");
    /// }
    /// ```
    checkType(t: EnvelopeEncodableValue): void;
  }
}

/// Implementation of addType()
Envelope.prototype.addType = function (this: Envelope, object: EnvelopeEncodableValue): Envelope {
  return this.addAssertion(IS_A, object);
};

/// Implementation of types()
Envelope.prototype.types = function (this: Envelope): Envelope[] {
  return this.objectsForPredicate(IS_A);
};

/// Implementation of getType()
Envelope.prototype.getType = function (this: Envelope): Envelope {
  const t = this.types();
  if (t.length === 0) {
    throw EnvelopeError.invalidType();
  }
  if (t.length === 1) {
    return t[0];
  }
  throw EnvelopeError.ambiguousType();
};

/// Implementation of hasType()
Envelope.prototype.hasType = function (this: Envelope, t: EnvelopeEncodableValue): boolean {
  const e = Envelope.new(t);
  return this.types().some((x) => x.digest().equals(e.digest()));
};

/// Implementation of checkType()
Envelope.prototype.checkType = function (this: Envelope, t: EnvelopeEncodableValue): void {
  if (!this.hasType(t)) {
    throw EnvelopeError.invalidType();
  }
};
