import type { Judge } from "../types";

export interface OpenAIJudgeOptions {
  apiKey: string;
  model: string;
  /** Defaults to "https://api.openai.com/v1". Point at any OpenAI-compatible server (vLLM, LM Studio, Together, …). */
  baseUrl?: string;
}

/** Judge backed by an OpenAI-compatible /chat/completions endpoint. Uses fetch — no SDK dependency. */
export function createOpenAIJudge({ apiKey, model, baseUrl = "https://api.openai.com/v1" }: OpenAIJudgeOptions): Judge {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  return {
    async complete(prompt: string): Promise<string> {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, temperature: 0, messages: [{ role: "user", content: prompt }] }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI judge request failed: ${response.status} ${await response.text()}`);
      }

      const data = (await response.json()) as { choices: { message: { content: string | null } }[] };
      return data.choices[0]?.message?.content ?? "";
    },
  };
}
