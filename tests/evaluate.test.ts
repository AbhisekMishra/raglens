import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate";
import type { Metric } from "../src/types";
import { createScriptedJudge } from "./mockJudge";

const alwaysHalf: Metric = {
  name: "half",
  async score() {
    return { score: 0.5, reason: "fixed" };
  },
};

describe("evaluate", () => {
  it("scores every sample against every metric and averages per metric", async () => {
    const dataset = [
      { question: "a", answer: "a", contexts: [] },
      { question: "b", answer: "b", contexts: [] },
    ];
    const judge = createScriptedJudge(["ignored"]);

    const summary = await evaluate(dataset, { metrics: [alwaysHalf], judge });

    expect(summary.results).toHaveLength(2);
    expect(summary.averages.half).toBe(0.5);
  });
});
