export type { Judge, Sample, Metric, MetricResult } from "./types";
export { evaluate } from "./evaluate";
export type { EvaluationResult, EvaluationSummary, EvaluateOptions } from "./evaluate";

export { faithfulness } from "./metrics/faithfulness";
export { answerRelevancy } from "./metrics/answerRelevancy";

export { createOllamaJudge } from "./adapters/ollama";
export type { OllamaJudgeOptions } from "./adapters/ollama";
