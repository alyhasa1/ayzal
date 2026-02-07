import { describe, expect, it } from "vitest";
import {
  dedupeProductsById,
  getFreeShippingState,
  pickCrossSellCandidates,
  toIdSet,
} from "../../src/lib/commerce";

describe("commerce helpers", () => {
  it("toIdSet normalizes values and drops empty entries", () => {
    const ids = toIdSet(["abc", "", "abc", "def"]);
    expect([...ids]).toEqual(["abc", "def"]);
  });

  it("dedupeProductsById excludes duplicates and requested ids", () => {
    const products = [
      { id: "p1", name: "One" },
      { id: "p2", name: "Two" },
      { id: "p2", name: "Two duplicate" },
      { id: "p3", name: "Three" },
    ];

    const result = dedupeProductsById(products, {
      excludeIds: ["p1"],
      limit: 2,
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("p2");
    expect(result[1]?.id).toBe("p3");
  });

  it("pickCrossSellCandidates filters excluded ids and respects limit", () => {
    const result = pickCrossSellCandidates(
      [{ _id: "a" }, { _id: "b" }, { _id: "c" }, { id: "d" }],
      { excludeIds: ["b"], limit: 2 }
    );

    expect(result).toHaveLength(2);
    expect(result[0]?._id).toBe("a");
    expect(result[1]?._id).toBe("c");
  });

  it("getFreeShippingState returns expected progress and remaining", () => {
    const state = getFreeShippingState(9000, 15000);
    expect(state.remaining).toBe(6000);
    expect(state.progress).toBe(60);
    expect(state.unlocked).toBe(false);
  });

  it("getFreeShippingState clamps negative and overflow inputs", () => {
    const negative = getFreeShippingState(-10, 15000);
    expect(negative.progress).toBe(0);
    expect(negative.remaining).toBe(15000);

    const overflow = getFreeShippingState(22000, 15000);
    expect(overflow.progress).toBe(100);
    expect(overflow.remaining).toBe(0);
    expect(overflow.unlocked).toBe(true);
  });
});
