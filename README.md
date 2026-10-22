# pm-os

A PM's own working documents (PRDs, OKRs, personas, trackers) end up scattered across Notion, Linear, Miro and Google Docs; pm-os gives one PM a single local-first workspace of 82 modules, where a model writes the first draft.

**Live demo: [pm-os-nine.vercel.app](https://pm-os-nine.vercel.app)** (no provider key is configured there, so Generate and Analyze need a local run with your own key)

![pm-os home, a PRD draft, the backlog tracker and provider settings, with fictional data](docs/demo.gif)

> [!NOTE]
> **Tested: 10 of the 82 modules.** Each wrote a document from a made-up input. A fixed scoring checklist graded each one, and another AI checked the figures.
>
> | What was measured                                                                                  | Before fixes | After two prompt fixes |
> | -------------------------------------------------------------------------------------------------- | ------------ | ---------------------- |
> | Figures stated as fact that were neither in the input nor labelled as an assumption                | 28           | **2**                  |
> | Modules with no such figure                                                                        | 2 / 10       | **8 / 10**             |
> | Documents over the 4,000-token length limit (measured through the CLI; the app would cut them off) | 7 / 10       | **0 / 10**             |
> | Modules with every required section (checked by hand)                                              | 10 / 10      | **10 / 10**            |
>
> Limits: I fixed the prompts while looking at these same 10 inputs. The tests ran through the Claude Code CLI, not the live app's API path, and each round ran once. How it was tested, and every miss: [EVALS.md](EVALS.md).

## Why AI here, why code there

| Step                                                                                         | Done by                             | Why                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Drafting a PRD, OKR set, persona or other document from your inputs, and analyzing a tracker | The model, on your own provider key | Turning rough notes into a structured first draft is the part a model is good at. 81 of the 82 modules have a prompt. |
| Forms, trackers, canvases, storage, export and the knowledge base                            | Code                                | Your data should behave the same every time and never leave the browser unless you click Generate or Analyze.         |
| Which provider runs, and where the key lives                                                 | Code (server-side `/api/ai` route)  | Keys stay in env vars, never in the browser bundle.                                                                   |

The model writes first drafts for you to edit; nothing checks them for accuracy. See [Status and limitations](docs/status.md#status-and-limitations).

## Quickstart

```bash
git clone https://github.com/avinashgaurav/pm-os.git
cd pm-os
npm install
cp .env.example .env.local
```

Edit `.env.local` and set **any one** provider key:

```bash
GROQ_API_KEY=gsk_...           # free tier: https://console.groq.com/keys
OPENAI_API_KEY=sk-...          # https://platform.openai.com/api-keys
ANTHROPIC_API_KEY=sk-ant-...   # https://console.anthropic.com/settings/keys
GOOGLE_API_KEY=...             # https://aistudio.google.com/apikey
OLLAMA_URL=http://localhost:11434  # if running Ollama locally
```

Then `npm run dev`, open [http://localhost:3000](http://localhost:3000) → **Settings** → pick a provider + model. Providers without a key are greyed out.

## More

- [What it does](docs/overview.md): the 82 modules, the 10 disciplines and the frameworks behind the prompts
- [Architecture and deploy](docs/architecture.md): Next.js route, providers, IndexedDB, one-click deploy
- [Roadmap, status and privacy](docs/status.md): what is planned, known limitations, what leaves your machine
- [Evals](EVALS.md): how it was tested, the scoring checklist and every miss

---

MIT licensed, see [LICENSE](LICENSE). Built by [@avinashgaurav](https://github.com/avinashgaurav).
