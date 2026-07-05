import type { Judge, Metric, MetricResult, Sample } from "../types";

async function extractStatements(answer: string, judge: Judge): Promise<string[]> {
  const prompt = `Break the following answer into simple, standalone factual statements — one per line, no numbering, no commentary. If the answer makes no factual claims (e.g. it's a greeting or a refusal), return nothing.

Answer:
${answer}`;

  const response = await judge.complete(prompt);
  return response
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
}

async function isSupported(statement: string, contexts: string[], judge: Judge): Promise<boolean> {
  const prompt = `Context:
${contexts.join("\n\n")}

Statement: "${statement}"

Is this statement directly supported by the context above? Reply with exactly one word: "yes" or "no".`;

  const response = await judge.complete(prompt);
  return response.trim().toLowerCase().startsWith("y");
}

/**
 * Faithfulness: of the factual claims in the answer, how many are actually
 * grounded in the retrieved context? Mirrors RAGAS's decompose-then-verify
 * approach rather than a single holistic judge call, so one hallucinated
 * clause in an otherwise-correct answer still shows up in the score.
 */
export const faithfulness: Metric = {
  name: "faithfulness",
  async score(sample: Sample, judge: Judge): Promise<MetricResult> {
    const statements = await extractStatements(sample.answer, judge);
    if (statements.length === 0) {
      return { score: 1, reason: "No factual claims to verify." };
    }

    const verdicts = await Promise.all(
      statements.map((statement) => isSupported(statement, sample.contexts, judge))
    );
    const supported = verdicts.filter(Boolean).length;

    return {
      score: supported / statements.length,
      reason: `${supported}/${statements.length} claims were supported by the retrieved context.`,
    };
  },
};
