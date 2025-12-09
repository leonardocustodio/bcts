import { ProvenanceMark, ProvenanceMarkGenerator, ProvenanceMarkResolution } from "../src";

describe("ProvenanceMark", () => {
  describe("Low resolution", () => {
    it("should generate expected marks with passphrase 'Wolf'", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const dates = Array.from(
        { length: 10 },
        (_, i) => new Date(Date.UTC(2023, 5, 20 + i, 0, 0, 0, 0)),
      );

      let currentGenerator = generator;
      const marks: ProvenanceMark[] = [];

      for (const date of dates) {
        // Serialize and deserialize generator to test persistence
        const json = JSON.stringify(currentGenerator.toJSON());
        currentGenerator = ProvenanceMarkGenerator.fromJSON(JSON.parse(json));

        const mark = currentGenerator.next(date);
        marks.push(mark);
      }

      // Test expected identifiers
      const expectedIds = [
        "5bdcec81",
        "477e3ce6",
        "3e5da986",
        "41c525a1",
        "8095afb4",
        "3bcacc8d",
        "41486af2",
        "5fa35da9",
        "e369288f",
        "7ce8f8bc",
      ];

      expect(marks.map((m) => m.identifier())).toEqual(expectedIds);

      // Verify sequence is valid
      expect(ProvenanceMark.isSequenceValid(marks)).toBe(true);

      // Verify marks don't work in reverse
      expect(marks[1].precedes(marks[0])).toBe(false);
    });

    it("should serialize and deserialize via bytewords", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const mark = generator.next(date);

      const bytewords = mark.toBytewords();
      const restored = ProvenanceMark.fromBytewords(ProvenanceMarkResolution.Low, bytewords);

      expect(mark.equals(restored)).toBe(true);
    });

    it("should serialize and deserialize via CBOR", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const mark = generator.next(date);

      const cborData = mark.toCborData();
      const restored = ProvenanceMark.fromCborData(cborData);

      expect(mark.equals(restored)).toBe(true);
    });

    it("should serialize and deserialize via URL encoding", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const mark = generator.next(date);

      const urlEncoding = mark.toUrlEncoding();
      const restored = ProvenanceMark.fromUrlEncoding(urlEncoding);

      expect(mark.equals(restored)).toBe(true);
    });

    it("should build and parse URLs", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const mark = generator.next(date);

      const url = mark.toUrl("https://example.com/validate");
      const restored = ProvenanceMark.fromUrl(url);

      expect(mark.equals(restored)).toBe(true);
    });
  });

  describe("Medium resolution", () => {
    it("should generate expected marks", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Medium,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 12, 0, 0, 0));
      const mark = generator.next(date);

      // Medium resolution has 8-byte links
      expect(mark.key().length).toBe(8);
      expect(mark.hash().length).toBe(8);
      expect(mark.chainId().length).toBe(8);
    });
  });

  describe("Quartile resolution", () => {
    it("should generate expected marks", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Quartile,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 12, 0, 0, 0));
      const mark = generator.next(date);

      // Quartile resolution has 16-byte links
      expect(mark.key().length).toBe(16);
      expect(mark.hash().length).toBe(16);
      expect(mark.chainId().length).toBe(16);
    });
  });

  describe("High resolution", () => {
    it("should generate expected marks", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.High,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 12, 0, 0, 0));
      const mark = generator.next(date);

      // High resolution has 32-byte links
      expect(mark.key().length).toBe(32);
      expect(mark.hash().length).toBe(32);
      expect(mark.chainId().length).toBe(32);
    });
  });

  describe("Genesis mark", () => {
    it("should correctly identify genesis marks", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const genesisMark = generator.next(date);

      expect(genesisMark.isGenesis()).toBe(true);
      expect(genesisMark.seq()).toBe(0);

      // Key should equal chain ID for genesis mark
      expect(genesisMark.key()).toEqual(genesisMark.chainId());

      // Second mark should not be genesis
      const secondMark = generator.next(new Date(Date.UTC(2023, 5, 21)));
      expect(secondMark.isGenesis()).toBe(false);
      expect(secondMark.seq()).toBe(1);
    });
  });

  describe("JSON serialization", () => {
    it("should serialize and deserialize via JSON", () => {
      const generator = ProvenanceMarkGenerator.newWithPassphrase(
        ProvenanceMarkResolution.Low,
        "Wolf",
      );

      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const mark = generator.next(date);

      const json = mark.toJSON();
      const restored = ProvenanceMark.fromJSON(json);

      expect(mark.identifier()).toEqual(restored.identifier());
      expect(mark.seq()).toEqual(restored.seq());
    });
  });
});
