import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { opportunityStore } from "@/lib/opportunities/store";
import { adapterRegistry } from "@/lib/research/adapters/registry";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { db } from "@/lib/db";
import { opportunitySourcesTable } from "@/lib/db/schema";
import type { EvidenceGrading } from "@/lib/opportunities/types";

const verifySchema = z.object({
  status: z.enum(["VERIFIED", "PARTIALLY_VERIFIED", "REFUTED", "UNVERIFIABLE"]),
  grading: z.enum([
    "FACT",
    "SOURCE-BASED CLAIM",
    "INFERENCE",
    "HYPOTHESIS",
    "UNKNOWN",
  ]),
  confidenceScore: z.number().min(0).max(100),
  supportingEvidence: z.array(z.string()),
  contradictingEvidence: z.array(z.string()),
  explanation: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const claim = body?.claim;

    if (!claim || typeof claim !== "string" || claim.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid 'claim' string is required" },
        { status: 400 },
      );
    }

    const opp = await opportunityStore.get(id);
    if (!opp) {
      return NextResponse.json(
        { error: `Opportunity with ID "${id}" not found` },
        { status: 404 },
      );
    }

    console.log(`[verify-claim] Verifying claim for opp "${opp.title}": "${claim}"`);

    // 1. Search live research adapters for evidence regarding this claim
    const searchQuery = `${claim} ${opp.industry} ${opp.title}`.slice(0, 150);
    const { signals } = await adapterRegistry.searchAllSources(searchQuery, {
      limit: 6,
    });

    const gatheredContext = signals.length > 0
      ? signals
          .map(
            (s, i) =>
              `[Source ${i + 1}] (${s.sourceType.toUpperCase()} - ${s.sourceName}) ${s.title}\nURL: ${s.url}\nExcerpt: ${s.content.slice(0, 300)}`,
          )
          .join("\n\n")
      : "No live web/community sources returned for this specific search.";

    // 2. Evaluate using OpenRouter FAST model
    const { model, modelName } = resolveOpenRouterModel("FAST");

    const prompt = `You are an objective, forensic fact-checker and market research auditor.
Evaluate the validity of the following claim regarding the opportunity "${opp.title}" (Industry: ${opp.industry}):

CLAIM TO VERIFY:
"${claim}"

GATHERED INDEPENDENT SIGNALS:
${gatheredContext}

OPPORTUNITY PROBLEM CONTEXT:
${opp.problem}

Evaluate this claim rigorously:
- Determine if it is VERIFIED (supported by evidence), PARTIALLY_VERIFIED, REFUTED (contradicted by evidence), or UNVERIFIABLE (no conclusive data).
- Assign an evidence grading: FACT, SOURCE-BASED CLAIM, INFERENCE, HYPOTHESIS, or UNKNOWN.
- Provide supporting points, contradicting points, and an objective confidence score (0-100).
- Explain your reasoning neutrally without hype.`;

    const { object: verification } = await generateObject({
      model,
      schema: verifySchema,
      prompt,
      temperature: 0.1,
    });

    // 3. If any relevant sources were found, persist them into opportunity sources
    const newSources = signals.slice(0, 3).map((s, idx) => ({
      id: `verify-src-${Date.now().toString(36)}-${idx}`,
      title: `[Verified] ${s.title.slice(0, 60)}`,
      url: s.url,
      sourceType: s.sourceType,
      date: new Date().toISOString().slice(0, 10),
      summary: s.content.slice(0, 200),
      evidenceRelevance: `Verification for: "${claim.slice(0, 40)}..."`,
      grading: verification.grading as EvidenceGrading,
    }));

    if (newSources.length > 0) {
      const mergedSources = [...(opp.sources || []), ...newSources];
      await opportunityStore.update(opp.id, { sources: mergedSources });

      try {
        for (const ns of newSources) {
          db.insert(opportunitySourcesTable)
            .values({
              id: ns.id,
              opportunityId: opp.id,
              title: ns.title,
              url: ns.url,
              sourceType: ns.sourceType,
              date: ns.date,
              summary: ns.summary,
              claimSupported: claim,
              createdAt: new Date().toISOString(),
            })
            .run();
        }
      } catch (dbErr) {
        console.warn("[verify-claim] Notice saving to opportunitySourcesTable:", dbErr);
      }
    }

    return NextResponse.json({
      claim,
      verification,
      modelUsed: modelName,
      sourcesFound: signals.map((s) => ({
        id: s.id,
        sourceType: s.sourceType,
        sourceName: s.sourceName,
        title: s.title,
        url: s.url,
        snippet: s.content.slice(0, 180),
      })),
    });
  } catch (err) {
    console.error("[api/verify-claim] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to verify claim" },
      { status: 500 },
    );
  }
}
