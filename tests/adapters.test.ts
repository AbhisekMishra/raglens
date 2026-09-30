import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAIJudge } from "../src/adapters/openai";
import { createLangChainJudge } from "../src/adapters/langchain";
import { pushScoresToLangfuse } from "../src/integrations/langfuse";

afterEach(() => vi.unstubAllGlobals());

describe("createOpenAIJudge", () => {
  it("posts to /chat/completions and returns the message content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: "yes" } }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const judge = createOpenAIJudge({ apiKey: "k", model: "m", baseUrl: "http://x/v1/" });
    expect(await judge.complete("hi")).toBe("yes");
    expect(fetchMock.mock.calls[0][0]).toBe("http://x/v1/chat/completions");
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "nope" }));
    await expect(createOpenAIJudge({ apiKey: "k", model: "m" }).complete("hi")).rejects.toThrow("401");
  });
});

describe("createLangChainJudge", () => {
  it("handles string, message, and content-block outputs", async () => {
    expect(await createLangChainJudge({ invoke: async () => "plain" }).complete("p")).toBe("plain");
    expect(await createLangChainJudge({ invoke: async () => ({ content: "msg" }) }).complete("p")).toBe("msg");
    expect(await createLangChainJudge({ invoke: async () => ({ content: [{ text: "a" }, "b"] }) }).complete("p")).toBe("ab");
  });
});

describe("pushScoresToLangfuse", () => {
  const summary = {
    results: [
      { sample: { question: "q", answer: "a", contexts: [] }, scores: { faithfulness: { score: 1, reason: "ok" } } },
      { sample: { question: "q2", answer: "a", contexts: [] }, scores: { faithfulness: { score: 0, reason: "bad" } } },
    ],
    averages: { faithfulness: 0.5 },
  };

  it("sends one score-create per scored sample with a trace id and skips the rest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const n = await pushScoresToLangfuse(summary, { publicKey: "pk", secretKey: "sk", traceIds: ["t1", null] });
    expect(n).toBe(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.batch[0].body).toMatchObject({ traceId: "t1", name: "faithfulness", value: 1, comment: "ok" });
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" }));
    await expect(pushScoresToLangfuse(summary, { publicKey: "pk", secretKey: "bad", traceIds: ["t1", "t2"] })).rejects.toThrow("401");
  });
});
