import { describe, it, expect } from "vitest";
import { findChromeMatch, slugify, suggestNames } from "@/lib/names";

describe("names", () => {
  it("slugifies", () => expect(slugify(" Speed Test! ")).toBe("speed-test"));
  it("suggests 6 distinct variants", () => {
    const s = suggestNames("abc");
    expect(s).toHaveLength(6);
    expect(s).not.toContain("abc");
  });
  it("matches chrome result by name", () => {
    const html = `href="./detail/speed-test/aeghledigokaedmpimgnfplidhdhlchg" [["aeghledigokaedmpimgnfplidhdhlchg","https://x","Speed Test",4]`;
    expect(findChromeMatch(html, "speed test")?.id).toBe("aeghledigokaedmpimgnfplidhdhlchg");
    expect(findChromeMatch(html, "speed")).toBeNull();
  });
});
