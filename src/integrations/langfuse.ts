import type { EvaluationSummary } from "../evaluate";

export interface LangfuseOptions {
  publicKey: string;
  secretKey: string;
  /** Defaults to "https://cloud.langfuse.com". */
  baseUrl?: string;
}

export interface PushScoresOptions extends LangfuseOptions {
  /** One LangFuse trace id per sample, in the same order as `summary.results`. Null/undefined entries are skipped. */
  traceIds: (string | null | undefined)[];
}

/**
 * Push every metric score in an evaluation summary to LangFuse as a trace-level score, with
 * the metric's reason as the score comment. Uses LangFuse's public ingestion REST API via
 * fetch — no LangFuse SDK dependency. Returns how many scores were sent; throws on a non-2xx
 * response so a misconfigured key fails loudly rather than silently dropping scores.
 */
export async function pushScoresToLangfuse(summary: EvaluationSummary, options: PushScoresOptions): Promise<number> {
  const { publicKey, secretKey, baseUrl = "https://cloud.langfuse.com", traceIds } = options;
  const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
  const now = new Date().toISOString();

  const batch = summary.results.flatMap((result, i) => {
    const traceId = traceIds[i];
    if (!traceId) return [];
    return Object.entries(result.scores).map(([name, { score, reason }]) => ({
      type: "score-create",
      id: crypto.randomUUID(),
      timestamp: now,
      body: { id: crypto.randomUUID(), traceId, name, value: score, comment: reason },
    }));
  });

  if (batch.length === 0) return 0;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/public/ingestion`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ batch }),
  });

  if (!response.ok) {
    throw new Error(`LangFuse score push failed: ${response.status} ${await response.text()}`);
  }
  return batch.length;
}
