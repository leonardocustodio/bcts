/**
 * @bcts/envelope-pattern - Pattern tests
 *
 * Basic tests for pattern construction and matching.
 */

import { describe, it, expect } from "vitest";
import {
  // Leaf patterns
  any,
  anyBool,
  bool,
  anyText,
  text,
  anyNumber,
  number,
  anyByteString,
  byteString,
  anyDate,
  anyKnownValue,
  anyArray,
  anyMap,
  anyTag,
  // Structure patterns
  anySubject,
  anyPredicate,
  anyObject,
  anyAssertion,
  anyNode,
  wrapped,
  unwrapEnvelope,
  obscured,
  elided,
  encrypted,
  compressed,
  // Meta patterns
  and,
  or,
  notMatching,
  capture,
  search,
  traverse,
} from "../src";

describe("Pattern Construction", () => {
  describe("Leaf Patterns", () => {
    it("creates any pattern", () => {
      const p = any();
      expect(p.type).toBe("Meta");
    });

    it("creates bool patterns", () => {
      const anyBoolPat = anyBool();
      expect(anyBoolPat.type).toBe("Leaf");

      const truePat = bool(true);
      expect(truePat.type).toBe("Leaf");

      const falsePat = bool(false);
      expect(falsePat.type).toBe("Leaf");
    });

    it("creates text patterns", () => {
      const anyTextPat = anyText();
      expect(anyTextPat.type).toBe("Leaf");

      const specificText = text("hello");
      expect(specificText.type).toBe("Leaf");
    });

    it("creates number patterns", () => {
      const anyNumPat = anyNumber();
      expect(anyNumPat.type).toBe("Leaf");

      const specificNum = number(42);
      expect(specificNum.type).toBe("Leaf");
    });

    it("creates byte string patterns", () => {
      const anyBstrPat = anyByteString();
      expect(anyBstrPat.type).toBe("Leaf");

      const specificBstr = byteString(new Uint8Array([1, 2, 3]));
      expect(specificBstr.type).toBe("Leaf");
    });

    it("creates date patterns", () => {
      const anyDatePat = anyDate();
      expect(anyDatePat.type).toBe("Leaf");
    });

    it("creates known value patterns", () => {
      const anyKvPat = anyKnownValue();
      expect(anyKvPat.type).toBe("Leaf");
    });

    it("creates array patterns", () => {
      const anyArrPat = anyArray();
      expect(anyArrPat.type).toBe("Leaf");
    });

    it("creates map patterns", () => {
      const anyMapPat = anyMap();
      expect(anyMapPat.type).toBe("Leaf");
    });

    it("creates tag patterns", () => {
      const anyTagPat = anyTag();
      expect(anyTagPat.type).toBe("Leaf");
    });
  });

  describe("Structure Patterns", () => {
    it("creates subject patterns", () => {
      const pat = anySubject();
      expect(pat.type).toBe("Structure");
    });

    it("creates predicate patterns", () => {
      const pat = anyPredicate();
      expect(pat.type).toBe("Structure");
    });

    it("creates object patterns", () => {
      const pat = anyObject();
      expect(pat.type).toBe("Structure");
    });

    it("creates assertion patterns", () => {
      const pat = anyAssertion();
      expect(pat.type).toBe("Structure");
    });

    it("creates node patterns", () => {
      const pat = anyNode();
      expect(pat.type).toBe("Structure");
    });

    it("creates wrapped pattern", () => {
      const pat = wrapped();
      expect(pat.type).toBe("Structure");
    });

    it("creates unwrap pattern", () => {
      const pat = unwrapEnvelope();
      expect(pat.type).toBe("Structure");
    });

    it("creates obscured pattern", () => {
      const pat = obscured();
      expect(pat.type).toBe("Structure");
    });

    it("creates elided pattern", () => {
      const pat = elided();
      expect(pat.type).toBe("Structure");
    });

    it("creates encrypted pattern", () => {
      const pat = encrypted();
      expect(pat.type).toBe("Structure");
    });

    it("creates compressed pattern", () => {
      const pat = compressed();
      expect(pat.type).toBe("Structure");
    });
  });

  describe("Meta Patterns", () => {
    it("creates and pattern", () => {
      const pat = and([anyNumber(), anyText()]);
      expect(pat.type).toBe("Meta");
      if (pat.type === "Meta") {
        expect(pat.pattern.type).toBe("And");
      }
    });

    it("creates or pattern", () => {
      const pat = or([anyNumber(), anyText()]);
      expect(pat.type).toBe("Meta");
      if (pat.type === "Meta") {
        expect(pat.pattern.type).toBe("Or");
      }
    });

    it("creates not pattern", () => {
      const pat = notMatching(anyNumber());
      expect(pat.type).toBe("Meta");
      if (pat.type === "Meta") {
        expect(pat.pattern.type).toBe("Not");
      }
    });

    it("creates capture pattern", () => {
      const pat = capture("myCapture", anyNumber());
      expect(pat.type).toBe("Meta");
      if (pat.type === "Meta") {
        expect(pat.pattern.type).toBe("Capture");
      }
    });

    it("creates search pattern", () => {
      const pat = search(anyNumber());
      expect(pat.type).toBe("Meta");
      if (pat.type === "Meta") {
        expect(pat.pattern.type).toBe("Search");
      }
    });

    it("creates traverse pattern", () => {
      const pat = traverse([anySubject(), anyNumber()]);
      expect(pat.type).toBe("Meta");
      if (pat.type === "Meta") {
        expect(pat.pattern.type).toBe("Traverse");
      }
    });
  });
});

describe("Pattern Display", () => {
  it("displays any pattern", () => {
    const p = any();
    expect(p.toString()).toBeDefined();
  });

  it("displays bool pattern", () => {
    expect(bool(true).toString()).toBeDefined();
    expect(bool(false).toString()).toBeDefined();
  });

  it("displays number pattern", () => {
    expect(number(42).toString()).toBeDefined();
  });

  it("displays text pattern", () => {
    expect(text("hello").toString()).toBeDefined();
  });
});
