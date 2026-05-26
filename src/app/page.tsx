import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Lightbulb, Rocket, Target, TrendingUp, AlertCircle, CheckCircle2, BarChart2, User } from "lucide-react";

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
      <header className="relative flex h-16 items-center justify-between border-b border-border/70 bg-background px-4 sm:px-6 md:px-12">
        <Image src="/brand/logo/logo-horizontal-dark.png" alt="FounderHQ" height={28} width={140} className="invert" />
        <Link
          href="/workspace"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open app
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 md:px-12">

        {/* Hero */}
        <section className="pb-14 pt-16 text-center md:pb-16 md:pt-28">
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl md:text-[3.25rem] md:leading-[1.08]">
            Do your homework<br className="hidden sm:block" /> before you ship.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm text-muted-foreground sm:text-base md:text-lg">
            Surface startup ideas matched to your background, validate them against real posts from Reddit, Hacker News, GitHub, and Stack Overflow, then turn the best ones into a full launch blueprint. Every score is calibrated to your goal, not a generic market average.
          </p>
          <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/workspace"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-opacity hover:opacity-90 sm:w-auto sm:py-0 sm:h-11"
            >
              Try it free
              <ArrowRight className="size-4" />
            </Link>
            <p className="text-xs text-muted-foreground">No credit card needed.</p>
          </div>
        </section>

        {/* Founder profile callout */}
        <section className="mb-12 -mt-4">
          <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card px-5 py-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Everything is calibrated to you</p>
              <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                Before you run anything, FounderHQ asks about your background: your role, skills, the communities you are part of, your goal, and how you want to make money. Everything you see after that adjusts to who you actually are.
              </p>
            </div>
          </div>
        </section>

        {/* Three modes */}
        <section className="pb-20">
          <h2 className="mb-2 text-center text-xl font-semibold tracking-tight">Three modes, one workspace</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Run them in order or jump to whichever one you need.
          </p>
          <div className="space-y-4">

            {/* Mode 1 - Discover */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Lightbulb className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Discover</p>
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">Mode 1</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    No idea yet? Tell FounderHQ your niche or leave it blank and let your profile do the work. It finds three opportunity areas based on who you are and where you have real reach, then generates a few ideas for each one. Not topics you find interesting, but markets you can actually get into. Each idea comes with a founder fit score so you can see how well it matches your skills and situation.
                  </p>

                  {/* Founder fit score preview */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                    <div className="border-b border-border/50 px-4 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Founder Fit Score</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {[
                        { label: "Skill match", value: 8 },
                        { label: "Distribution advantage", value: 9 },
                        { label: "Execution speed", value: 7 },
                        { label: "Monetization fit", value: 8 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-xs text-muted-foreground sm:w-36">{item.label}</span>
                          <div className="h-1.5 flex-1 rounded-full bg-muted/50">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${item.value * 10}%` }}
                            />
                          </div>
                          <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["3 opportunity zones", "Founder fit scores", "Brainstorm chat", "Save to idea library"].map((t) => (
                      <span key={t} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 2 - Validate */}
            <div className="rounded-2xl border border-primary/30 bg-card p-4 ring-1 ring-primary/10 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Validate</p>
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">Mode 2</span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Core feature</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Paste your idea. FounderHQ pulls up to 70 real posts from five sources and gives you a verdict and a Build Gate Score calibrated to your goal. A bootstrapper and a VC-track founder get different scores for the same idea because they are solving different problems. The report tells you exactly why yours landed where it did.
                  </p>

                  {/* Report preview */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                    <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Build Gate Score</span>
                      <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-500">GOOD</span>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold">74</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                        <span className="ml-2 text-xs text-muted-foreground">Scored for: profitable side project</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2">
                        {[
                          { label: "Monetization potential", value: 71 },
                          { label: "Ease of acquisition", value: 58 },
                          { label: "Competition intensity", value: 62 },
                          { label: "Founder viability", value: 80 },
                        ].map((s) => (
                          <div key={s.label} className="rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2">
                            <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                            <p className="mt-0.5 text-sm font-medium">{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="mt-0.5 size-3 shrink-0 text-primary" />
                          <p className="text-xs text-muted-foreground">Multiple users mention paying $30-50/mo for tools that only partially solve this. <span className="text-primary/70">[WTP]</span></p>
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
                    {["5 verdict levels", "4 probability scores", "Paying-customer signals", "Don't-build warnings", "Follow-up chat"].map((t) => (
                      <span key={t} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 3 - Launch Plan */}
            <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Rocket className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Launch Plan</p>
                    <span className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">Mode 3</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Your idea scored well. Now what? Pick how ambitious you want to go and FounderHQ builds the full plan. MVP scope, competitor breakdowns, a 30-day roadmap, financial projections, and an 800-word spec you can paste directly into Lovable, v0, or Cursor to start building today. It also writes your Reddit launch post, cold outreach script, and landing page copy. Not templates you fill in yourself.
                  </p>

                  {/* Goal tiers */}
                  <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/60">
                    <div className="border-b border-border/50 px-4 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Goal tiers</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {[
                        { label: "Fun project", sub: "Ship fast, learn, low commercial pressure" },
                        { label: "Profitable side project", sub: "Revenue-first, bootstrapper assumptions, $1-5K MRR path" },
                        { label: "Bootstrapped business", sub: "Full 12-month plan with cash flow depth" },
                        { label: "Funded startup", sub: "Investor-grade: TAM/SAM/SOM, unit economics, raise strategy" },
                        { label: "Still figuring it out", sub: "Maps your options honestly before you commit" },
                      ].map((tier) => (
                        <div key={tier.label} className="flex items-start gap-3 px-4 py-2.5">
                          <BarChart2 className="mt-0.5 size-3 shrink-0 text-primary/50" />
                          <div>
                            <span className="text-xs font-medium">{tier.label}</span>
                            <span className="mx-1.5 text-muted-foreground/40 text-xs">·</span>
                            <span className="text-xs text-muted-foreground">{tier.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["MVP definition", "Competitor analysis", "30-day roadmap", "800-word Lovable / v0 / Cursor prompt", "Reddit + outreach drafts", "Financial projections"].map((t) => (
                      <span key={t} className="rounded-full border border-border/40 bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Data sources */}
        <section className="pb-20">
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-5 sm:px-6">
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
            <p className="mt-3 text-xs text-muted-foreground">Up to 70 posts per run, all deduplicated. Every report shows which sources returned results and exactly how many came from each one.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-20 rounded-2xl border border-border/70 bg-card px-5 py-10 text-center sm:px-8 sm:py-12">
          <h2 className="text-xl font-semibold tracking-tight">Build something people actually want.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Most founders find out their idea was wrong after building it. FounderHQ shows you the evidence first.
          </p>
          <Link
            href="/workspace"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto sm:py-0 sm:h-10"
          >
            Open FounderHQ
            <ArrowRight className="size-4" />
          </Link>
        </section>

      </div>

      <footer className="border-t border-border/70 px-4 py-5 text-center text-xs text-muted-foreground">
        FounderHQ. Do your homework before you ship.
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
