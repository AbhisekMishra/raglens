# raglens

[![CI](https://github.com/AbhisekMishra/raglens/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhisekMishra/raglens/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/raglens.svg)](https://www.npmjs.com/package/raglens)
[![license](https://img.shields.io/npm/l/raglens.svg)](./LICENSE)

**RAGAS-style RAG evaluation metrics for TypeScript.** Provider-agnostic, zero required runtime dependencies, built to be dropped into any Node.js RAG pipeline — no Python required.

[RAGAS](https://github.com/explodinggradients/ragas) is the standard for RAG evaluation, but it's Python-only. If your app is TypeScript, you've had to either shell out to Python or hand-roll your own scoring. raglens gives you the same core metrics as a small, well-tested TS library instead.

## Why raglens

- **The 4 core RAGAS metrics** — faithfulness, answer relevancy, context precision, context recall (precision/recall land in v0.2 — see [Roadmap](#roadmap)).
- **Provider-agnostic core.** Metrics depend on a single `Judge` interface (`complete(prompt) => Promise<string>`) — bring any LLM. First-class adapters ship for Ollama, with OpenAI and LangChain on the way.
- **Zero required dependencies.** The core package has none; adapters carry their own peer dependencies so you only install what you use.
- **Built and proven inside a real app.** raglens is developed alongside [rag-ollama-js](https://github.com/AbhisekMishra/rag-ollama-js), an Ollama + LangChain + Supabase RAG chat app that uses it to score its own retrieval strategies against each other.

## Install

```bash
npm install raglens
```

## Quickstart

```ts
import { evaluate, faithfulness, answerRelevancy, createOllamaJudge } from "raglens";

const judge = createOllamaJudge({ baseUrl: "http://localhost:11434", model: "llama3.2" });

const summary = await evaluate(
  [
    {
      question: "What's the Pro tier storage limit?",
      answer: "The Pro tier includes 1TB of storage.",
      contexts: ["Pro tier ($15/month) includes 1TB of storage with daily backups."],
    },
  ],
  { metrics: [faithfulness, answerRelevancy], judge }
);

console.log(summary.averages);
// { faithfulness: 1, answer_relevancy: 0.95 }
```

## API

### `evaluate(dataset, options)`

Scores every `Sample` in `dataset` against every metric in `options.metrics`, using `options.judge`. Returns `{ results, averages }` — per-sample scores plus the mean of each metric across the dataset.

### `Sample`

```ts
interface Sample {
  question: string;
  answer: string;
  contexts: string[];
  groundTruth?: string; // required by recall-style metrics
}
```

### `Judge`

```ts
interface Judge {
  complete(prompt: string): Promise<string>;
}
```

Implement this against any LLM provider. `createOllamaJudge({ baseUrl, model })` is the built-in adapter.

### Metrics

| Metric | Question it answers | Needs `groundTruth`? |
| --- | --- | --- |
| `faithfulness` | Is every claim in the answer actually supported by the retrieved context? | No |
| `answer_relevancy` | Does the answer address the question that was actually asked? | No |
| `context_precision` *(v0.2)* | Were the relevant chunks ranked ahead of the irrelevant ones? | No |
| `context_recall` *(v0.2)* | Did retrieval surface everything needed to construct the ground-truth answer? | Yes |

Each metric returns `{ score: number (0–1), reason: string }` — the reason is always a plain-language explanation you can sanity-check by hand, not just a bare number.

### A note on `answer_relevancy`

Upstream RAGAS scores this via embedding similarity between the question and several LLM-generated reverse-questions. raglens uses a direct LLM-as-judge score instead, so the core doesn't require an embeddings model as a dependency. This is a deliberate simplification, not an oversight — an embedding-based variant is a natural adapter-level addition once there's demand for it.

## Roadmap

- [x] v0.1 — Faithfulness, Answer Relevancy, Ollama adapter
- [ ] v0.2 — Context Precision, Context Recall, LangChain + OpenAI adapters
- [ ] v1.0 — Native LangFuse score-push integration, full docs site, stable API

CLI, HTML/CSV report exporters, and dashboards are deliberately out of scope for v1 — the goal is to get the core metrics right first.

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) (coming with v1.0) or open an issue in the meantime.

## License

MIT © Abhisek Mishra
