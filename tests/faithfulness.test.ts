import { describe, expect, it } from "vitest";
import { faithfulness } from "../src/metrics/faithfulness";
import { createRoutedJudge } from "./mockJudge";

describe("faithfulness", () => {
  it("scores 1 when every extracted claim is supported", async () => {
    const judge = createRoutedJudge((prompt) => {
      if (prompt.includes("Break the following answer")) {
        return "Paris is the capital of France.\nFrance is in Europe.";
      }
      return "yes";
    });

    const result = await faithfulness.score(
      {
        question: "Where is Paris?",
        answer: "Paris is the capital of France, in Europe.",
        contexts: ["Paris is the capital of France.", "France is a country in Europe."],
      },
      judge
    );

    expect(result.score).toBe(1);
    expect(result.reason).toContain("2/2");
  });

  it("scores partial credit when some claims are unsupported", async () => {
    const judge = createRoutedJudge((prompt) => {
      if (prompt.includes("Break the following answer")) {
        return "Paris is the capital of France.\nParis has a population of 50 million.";
      }
      if (prompt.includes("50 million")) return "no";
      return "yes";
    });

    const result = await faithfulness.score(
      { question: "Tell me about Paris", answer: "irrelevant here", contexts: ["Paris is the capital of France."] },
      judge
    );

    expect(result.score).toBe(0.5);
    expect(result.reason).toContain("1/2");
  });

  it("scores 1 when the answer makes no factual claims", async () => {
    const judge = createRoutedJudge(() => "");

    const result = await faithfulness.score(
      { question: "Hi", answer: "Hello! How can I help?", contexts: [] },
      judge
    );

    expect(result.score).toBe(1);
    expect(result.reason).toBe("No factual claims to verify.");
  });
});
