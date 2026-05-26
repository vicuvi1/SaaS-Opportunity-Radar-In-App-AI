# FounderHQ

Validate startup demand before you build. FounderHQ is a three-mode workspace that takes you from raw idea to full execution blueprint using real evidence from Reddit, Hacker News, GitHub, Stack Overflow, and Product Hunt.

---

## How it works

### Auth + onboarding

Users sign in via Supabase (email magic link or OAuth). On first login, a short onboarding captures your **Founder Profile**: role, technical level, goal (side project / funded startup / fun & learn), preferred business type, monetization preference, communities you are embedded in. This profile is used across all three modes to personalize scores and recommendations.

### Sessions

The workspace is organized into **sessions**. Each session stores a topic, the full validation report, and the chat history. Sessions persist to Supabase and appear in a collapsible left sidebar. You can search, star, and delete sessions. `Cmd/Ctrl+N` creates a new one.

---

## The three modes

### 1. Discover

**What it does:** Brainstorm and surface startup ideas personalized to you.

Two tools inside this mode:

**Generate ideas** (calls `/api/discover`)
- Optionally enter a niche, market, or constraint (e.g. "solo-buildable only, under $500 to launch"). If blank, the engine works purely from your Founder Profile.
- Claude reads your distribution access, workflow knowledge, and stated goal, then identifies 3 opportunity zones with 2-3 ideas each.
- Every idea is scored against 5 survival tests before it surfaces. Generic ideas, AI wrappers, and consumer apps without a paying customer are killed before output.
- Each idea card shows: title, one-liner, why you (specific named advantage), why now (real timing signal), monetization path, and a Founder Fit score across 4 dimensions (skill match, distribution advantage, execution speed, monetization fit, each 1-10).
- Ideas can be bookmarked and saved for later.
- Clicking "Validate" on any idea sends it to Validate mode pre-filled.

**Brainstorm chat**
- A creative AI partner (not a validator). Ask about your skills, background, or markets.
- Select a specific idea card to chat about it directly.
- 6-message cap, then prompts you to pick something and move to Validate.

---

### 2. Validate

**What it does:** Score whether an idea has real demand and is worth building, using actual internet evidence.

**Input:** Describe your idea or problem space in plain English.

**What happens on "Run analysis":**
1. Claude extracts a search query from your topic.
2. The server fetches up to 70 real posts/comments from Reddit, Hacker News, GitHub Issues, Stack Overflow, and Product Hunt in parallel.
3. A YC-style analyst prompt processes the snippets alongside your Founder Profile and produces a structured verdict.

**The report contains:**

| Field | What it is |
|---|---|
| Build Gate Score | 0-100 integer calibrated to your stated goal, not a generic market score |
| Verdict | One label: STRONG SIGNAL / GOOD / UNCLEAR / WEAK / NON-STARTER |
| Summary | 2-3 sentences on why the idea scored as it did |
| Reasons | 3-5 specific observations supporting the score |
| Don't Build Warnings | Named structural risks with severity (info / warning / critical) |
| Probability Scores | 4 dimensions scored 0-100: Monetization Potential, Ease of Acquisition, Competition Intensity, Founder Viability |
| Top Signals | 2-3 strongest observations, each marked strong/moderate/weak and whether WTP language was found |
| Weak Demand Signals | Signals that exist but are not strong enough to rely on |
| Data Retrieval Note | Which sources were searched and exact snippet counts |

**Score calibration by goal:**
- Side project: "Can a bootstrapper reach $3K-$30K/month MRR with this?"
- Funded startup: "Could this reach $10M+ ARR with a defensible moat?"
- Fun/learn: "Is this genuinely interesting and buildable?"

The same idea can score 75 for a bootstrapper and 30 for a VC-track founder. The report says so explicitly when that gap exists.

**Alongside the report:** a chat panel with a startup strategist. Challenge assumptions, ask about next steps, dig into signals. 20-message cap per session.

---

### 3. Launch Plan

