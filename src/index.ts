export type { Judge, Sample, Metric, MetricResult } from "./types";
export { evaluate } from "./evaluate";
export type { EvaluationResult, EvaluationSummary, EvaluateOptions } from "./evaluate";

export { faithfulness } from "./metrics/faithfulness";
export { answerRelevancy } from "./metrics/answerRelevancy";
export { contextPrecision } from "./metrics/contextPrecision";
export { contextRecall } from "./metrics/contextRecall";

export { createOllamaJudge } from "./adapters/ollama";
export type { OllamaJudgeOptions } from "./adapters/ollama";
export { createOpenAIJudge } from "./adapters/openai";
export type { OpenAIJudgeOptions } from "./adapters/openai";
export { createLangChainJudge } from "./adapters/langchain";
export type { LangChainRunnableLike } from "./adapters/langchain";

export { pushScoresToLangfuse } from "./integrations/langfuse";
export type { LangfuseOptions, PushScoresOptions } from "./integrations/langfuse";
