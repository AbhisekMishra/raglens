import { describe, expect, it } from "vitest";
import { contextPrecision } from "../src/metrics/contextPrecision";
import { contextRecall } from "../src/metrics/contextRecall";
import { createRoutedJudge } from "./mockJudge";

const base = { question: "Q?", answer: "A.", groundTruth: "Truth." };

// Judges "yes" only when the chunk text appears on its own line in the prompt.
const relevantOnly = (relevant: string[]) =>
  createRoutedJudge((prompt) => (relevant.some((chunk) => prompt.split("\n").includes(chunk)) ? "yes" : "no"));

describe("contextPrecision", () => {
  it("scores 1 when all relevant chunks are ranked first", async () => {
    const result = await contextPrecision.score({ ...base, contexts: ["good1", "good2", "bad"] }, relevantOnly(["good1", "good2"]));
    expect(result.score).toBe(1);
  });

  it("penalizes relevant chunks ranked last", async () => {
    // relevant only at rank 3 -> precision@3 = 1/3
    const result = await contextPrecision.score({ ...base, contexts: ["bad1", "bad2", "good"] }, relevantOnly(["good"]));
    expect(result.score).toBeCloseTo(1 / 3);
  });

  it("scores 0 when nothing is relevant", async () => {
    const result = await contextPrecision.score({ ...base, contexts: ["bad1", "bad2"] }, relevantOnly([]));
    expect(result.score).toBe(0);
  });

  it("scores 0 for empty contexts", async () => {
    const result = await contextPrecision.score({ ...base, contexts: [] }, relevantOnly([]));
    expect(result.score).toBe(0);
  });
});

describe("contextRecall", () => {
  it("scores the fraction of ground-truth statements covered", async () => {
    const judge = createRoutedJudge((prompt) => {
      if (prompt.includes("Break the following reference")) return "Fact A.\nFact B.";
      return prompt.includes("Fact A") ? "yes" : "no";
    });
    const result = await contextRecall.score({ question: "Q", answer: "A", groundTruth: "Fact A. Fact B.", contexts: ["ctx"] }, judge);
    expect(result.score).toBe(0.5);
    expect(result.reason).toContain("1/2");
  });

  it("throws without groundTruth", async () => {
    await expect(contextRecall.score({ question: "Q", answer: "A", contexts: [] }, createRoutedJudge(() => "yes"))).rejects.toThrow("groundTruth");
  });
});
