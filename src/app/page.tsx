import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Lightbulb, Rocket, Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "FounderHQ | Validate Startup Ideas Before You Build",
  description:
    "FounderHQ pulls real posts from Reddit, Hacker News, GitHub, and Stack Overflow to score your startup idea against your goal. Find real demand before you write a line of code. Do your homework before you ship.",
  alternates: {
    canonical: "/",
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://founderhq.fyi";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#app`,
      name: "FounderHQ",
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      description:
        "Validate startup ideas with real demand signals from Reddit, Hacker News, GitHub, and Stack Overflow before you build anything. Get a goal-calibrated score and a full launch plan.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Startup idea validation",
        "Reddit demand signals",
        "Hacker News comment analysis",
        "GitHub issue analysis",
        "Stack Overflow research",
        "Product Hunt listing analysis",
        "Market opportunity scoring",
        "Startup idea discovery",
        "Launch plan generation",
        "Founder fit scoring",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#org`,
      name: "FounderHQ",
      url: BASE_URL,
      description:
        "FounderHQ helps founders validate startup ideas with real market signals from Reddit, Hacker News, GitHub, and Stack Overflow before building.",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "FounderHQ",
      description: "Do your homework before you ship.",
      publisher: { "@id": `${BASE_URL}/#org` },
    },
  ],
};

export default function Home() {
  return (
    <div className="noise-overlay relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">

      {/* Nav */}
      <header className="relative flex h-16 items-center justify-between border-b border-border/70 bg-background px-6 md:px-12">
        <Image src="/brand/logo/logo-horizontal-dark.png" alt="FounderHQ" height={28} width={140} className="invert" />
        <Link
          href="/workspace"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open app
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <div className="relative mx-auto max-w-3xl px-6 md:px-12">

        {/* Hero */}
        <section className="pb-16 pt-20 text-center md:pt-28">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-[3.25rem]">
            Know if your idea has legs<br />before you build it.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            FounderHQ pulls real posts from Reddit, Hacker News, GitHub, and Stack Overflow and scores your idea based on your actual goal. Side project, funded startup, or just learning.
          </p>
          <div className="mt-8">
            <Link
              href="/workspace"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              Try it free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Three modes */}
        <section className="pb-20">
          <h2 className="mb-2 text-center text-xl font-semibold tracking-tight">Three modes, one workspace</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Run them in order or jump to whichever one you need.
          </p>
          <div className="space-y-4">

            {/* Mode 1 */}
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Lightbulb className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Discover</p>
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">Mode 1</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    No idea yet? Tell FounderHQ your background, what you have built before, and what you are trying to do. It finds startup opportunities that match who you actually are, not just topics you find interesting. Each idea gets scored on whether you can reach customers and whether it fits your goal. Save the ones worth a second look.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["Opportunity map", "Founder fit scores", "Brainstorm chat", "Save ideas"].map((t) => (
                      <span key={t} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 2 */}
            <div className="rounded-2xl border border-primary/30 bg-card p-6 ring-1 ring-primary/10">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Validate</p>
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">Mode 2</span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Core feature</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Paste your idea. FounderHQ fetches up to 70 real posts from Reddit, HN, GitHub, Stack Overflow, and Product Hunt, then scores it based on your goal. A side project founder and a VC-track founder get different scores for the same idea. The report tells you exactly why.
                  </p>

                  {/* Mini report preview */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                    <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Build Gate Score</span>
                      <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-500">GOOD</span>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold">74</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">Scored for: profitable side project</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="mt-0.5 size-3 shrink-0 text-primary" />
                          <p className="text-xs text-muted-foreground">Multiple users mention paying $30-50/mo for tools that only partially solve this.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                          <p className="text-xs text-muted-foreground">41 posts pulled: Reddit (22), HN (9), GitHub (7), Stack Overflow (3)</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                          <p className="text-xs text-muted-foreground">2 incumbents with strong distribution. You need a narrower wedge to get in.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["Real snippets, sourced", "Goal-calibrated score", "Don't-build warnings", "Follow-up chat"].map((t) => (
                      <span key={t} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 3 */}
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Rocket className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Launch Plan</p>
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">Mode 3</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Your idea scored well. Now what? Finisher builds the full plan: MVP scope, pricing, GTM steps, and real competitor breakdowns with actual URLs. It also writes your Lovable, v0, and Cursor prompts, a Reddit launch post, a cold outreach script, and landing page copy. Not templates you fill in yourself.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["MVP definition", "Competitor analysis", "30-day roadmap", "Lovable / v0 / Cursor prompts", "Reddit + outreach drafts"].map((t) => (
                      <span key={t} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Data sources */}
        <section className="pb-20">
          <div className="rounded-2xl border border-border/70 bg-card px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">Where the evidence comes from</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { name: "Reddit", detail: "posts & comments" },
                { name: "Hacker News", detail: "comments" },
                { name: "GitHub", detail: "open issues" },
                { name: "Stack Overflow", detail: "questions & answers" },
                { name: "Product Hunt", detail: "listings & reviews" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary/50" />
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.detail}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Up to 70 posts pulled per run, deduplicated. Every report shows you which sources were searched and the exact post count from each one.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-20 rounded-2xl border border-border/70 bg-card px-8 py-12 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Build something people actually want.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Most founders find out their idea was wrong after building it. FounderHQ shows you the evidence first.
          </p>
          <Link
            href="/workspace"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open FounderHQ
            <ArrowRight className="size-4" />
          </Link>
        </section>

      </div>

      <footer className="border-t border-border/70 px-6 py-5 text-center text-xs text-muted-foreground">
        FounderHQ. Do your homework before you ship.
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
