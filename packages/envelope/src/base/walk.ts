import { Envelope } from "./envelope";

/// Functions for traversing and manipulating the envelope hierarchy.
///
/// This module provides functionality for traversing the hierarchical structure
/// of envelopes, allowing for operations such as inspection, transformation,
/// and extraction of specific elements. It implements a visitor pattern that
/// enables executing arbitrary code on each element of an envelope in a
/// structured way.
///
/// The traversal can be performed in two modes:
/// - Structure-based traversal: Visits every element in the envelope hierarchy
/// - Tree-based traversal: Skips node elements and focuses on the semantic
///   content

/// The type of incoming edge provided to the visitor.
///
/// This enum identifies how an envelope element is connected to its parent in
/// the hierarchy during traversal. It helps the visitor function understand the
/// semantic relationship between elements.
export enum EdgeType {
  /// No incoming edge (root)
  None = "none",
  /// Element is the subject of a node
  Subject = "subject",
  /// Element is an assertion on a node
  Assertion = "assertion",
  /// Element is the predicate of an assertion
  Predicate = "predicate",
  /// Element is the object of an assertion
  Object = "object",
  /// Element is the content wrapped by another envelope
  Content = "content",
}

/// Returns a short text label for the edge type, or undefined if no label is
/// needed.
///
/// This is primarily used for tree formatting to identify relationships
/// between elements.
///
/// @param edgeType - The edge type
/// @returns A short label or undefined
export function edgeLabel(edgeType: EdgeType): string | undefined {
  switch (edgeType) {
    case EdgeType.Subject:
      return "subj";
    case EdgeType.Content:
      return "cont";
    case EdgeType.Predicate:
      return "pred";
    case EdgeType.Object:
      return "obj";
    case EdgeType.None:
    case EdgeType.Assertion:
      return undefined;
    default:
      return undefined;
  }
}

/// A visitor function that is called for each element in the envelope.
///
/// The visitor function takes the following parameters:
/// - `envelope`: The current envelope element being visited
/// - `level`: The depth level in the hierarchy (0 for root)
/// - `incomingEdge`: The type of edge connecting this element to its parent
/// - `state`: Optional context passed down from the parent's visitor call
///
/// The visitor returns a tuple of:
/// - The state that will be passed to child elements
/// - A boolean indicating whether to stop traversal (true = stop)
///
/// This enables accumulating state or passing context during traversal.
export type Visitor<State> = (
  envelope: Envelope,
  level: number,
  incomingEdge: EdgeType,
  state: State,
) => [State, boolean];

declare module "./envelope" {
  interface Envelope {
    /// Walks the envelope structure, calling the visitor function for each
    /// element.
    ///
    /// This function traverses the entire envelope hierarchy and calls the
    /// visitor function on each element. The traversal can be performed in
    /// two modes:
    ///
    /// - Structure-based traversal (`hideNodes = false`): Visits every element
    ///   including node containers
    /// - Tree-based traversal (`hideNodes = true`): Skips node elements and
    ///   focuses on semantic content
    ///
    /// The visitor function can optionally return a context value that is
    /// passed to child elements, enabling state to be accumulated or passed
    /// down during traversal.
    ///
    /// @param hideNodes - If true, the visitor will not be called for node
    ///   containers
    /// @param state - Initial state passed to the visitor
    /// @param visit - The visitor function called for each element
    walk<State>(hideNodes: boolean, state: State, visit: Visitor<State>): void;
  }
}

/// Implementation of walk()
Envelope.prototype.walk = function <State>(
  this: Envelope,
  hideNodes: boolean,
  state: State,
  visit: Visitor<State>,
): void {
  if (hideNodes) {
    walkTree(this, 0, EdgeType.None, state, visit);
  } else {
    walkStructure(this, 0, EdgeType.None, state, visit);
  }
};

/// Recursive implementation of structure-based traversal.
///
/// This internal function performs the actual recursive traversal of the
/// envelope structure, visiting every element and maintaining the
/// correct level and edge relationships.
function walkStructure<State>(
  envelope: Envelope,
  level: number,
  incomingEdge: EdgeType,
  state: State,
  visit: Visitor<State>,
): void {
  // Visit this envelope
  const [newState, stop] = visit(envelope, level, incomingEdge, state);
  if (stop) {
    return;
  }

  const nextLevel = level + 1;
  const c = envelope.case();

  switch (c.type) {
    case "node":
      // Visit subject
      walkStructure(c.subject, nextLevel, EdgeType.Subject, newState, visit);
      // Visit all assertions
      for (const assertion of c.assertions) {
        walkStructure(assertion, nextLevel, EdgeType.Assertion, newState, visit);
      }
      break;

    case "wrapped":
      // Visit wrapped envelope
      walkStructure(c.envelope, nextLevel, EdgeType.Content, newState, visit);
      break;

    case "assertion":
      // Visit predicate and object
      walkStructure(c.assertion.predicate(), nextLevel, EdgeType.Predicate, newState, visit);
      walkStructure(c.assertion.object(), nextLevel, EdgeType.Object, newState, visit);
      break;

    case "leaf":
    case "elided":
    case "knownValue":
    case "encrypted":
    case "compressed":
      // Leaf nodes and other types have no children
      break;
  }
}

/// Recursive implementation of tree-based traversal.
///
/// This internal function performs the actual recursive traversal of the
/// envelope's semantic tree, skipping node containers and focusing on
/// the semantic content elements. It maintains the correct level and
/// edge relationships while skipping structural elements.
function walkTree<State>(
  envelope: Envelope,
  level: number,
  incomingEdge: EdgeType,
  state: State,
  visit: Visitor<State>,
): State {
  let currentState = state;
  let subjectLevel = level;

  // Skip visiting if this is a node
  if (!envelope.isNode()) {
    const [newState, stop] = visit(envelope, level, incomingEdge, currentState);
    if (stop) {
      return newState;
    }
    currentState = newState;
    subjectLevel = level + 1;
  }

  const c = envelope.case();

  switch (c.type) {
    case "node": {
      // Visit subject
      const assertionState = walkTree(
        c.subject,
        subjectLevel,
        EdgeType.Subject,
        currentState,
        visit,
      );
      // Visit all assertions
      const assertionLevel = subjectLevel + 1;
      for (const assertion of c.assertions) {
        walkTree(assertion, assertionLevel, EdgeType.Assertion, assertionState, visit);
      }
      break;
    }

    case "wrapped":
      // Visit wrapped envelope
      walkTree(c.envelope, subjectLevel, EdgeType.Content, currentState, visit);
      break;

    case "assertion":
      // Visit predicate and object
      walkTree(c.assertion.predicate(), subjectLevel, EdgeType.Predicate, currentState, visit);
      walkTree(c.assertion.object(), subjectLevel, EdgeType.Object, currentState, visit);
      break;

    case "leaf":
    case "elided":
    case "knownValue":
    case "encrypted":
    case "compressed":
      // Leaf nodes and other types have no children
      break;
  }

  return currentState;
}
