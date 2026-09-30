import type { Judge, Metric, MetricResult, Sample } from "../types";

async function isUseful(sample: Sample, context: string, judge: Judge): Promise<boolean> {
  const reference = sample.groundTruth
    ? `Reference answer: "${sample.groundTruth}"`
    : `Answer given: "${sample.answer}"`;

  const prompt = `Question: "${sample.question}"
${reference}

Retrieved context chunk:
${context}

Was this chunk useful for arriving at the answer to the question? Reply with exactly one word: "yes" or "no".`;

  const response = await judge.complete(prompt);
  return response.trim().toLowerCase().startsWith("y");
}

/**
 * Context precision: were the relevant chunks ranked ahead of the irrelevant ones?
 * Follows RAGAS's average-precision formulation — each chunk is judged relevant or not,
 * then score = mean of precision@k taken at every relevant rank k. Order matters: the
 * same chunks ranked relevant-first score higher than relevant-last. Uses `groundTruth`
 * as the reference when present, otherwise falls back to the generated answer.
 * `sample.contexts` must be in retrieval order, one entry per chunk.
 */
export const contextPrecision: Metric = {
  name: "context_precision",
  async score(sample: Sample, judge: Judge): Promise<MetricResult> {
    if (sample.contexts.length === 0) {
      return { score: 0, reason: "No contexts were retrieved." };
    }

    const verdicts = await Promise.all(sample.contexts.map((context) => isUseful(sample, context, judge)));
    const relevantTotal = verdicts.filter(Boolean).length;
    if (relevantTotal === 0) {
      return { score: 0, reason: `0/${verdicts.length} retrieved chunks were relevant.` };
    }

    let relevantSoFar = 0;
    let precisionSum = 0;
    verdicts.forEach((relevant, index) => {
      if (!relevant) return;
      relevantSoFar++;
      precisionSum += relevantSoFar / (index + 1);
    });

    return {
      score: precisionSum / relevantTotal,
      reason: `${relevantTotal}/${verdicts.length} retrieved chunks were relevant (ranks: ${verdicts.map((v) => (v ? "Y" : "N")).join("")}).`,
    };
  },
};
