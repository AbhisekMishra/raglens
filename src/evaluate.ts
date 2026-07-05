import type { Judge, Metric, Sample } from "./types";

export interface EvaluationResult {
  sample: Sample;
  scores: Record<string, { score: number; reason: string }>;
}

export interface EvaluationSummary {
  results: EvaluationResult[];
  /** Mean score per metric name across the whole dataset. */
  averages: Record<string, number>;
}

export interface EvaluateOptions {
  metrics: Metric[];
  judge: Judge;
}

/** Score every sample against every metric and average the results. */
export async function evaluate(dataset: Sample[], { metrics, judge }: EvaluateOptions): Promise<EvaluationSummary> {
  const results: EvaluationResult[] = [];

  for (const sample of dataset) {
    const scores: Record<string, { score: number; reason: string }> = {};
    for (const metric of metrics) {
      scores[metric.name] = await metric.score(sample, judge);
    }
    results.push({ sample, scores });
  }

  const averages: Record<string, number> = {};
  for (const metric of metrics) {
    const values = results.map((result) => result.scores[metric.name].score);
    averages[metric.name] = values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  return { results, averages };
}
