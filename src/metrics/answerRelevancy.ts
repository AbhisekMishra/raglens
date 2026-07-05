import type { Judge, Metric, MetricResult, Sample } from "../types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Answer relevancy: does the answer actually address the question asked?
 * Upstream RAGAS scores this via embedding similarity between the question
 * and LLM-generated reverse-questions; this is a direct LLM-as-judge scoring
 * instead, so the core stays dependency-free and doesn't require an
 * embeddings model. Trade-off documented in the README.
 */
export const answerRelevancy: Metric = {
  name: "answer_relevancy",
  async score(sample: Sample, judge: Judge): Promise<MetricResult> {
    const prompt = `Question: "${sample.question}"
Answer: "${sample.answer}"

On a scale from 0.0 to 1.0, how directly and completely does the answer address the question? Reply with ONLY a number between 0 and 1 on the first line (e.g. "0.8"), then a one-sentence reason on the next line.`;

    const response = await judge.complete(prompt);
    const [scoreLine, ...rest] = response.trim().split("\n");
    const score = clamp01(parseFloat(scoreLine));

    return {
      score,
      reason: rest.join(" ").trim() || response.trim(),
    };
  },
};
