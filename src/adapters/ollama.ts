import type { Judge } from "../types";

export interface OllamaJudgeOptions {
  /** e.g. "http://localhost:11434" */
  baseUrl: string;
  model: string;
}

/** Judge backed by a local/remote Ollama server's /api/generate endpoint. */
export function createOllamaJudge({ baseUrl, model }: OllamaJudgeOptions): Judge {
  const url = `${baseUrl.replace(/\/$/, "")}/api/generate`;

  return {
    async complete(prompt: string): Promise<string> {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
      });

      if (!response.ok) {
        throw new Error(`Ollama judge request failed: ${response.status} ${await response.text()}`);
      }

      const data = (await response.json()) as { response: string };
      return data.response;
    },
  };
}
