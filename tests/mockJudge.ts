import type { Judge } from "../src/types";

/** Returns responses in order, repeating the last one once exhausted. */
export function createScriptedJudge(responses: string[]): Judge {
  let i = 0;
  return {
    async complete(): Promise<string> {
      const response = responses[Math.min(i, responses.length - 1)];
      i++;
      return response;
    },
  };
}

/** Picks a response based on the prompt content — for metrics that make more than one kind of call. */
export function createRoutedJudge(handler: (prompt: string) => string): Judge {
  return {
    async complete(prompt: string): Promise<string> {
      return handler(prompt);
    },
  };
}
