import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "startup-radar.db");

function ensureDirectoryExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Global singleton to prevent multiple connections in Next.js hot reload
const globalForDb = globalThis as unknown as {
  sqliteInstance?: Database.Database;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
  initialized?: boolean;
};

function getOrCreateDatabase() {
  if (!globalForDb.sqliteInstance) {
    ensureDirectoryExists();
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    globalForDb.sqliteInstance = sqlite;
    globalForDb.drizzleDb = drizzle(sqlite, { schema });
  }

  if (!globalForDb.initialized) {
    initializeTables(globalForDb.sqliteInstance);
    seedInitialOpportunitiesIfEmpty(globalForDb.sqliteInstance);
    globalForDb.initialized = true;
  }

  return globalForDb.drizzleDb!;
}

function initializeTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      problem TEXT NOT NULL DEFAULT '',
      target_customer TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT '',
      current_workflow TEXT DEFAULT '',
      current_solutions TEXT DEFAULT '',
      why_interesting TEXT DEFAULT '',
      why_the_problem_matters TEXT DEFAULT '',
      economic_impact TEXT DEFAULT '',
      market_size TEXT DEFAULT '',
      market_gap TEXT DEFAULT '',
      ai_opportunity TEXT DEFAULT '',
      ai_fit TEXT DEFAULT 'MEDIUM',
      ai_priority TEXT NOT NULL DEFAULT 'MEDIUM_POTENTIAL',
      ai_priority_reasons TEXT DEFAULT '[]',
      why_this_opportunity TEXT DEFAULT '[]',
      ai_confidence TEXT NOT NULL DEFAULT 'MEDIUM',
      research_score INTEGER NOT NULL DEFAULT 50,
      research_score_factors TEXT DEFAULT '{}',
      evidence_strength TEXT NOT NULL DEFAULT 'MEDIUM',
      research_run_id TEXT,
      my_decision TEXT NOT NULL DEFAULT 'UNDECIDED',
      next_action TEXT DEFAULT '',
      my_thoughts TEXT DEFAULT '',
      mvp_features TEXT DEFAULT '[]',
      excluded_features TEXT DEFAULT '[]',
      monetization_model TEXT DEFAULT '',
      pricing_idea TEXT DEFAULT '',
      distribution_channels TEXT DEFAULT '[]',
      execution_risks TEXT DEFAULT '[]',
      validation TEXT DEFAULT '{}',
      competitors TEXT DEFAULT '[]',
      sources TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'NEW',
      is_new_discovery INTEGER NOT NULL DEFAULT 1,
      is_user_generated INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'AI',
      source TEXT NOT NULL DEFAULT 'Discovery',
      favorite INTEGER NOT NULL DEFAULT 0,
      saved INTEGER NOT NULL DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunity_notes (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunity_sources (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      title TEXT DEFAULT '',
      url TEXT DEFAULT '',
      source_type TEXT DEFAULT '',
      date TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      claim_supported TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_runs (
      id TEXT PRIMARY KEY,
      config_id TEXT,
      mode TEXT NOT NULL,
      topic TEXT NOT NULL,
      field TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'completed',
      summary TEXT DEFAULT '',
      quality_threshold INTEGER NOT NULL DEFAULT 60,
      requested_count INTEGER NOT NULL DEFAULT 10,
      created_count INTEGER NOT NULL DEFAULT 0,
      sources_used TEXT DEFAULT '[]',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      field TEXT NOT NULL,
      custom_field TEXT DEFAULT '',
      target_idea_count INTEGER NOT NULL DEFAULT 10,
      schedule_time TEXT NOT NULL DEFAULT '18:00',
      timezone TEXT NOT NULL DEFAULT 'Europe/Chisinau',
      frequency TEXT NOT NULL DEFAULT 'daily',
      depth TEXT NOT NULL DEFAULT 'quick',
      sources TEXT DEFAULT '["reddit","hackernews","github","producthunt","stackoverflow"]',
      ai_mode TEXT NOT NULL DEFAULT 'FREE_ONLY',
      min_quality_threshold INTEGER NOT NULL DEFAULT 60,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_run_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_sources (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT DEFAULT '',
      url TEXT DEFAULT '',
      snippet TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      fetched_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      scope TEXT NOT NULL DEFAULT 'GLOBAL',
      target_opportunity_id TEXT,
      model_used TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model_used TEXT DEFAULT '',
      context_data TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
      category TEXT NOT NULL DEFAULT 'signal',
      account_name TEXT,
      account_metadata TEXT DEFAULT '{}',
      encrypted_credentials TEXT,
      last_tested_at TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_configs (
      id TEXT PRIMARY KEY DEFAULT 'default',
      preset TEXT NOT NULL DEFAULT 'BALANCED',
      roles TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      opportunity_ids TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'sent',
      sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS validation_records (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL UNIQUE,
      interviews_count INTEGER NOT NULL DEFAULT 0,
      interested_customers_count INTEGER NOT NULL DEFAULT 0,
      waitlist_count INTEGER NOT NULL DEFAULT 0,
      assumptions TEXT DEFAULT '[]',
      risks TEXT DEFAULT '[]',
      validation_questions TEXT DEFAULT '[]',
      updated_at TEXT NOT NULL
    );
  `);

  // Ensure new columns exist on existing databases
  try {
    sqlite.exec("ALTER TABLE opportunities ADD COLUMN research_run_id TEXT;");
  } catch {}
  try {
    sqlite.exec("ALTER TABLE opportunities ADD COLUMN why_this_opportunity TEXT DEFAULT '[]';");
  } catch {}

  // Safe migration for workflow statuses and human decisions
  try {
    sqlite.exec(`
      UPDATE opportunities SET status = 'DEEP_RESEARCH' WHERE status = 'RESEARCHING';
      UPDATE opportunities SET status = 'REVIEW' WHERE status IN ('INTERESTING', 'VALIDATING');
      UPDATE opportunities SET status = 'SHORTLIST' WHERE status IN ('MVP', 'BUILDING', 'LAUNCHED');
      UPDATE opportunities SET my_decision = 'SHORTLISTED' WHERE my_decision = 'BUILD';
      UPDATE opportunities SET my_decision = 'REJECTED' WHERE my_decision = 'DO_NOT_BUILD';
      UPDATE opportunities SET my_decision = 'INTERESTED' WHERE my_decision = 'VALIDATING';
      UPDATE opportunities SET my_decision = 'UNDECIDED' WHERE my_decision = 'LATER';
    `);
  } catch (err) {
    console.warn("[db] Workflow migration notice:", err);
  }
}

function seedInitialOpportunitiesIfEmpty(sqlite: Database.Database) {
  const row = sqlite.prepare("SELECT COUNT(*) as count FROM opportunities").get() as { count: number };
  if (row && row.count === 0) {
    // Check if opportunities.json exists to migrate existing seed
    const legacyJsonPath = path.join(DB_DIR, "opportunities.json");
    if (fs.existsSync(legacyJsonPath)) {
      try {
        const raw = fs.readFileSync(legacyJsonPath, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const stmt = sqlite.prepare(`
            INSERT OR REPLACE INTO opportunities (
              id, title, description, problem, target_customer, industry,
              current_workflow, current_solutions, why_interesting, why_the_problem_matters,
              economic_impact, market_size, market_gap, ai_opportunity, ai_fit,
              ai_priority, ai_priority_reasons, ai_confidence, research_score, research_score_factors,
              evidence_strength, my_decision, next_action, my_thoughts, mvp_features, excluded_features,
              monetization_model, pricing_idea, distribution_channels, execution_risks, validation,
              competitors, sources, status, is_new_discovery, is_user_generated, created_by, source,
              favorite, saved, tags, created_at, updated_at
            ) VALUES (
              @id, @title, @description, @problem, @targetCustomer, @industry,
              @currentWorkflow, @currentSolutions, @whyInteresting, @whyTheProblemMatters,
              @economicImpact, @marketSize, @marketGap, @aiOpportunity, @aiFit,
              @aiPriority, @aiPriorityReasons, @aiConfidence, @researchScore, @researchScoreFactors,
              @evidenceStrength, @myDecision, @nextAction, @myThoughts, @mvpFeatures, @excludedFeatures,
              @monetizationModel, @pricingIdea, @distributionChannels, @executionRisks, @validation,
              @competitors, @sources, @status, @isNewDiscovery, @isUserGenerated, @createdBy, @source,
              @favorite, @saved, @tags, @createdAt, @updatedAt
            )
          `);

          const insertMany = sqlite.transaction((items: any[]) => {
            for (const item of items) {
              stmt.run({
                id: item.id,
                title: item.title,
                description: item.description || "",
                problem: item.problem || "",
                targetCustomer: item.targetCustomer || "",
                industry: item.industry || "",
                currentWorkflow: item.currentWorkflow || "",
                currentSolutions: item.currentSolutions || "",
                whyInteresting: item.whyInteresting || "",
                whyTheProblemMatters: item.whyTheProblemMatters || "",
                economicImpact: item.economicImpact || "",
                marketSize: item.marketSize || "",
                marketGap: item.marketGap || "",
                aiOpportunity: item.aiOpportunity || "",
                aiFit: item.aiFit || "MEDIUM",
                aiPriority: item.aiPriority || "MEDIUM_POTENTIAL",
                aiPriorityReasons: JSON.stringify(item.aiPriorityReasons || []),
                aiConfidence: item.aiConfidence || "MEDIUM",
                researchScore: item.researchScore || 50,
                researchScoreFactors: JSON.stringify(item.researchScoreFactors || {}),
                evidenceStrength: item.evidenceStrength || "MEDIUM",
                myDecision: item.myDecision || "UNDECIDED",
                nextAction: item.nextAction || "",
                myThoughts: item.myThoughts || "",
                mvpFeatures: JSON.stringify(item.mvpFeatures || []),
                excludedFeatures: JSON.stringify(item.excludedFeatures || []),
                monetizationModel: item.monetizationModel || "",
                pricingIdea: item.pricingIdea || "",
                distributionChannels: JSON.stringify(item.distributionChannels || []),
                executionRisks: JSON.stringify(item.executionRisks || []),
                validation: JSON.stringify(item.validation || {}),
                competitors: JSON.stringify(item.competitors || []),
                sources: JSON.stringify(item.sources || []),
                status: item.status || "NEW",
                isNewDiscovery: 0, // Migrated existing opportunities are in main workflow
                isUserGenerated: item.isUserGenerated ? 1 : 0,
                createdBy: item.createdBy || "AI",
                source: item.source || "Discovery",
                favorite: item.favorite ? 1 : 0,
                saved: item.saved ? 1 : 0,
                tags: JSON.stringify(item.tags || []),
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
              });
            }
          });

          insertMany(list);
          console.log(`[db] Migrated ${list.length} opportunities into local SQLite startup-radar.db`);
        }
      } catch (err) {
        console.error("[db] Error migrating opportunities.json to SQLite:", err);
      }
    }
  }
}

export const db = getOrCreateDatabase();
export { schema, DB_PATH };
