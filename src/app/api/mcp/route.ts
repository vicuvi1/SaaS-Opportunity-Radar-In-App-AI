import { NextResponse } from "next/server";
import { opportunityStore } from "@/lib/opportunities/store";
import { adapterRegistry } from "@/lib/research/adapters/registry";
import { runDeepResearch } from "@/lib/research/deep-research";
import { resolveOpenRouterModel } from "@/lib/ai/openrouter";
import { generateObject } from "ai";
import { z } from "zod";

const MCP_TOOLS = [
  {
    name: "search_signals",
    description: "Search across real-world multi-source intelligence adapters (Reddit, Hacker News, GitHub, Product Hunt, Web) for business pain signals, complaints, and competitor mentions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or topic, e.g. 'inventory management pain points'" },
        limit: { type: "number", description: "Maximum signals to return (default 10)" },
        industry: { type: "string", description: "Optional industry filter" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_opportunities",
    description: "List tracked SaaS opportunities from the local SQLite database with optional status or industry filtering.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status (NEW, REVIEW, DEEP_RESEARCH, SHORTLIST, REJECTED, ARCHIVED)" },
        industry: { type: "string", description: "Filter by industry taxonomy" },
        search: { type: "string", description: "Search query across titles and problems" },
      },
    },
  },
  {
    name: "get_opportunity",
    description: "Fetch full structured intelligence profile of a specific opportunity by ID, including evidence claims, competitors, and scoring.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Opportunity ID (e.g. 'opp-001')" },
      },
      required: ["id"],
    },
  },
  {
    name: "run_deep_research",
    description: "Execute full 13-pass deep research investigation on an opportunity with live multi-source signals and devil's advocate audit.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Opportunity ID to research" },
        vaultPath: { type: "string", description: "Optional Obsidian vault path for export" },
      },
      required: ["id"],
    },
  },
  {
    name: "verify_claim",
    description: "Verify a factual claim or hypothesis against live web and community signals, grading it as FACT, SOURCE-BASED CLAIM, INFERENCE, or HYPOTHESIS.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Opportunity ID" },
        claim: { type: "string", description: "Specific claim or hypothesis to verify" },
      },
      required: ["id", "claim"],
    },
  },
];

export async function GET() {
  return NextResponse.json({
    jsonrpc: "2.0",
    server: "saas-opportunity-radar",
    version: "2.0.0",
    protocol: "mcp",
    toolsCount: MCP_TOOLS.length,
    status: "active",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, method, params } = body;

    // Standard MCP / JSON-RPC Handlers
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: {
            name: "saas-opportunity-radar",
            version: "2.0.0",
          },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      switch (toolName) {
        case "search_signals": {
          const query = args.query;
          const limit = args.limit || 10;
          const { signals, successfulSources, failedSources } =
            await adapterRegistry.searchAllSources(query, { limit, industry: args.industry });

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    count: signals.length,
                    successfulSources,
                    failedSources,
                    signals: signals.slice(0, limit).map((s) => ({
                      id: s.id,
                      source: s.sourceType,
                      title: s.title,
                      url: s.url,
                      content: s.content.slice(0, 300),
                      painSignals: s.painSignals,
                      competitors: s.competitorSignals,
                    })),
                  }),
                },
              ],
            },
          });
        }

        case "list_opportunities": {
          const list = await opportunityStore.list({
            status: args.status,
            industry: args.industry,
            search: args.search,
          });

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    list.map((o) => ({
                      id: o.id,
                      title: o.title,
                      industry: o.industry,
                      status: o.status,
                      researchScore: o.researchScore,
                      marketCrowdedness: o.marketCrowdedness,
                      targetCustomer: o.targetCustomer,
                      problem: o.problem.slice(0, 150),
                    })),
                  ),
                },
              ],
            },
          });
        }

        case "get_opportunity": {
          const opp = await opportunityStore.get(args.id);
          if (!opp) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: `Opportunity "${args.id}" not found` },
            });
          }

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(opp),
                },
              ],
            },
          });
        }

        case "run_deep_research": {
          const result = await runDeepResearch(args.id, args.vaultPath);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    opportunityId: result.opportunity.id,
                    score: result.research.synthesis.overallViabilityScore,
                    recommendation: result.research.synthesis.aiRecommendation,
                    reportPath: result.reportPath,
                    reportSnippet: result.reportMarkdown.slice(0, 500) + "...",
                  }),
                },
              ],
            },
          });
        }

        case "verify_claim": {
          const opp = await opportunityStore.get(args.id);
          if (!opp) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: `Opportunity "${args.id}" not found` },
            });
          }

          const { signals } = await adapterRegistry.searchAllSources(
            `${args.claim} ${opp.industry} ${opp.title}`.slice(0, 150),
            { limit: 5 },
          );

          const { model } = resolveOpenRouterModel("FAST");
          const { object: verifyRes } = await generateObject({
            model,
            schema: z.object({
              status: z.enum(["VERIFIED", "PARTIALLY_VERIFIED", "REFUTED", "UNVERIFIABLE"]),
              grading: z.enum(["FACT", "SOURCE-BASED CLAIM", "INFERENCE", "HYPOTHESIS", "UNKNOWN"]),
              confidenceScore: z.number(),
              explanation: z.string(),
            }),
            prompt: `Fact-check claim: "${args.claim}" for opportunity "${opp.title}". Sources context: ${signals.map((s) => s.content).join("\n")}`,
          });

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    claim: args.claim,
                    verification: verifyRes,
                    sourcesFoundCount: signals.length,
                  }),
                },
              ],
            },
          });
        }

        default:
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found or tool '${toolName}' unsupported` },
          });
      }
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method '${method}' not recognized` },
    });
  } catch (err: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: err.message || "Internal server error" } },
      { status: 500 },
    );
  }
}
