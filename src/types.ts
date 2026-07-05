/** Anything that can turn a prompt into a completion. The only thing metrics depend on. */
export interface Judge {
  complete(prompt: string): Promise<string>;
}

/** One question/answer/context triple to score. */
export interface Sample {
  question: string;
  answer: string;
  contexts: string[];
  /** Required by recall-style metrics; optional for the rest. */
  groundTruth?: string;
}

export interface MetricResult {
  /** 0 (worst) to 1 (best). */
  score: number;
  /** One-line explanation a human can sanity-check. */
  reason: string;
}

export interface Metric {
  name: string;
  score(sample: Sample, judge: Judge): Promise<MetricResult>;
}