**What it does:** Turn a validated idea into a full startup blueprint with everything needed to start building today.

**Gating:** If you enter Launch Plan without a validated report, a dialog warns you that the output will be based on assumptions rather than real market evidence. You can proceed anyway.

The same snippet pipeline runs again, but Claude now receives your validation report as context and switches into execution mode.

**Goal tiers** — pick the one that matches your ambition:
- **Fun project** — ship fast, learn, low commercial pressure
- **Profitable side project** — revenue-first, bootstrapper assumptions, $1-5K MRR path
- **Bootstrapped business** — full 12-month plan with cash flow depth
- **Funded startup** — investor-grade: TAM/SAM/SOM, unit economics, raise strategy
- **Still figuring it out** — maps your options honestly before you commit

**Area 1 - Strategic Blueprint**
- Positioning statement
- Target user (primary, secondary, pain context, why existing tools fail them)
- Core problem reframed as a product insight
- MVP: 3-5 features max + explicit exclusions + platform + behavior
- Wedge strategy: how to get first 100 users with specific named communities and tactics
- Monetization: one model, specific price point, rationale
- GTM steps: concrete ordered actions executable this week
- Build order: sequential developer steps to ship MVP
- Execution risks: adoption and build risks only

**Area 2 - Market Research**
- Pain clusters: real complaints merged into concrete product decisions
- Demand signals: each tied to a source, WTP language flagged explicitly

**Area 3 - Market Context**
- Problem analysis: who experiences it, how often, urgency, current workarounds
- Market reality: TAM/SAM/SOM estimates, search demand, trend momentum
- Competitors: real companies with real URLs, pricing, strengths, weaknesses, actual user complaints

**Area 4 - Execution Materials**
- Opportunity wedge: underserved audience, ignored workflow, pricing gap, UX gap, AI leverage, speed advantage
- Founder fit: honest skills match, build timeline, difficulty, technical complexity
- Build artifacts: ready-to-use prompts for Lovable, v0, and Cursor (full technical specs); DB schema; architecture; auth/payments guidance; landing copy; pricing ideas; onboarding flow; 30-day roadmap
- Validation pack: Reddit post draft, Twitter/X launch draft, landing page copy, waitlist copy, interview questions, cold outreach script, community plan

**Alongside the blueprint:** a cofounder-mode chat. Adjust scope, go deeper on any section, request changes. 20-message cap.

---

## Data sources

Fetched in parallel for each validation or launch plan run:

- **Reddit** - posts and comments
- **Hacker News** - comments (Algolia API)
- **GitHub Issues** - open issues
- **Stack Overflow** - questions and answers
- **Product Hunt** - listings and reviews

Up to 70 deduplicated snippets per run. Sources returning zero results are logged and flagged in the report's `dataRetrievalNote`.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** - auth, database (sessions, messages, saved ideas, founder profiles)
- **Anthropic Claude** (claude-sonnet-4-6) - validation and discovery via Vercel AI SDK
- **OpenAI** (gpt-5.4) - launch plan generation (large schema output)
- **Vercel AI SDK** - streaming objects (`useObject`) and chat (`useChat`)
- **Zod** - schema validation for all AI outputs
- **Tailwind CSS v4** + shadcn/ui

---

## Environment variables

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

**Optional:**
```
NEXT_PUBLIC_URL=                  # your deployed domain (defaults to https://founderhq.fyi)
GITHUB_TOKEN=                     # raises GitHub API rate limits
STACK_APPS_KEY=                   # raises Stack Exchange API quota
SUPABASE_SERVICE_ROLE_KEY=        # required for account deletion endpoint
FOUNDERHQ_LLM_PROVIDER=           # anthropic|openai — overrides the chat model provider
FOUNDERHQ_ANTHROPIC_MODEL=        # override Anthropic model ID
FOUNDERHQ_OPENAI_MODEL=           # override OpenAI model ID
```

---

## Running locally

```bash
npm install
npm run dev
```
