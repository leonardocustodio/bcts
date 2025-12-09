import {
  serialize2Bytes,
  deserialize2Bytes,
  serialize4Bytes,
  deserialize4Bytes,
  serialize6Bytes,
  deserialize6Bytes,
} from "../src";

describe("date serialization", () => {
  describe("2-byte serialization", () => {
    it("should serialize and deserialize 2023-06-20", () => {
      const date = new Date(Date.UTC(2023, 5, 20, 0, 0, 0, 0));
      const bytes = serialize2Bytes(date);
      expect(bytes.length).toBe(2);

      const restored = deserialize2Bytes(bytes);
      expect(restored.getUTCFullYear()).toBe(2023);
      expect(restored.getUTCMonth()).toBe(5); // June (0-indexed)
      expect(restored.getUTCDate()).toBe(20);
    });

    it("should handle year boundaries", () => {
      const minDate = new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0));
      const bytes1 = serialize2Bytes(minDate);
      const restored1 = deserialize2Bytes(bytes1);
      expect(restored1.getUTCFullYear()).toBe(2023);

      const maxDate = new Date(Date.UTC(2150, 11, 31, 0, 0, 0, 0));
      const bytes2 = serialize2Bytes(maxDate);
      const restored2 = deserialize2Bytes(bytes2);
      expect(restored2.getUTCFullYear()).toBe(2150);
    });

    it("should throw for year out of range", () => {
      const tooEarly = new Date(Date.UTC(2022, 5, 20, 0, 0, 0, 0));
      expect(() => serialize2Bytes(tooEarly)).toThrow();

      const tooLate = new Date(Date.UTC(2151, 5, 20, 0, 0, 0, 0));
      expect(() => serialize2Bytes(tooLate)).toThrow();
    });
  });

  describe("4-byte serialization", () => {
    it("should serialize and deserialize dates as seconds since 2001-01-01", () => {
      const date = new Date(Date.UTC(2023, 5, 20, 12, 0, 0, 0));
      const bytes = serialize4Bytes(date);
      expect(bytes.length).toBe(4);

      const restored = deserialize4Bytes(bytes);
      // 4-byte serialization has second precision
      expect(restored.getTime()).toBe(date.getTime());
    });

    it("should handle reference date", () => {
      const refDate = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
      const bytes = serialize4Bytes(refDate);
      expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0]));

      const restored = deserialize4Bytes(bytes);
      expect(restored.getTime()).toBe(refDate.getTime());
    });
  });

  describe("6-byte serialization", () => {
    it("should serialize and deserialize dates with millisecond precision", () => {
      const date = new Date(Date.UTC(2023, 5, 20, 12, 30, 45, 123));
      const bytes = serialize6Bytes(date);
      expect(bytes.length).toBe(6);

      const restored = deserialize6Bytes(bytes);
      expect(restored.getTime()).toBe(date.getTime());
    });

    it("should handle reference date", () => {
      const refDate = new Date(Date.UTC(2001, 0, 1, 0, 0, 0, 0));
      const bytes = serialize6Bytes(refDate);
      expect(bytes).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0]));

      const restored = deserialize6Bytes(bytes);
      expect(restored.getTime()).toBe(refDate.getTime());
    });
  });
});
