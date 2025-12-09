import { sha256, extendKey, obfuscate } from "../src";

describe("crypto-utils", () => {
  describe("sha256", () => {
    it("should compute correct SHA-256 hash", () => {
      const data = new TextEncoder().encode("Hello World");
      const hash = sha256(data);

      const expected = hexDecode(
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      );
      expect(hash).toEqual(expected);
    });
  });

  describe("extendKey", () => {
    it("should extend key using HKDF", () => {
      const data = new TextEncoder().encode("Hello World");
      const extended = extendKey(data);

      const expected = hexDecode(
        "813085a508d5fec645abe5a1fb9a23c2a6ac6bef0a99650017b3ef50538dba39",
      );
      expect(extended).toEqual(expected);
    });
  });

  describe("obfuscate", () => {
    it("should obfuscate and deobfuscate correctly", () => {
      const key = new TextEncoder().encode("Hello");
      const message = new TextEncoder().encode("World");

      const obfuscated = obfuscate(key, message);
      expect(obfuscated).toEqual(hexDecode("c43889aafa"));

      const deobfuscated = obfuscate(key, obfuscated);
      expect(deobfuscated).toEqual(message);
    });

    it("should return empty array for empty message", () => {
      const key = new TextEncoder().encode("Hello");
      const message = new Uint8Array(0);

      const obfuscated = obfuscate(key, message);
      expect(obfuscated).toEqual(new Uint8Array(0));
    });
  });
});

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
