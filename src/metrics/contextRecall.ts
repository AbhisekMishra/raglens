import type { Judge, Metric, MetricResult, Sample } from "../types";

async function extractStatements(groundTruth: string, judge: Judge): Promise<string[]> {
  const prompt = `Break the following reference answer into simple, standalone factual statements — one per line, no numbering, no commentary.

Reference answer:
${groundTruth}`;

  const response = await judge.complete(prompt);
  return response
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
}

async function isAttributable(statement: string, contexts: string[], judge: Judge): Promise<boolean> {
  const prompt = `Context:
${contexts.join("\n\n")}

Statement: "${statement}"

Can this statement be found in, or directly inferred from, the context above? Reply with exactly one word: "yes" or "no".`;

  const response = await judge.complete(prompt);
  return response.trim().toLowerCase().startsWith("y");
}

/**
 * Context recall: did retrieval surface everything needed to construct the ground-truth
 * answer? Decomposes the reference into factual statements and checks how many are
 * attributable to the retrieved context — the mirror image of faithfulness, which checks
 * the *answer* against the context. Requires `sample.groundTruth`.
 */
export const contextRecall: Metric = {
  name: "context_recall",
  async score(sample: Sample, judge: Judge): Promise<MetricResult> {
    if (!sample.groundTruth) {
      throw new Error("context_recall requires sample.groundTruth");
    }

    const statements = await extractStatements(sample.groundTruth, judge);
    if (statements.length === 0) {
      return { score: 1, reason: "Ground truth contains no factual statements to check." };
    }

    const verdicts = await Promise.all(
      statements.map((statement) => isAttributable(statement, sample.contexts, judge))
    );
    const found = verdicts.filter(Boolean).length;

    return {
      score: found / statements.length,
      reason: `${found}/${statements.length} ground-truth statements were covered by the retrieved context.`,
    };
  },
};
