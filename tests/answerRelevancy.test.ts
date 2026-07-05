import { describe, expect, it } from "vitest";
import { answerRelevancy } from "../src/metrics/answerRelevancy";
import { createScriptedJudge } from "./mockJudge";

describe("answerRelevancy", () => {
  it("parses the score and reason from the judge response", async () => {
    const judge = createScriptedJudge(["0.9\nThe answer directly addresses the question."]);
    const result = await answerRelevancy.score({ question: "Q", answer: "A", contexts: [] }, judge);
    expect(result.score).toBe(0.9);
    expect(result.reason).toBe("The answer directly addresses the question.");
  });

  it("clamps out-of-range scores into [0, 1]", async () => {
    const judge = createScriptedJudge(["1.5\nToo generous."]);
    const result = await answerRelevancy.score({ question: "Q", answer: "A", contexts: [] }, judge);
    expect(result.score).toBe(1);
  });

  it("falls back to 0 when the judge doesn't return a number", async () => {
    const judge = createScriptedJudge(["not a number"]);
    const result = await answerRelevancy.score({ question: "Q", answer: "A", contexts: [] }, judge);
    expect(result.score).toBe(0);
  });
});
