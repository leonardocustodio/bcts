import { sha256, Xoshiro256StarStar } from "../src";

describe("Xoshiro256StarStar", () => {
  it("should generate expected random bytes from sha256 seed", () => {
    const data = new TextEncoder().encode("Hello World");
    const digest = sha256(data);
    const rng = Xoshiro256StarStar.fromData(digest);
    const key = rng.nextBytes(32);

    const expected = hexDecode("b18b446df414ec00714f19cb0f03e45cd3c3d5d071d2e7483ba8627c65b9926a");
    expect(key).toEqual(expected);
  });

  it("should save and restore RNG state correctly", () => {
    const state: [bigint, bigint, bigint, bigint] = [
      17295166580085024720n,
      422929670265678780n,
      5577237070365765850n,
      7953171132032326923n,
    ];
    const data = Xoshiro256StarStar.fromState(state).toData();

    const expected = hexDecode("d0e72cf15ec604f0bcab28594b8cde05dab04ae79053664d0b9dadc201575f6e");
    expect(data).toEqual(expected);

    const state2 = Xoshiro256StarStar.fromData(data).toState();
    const data2 = Xoshiro256StarStar.fromState(state2).toData();
    expect(data).toEqual(data2);
  });
});

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
