import type { Judge } from "../types";

/**
 * Structural stand-in for any LangChain(JS) runnable that accepts a string prompt — a chat
 * model (`ChatOllama`, `ChatOpenAI`, …) resolves to a message with `.content`, an LLM or a
 * chain ending in a parser resolves to a plain string. Typed structurally so raglens takes
 * no dependency on `@langchain/core`.
 */
export interface LangChainRunnableLike {
  invoke(input: string): Promise<string | { content: unknown }>;
}

/** Judge backed by any LangChain runnable — reuse the model your app already has configured. */
export function createLangChainJudge(runnable: LangChainRunnableLike): Judge {
  return {
    async complete(prompt: string): Promise<string> {
      const output = await runnable.invoke(prompt);
      if (typeof output === "string") return output;
      const { content } = output;
      if (typeof content === "string") return content;
      // Multimodal/structured content blocks: keep the text parts.
      if (Array.isArray(content)) {
        return content
          .map((part) => (typeof part === "string" ? part : (part as { text?: string }).text ?? ""))
          .join("");
      }
      return String(content ?? "");
    },
  };
}
