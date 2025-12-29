import { describe, it, expect } from "vitest";
import { cbor } from "@bcts/dcbor";
import { parse, patternPathsWithCaptures, formatPathsWithCaptures, patternPaths } from "../src";

describe("debug", () => {
  it("should capture from array", () => {
    const result = parse("[@item(42)]");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const pattern = result.value;
    const data = cbor([42]);

    console.log("Pattern kind:", pattern.kind);
    if (pattern.kind === "Structure") {
      console.log("Structure type:", pattern.pattern.type);
      if (pattern.pattern.type === "Array") {
        console.log("Array variant:", pattern.pattern.pattern.variant);
        if (pattern.pattern.pattern.variant === "Elements") {
          const elemPattern = pattern.pattern.pattern.pattern;
          console.log("Element pattern kind:", elemPattern.kind);
          if (elemPattern.kind === "Meta") {
            console.log("Meta type:", elemPattern.pattern.type);
          }
        }
      }
    }

    const paths = patternPaths(pattern, data);
    console.log("Paths:", paths.length);

    const matchResult = patternPathsWithCaptures(pattern, data);
    console.log("Match result paths:", matchResult.paths.length);
    console.log("Match result captures size:", matchResult.captures.size);
    for (const [name, capturePaths] of matchResult.captures) {
      console.log("Capture", name, ":", capturePaths.length, "paths");
    }

    const formatted = formatPathsWithCaptures(matchResult.paths, matchResult.captures);
    console.log("Formatted:", formatted);
  });
});
