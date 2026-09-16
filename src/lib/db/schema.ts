import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ── Opportunities Table ───────────────────────────────────────────────────────
export const opportunitiesTable = sqliteTable("opportunities", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  problem: text("problem").notNull().default(""),
  targetCustomer: text("target_customer").notNull().default(""),
  industry: text("industry").notNull().default(""),
  currentWorkflow: text("current_workflow").default(""),
  currentSolutions: text("current_solutions").default(""),
  whyInteresting: text("why_interesting").default(""),
  whyTheProblemMatters: text("why_the_problem_matters").default(""),
  economicImpact: text("economic_impact").default(""),
  marketSize: text("market_size").default(""),
  marketGap: text("market_gap").default(""),
  aiOpportunity: text("ai_opportunity").default(""),
  aiFit: text("ai_fit").default("MEDIUM"),

  // AI Priority & Scoring
  aiPriority: text("ai_priority").notNull().default("MEDIUM_POTENTIAL"),
  aiPriorityReasons: text("ai_priority_reasons").default("[]"), // JSON string array
  whyThisOpportunity: text("why_this_opportunity").default("[]"), // JSON string array
  aiConfidence: text("ai_confidence").notNull().default("MEDIUM"),
  researchScore: integer("research_score").notNull().default(50),
  researchScoreFactors: text("research_score_factors").default("{}"), // JSON object
  evidenceStrength: text("evidence_strength").notNull().default("MEDIUM"),
  researchRunId: text("research_run_id"),

  // Independent Human Decision Gate
  myDecision: text("my_decision").notNull().default("UNDECIDED"),
  nextAction: text("next_action").default(""),
  myThoughts: text("my_thoughts").default(""),

  // MVP & Blueprint
  mvpFeatures: text("mvp_features").default("[]"), // JSON string array
  excludedFeatures: text("excluded_features").default("[]"), // JSON string array
  monetizationModel: text("monetization_model").default(""),
  pricingIdea: text("pricing_idea").default(""),
  distributionChannels: text("distribution_channels").default("[]"), // JSON string array
  executionRisks: text("execution_risks").default("[]"), // JSON array

  // Nested Details
  validation: text("validation").default("{}"), // JSON object
  competitors: text("competitors").default("[]"), // JSON array
  sources: text("sources").default("[]"), // JSON array

  // Market Crowdedness & 13-Pass Deep Research Intelligence
  marketCrowdedness: text("market_crowdedness").default("MEDIUM"),
  marketCrowdednessScore: integer("market_crowdedness_score").default(50),
  whyItCouldWork: text("why_it_could_work").default("[]"), // JSON string array
  whyItMightNotWork: text("why_it_might_not_work").default("[]"), // JSON string array
  whatWeStillDontKnow: text("what_we_still_dont_know").default("[]"), // JSON string array
  nextValidationSteps: text("next_validation_steps").default("[]"), // JSON string array
  lastDeepResearchAt: text("last_deep_research_at"),

  // Workflow & Classification
  status: text("status").notNull().default("NEW"),
  isNewDiscovery: integer("is_new_discovery").notNull().default(1), // 1 = in New Discoveries Inbox
  isUserGenerated: integer("is_user_generated").notNull().default(0),
  createdBy: text("created_by").notNull().default("AI"),
  source: text("source").notNull().default("Discovery"),
  favorite: integer("favorite").notNull().default(0),
  saved: integer("saved").notNull().default(0),
  tags: text("tags").default("[]"), // JSON string array

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Opportunity Notes Table ───────────────────────────────────────────────────
export const opportunityNotesTable = sqliteTable("opportunity_notes", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

// ── Opportunity Sources Table ─────────────────────────────────────────────────
export const opportunitySourcesTable = sqliteTable("opportunity_sources", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull(),
  title: text("title").default(""),
  url: text("url").default(""),
  sourceType: text("source_type").default(""),
  date: text("date").default(""),
  summary: text("summary").default(""),
  claimSupported: text("claim_supported").default(""),
  createdAt: text("created_at").notNull(),
});

// ── Research Runs Table ───────────────────────────────────────────────────────
export const researchRunsTable = sqliteTable("research_runs", {
  id: text("id").primaryKey(),
  configId: text("config_id"),
  mode: text("mode").notNull(), // 'quick' | 'deep' | 'daily'
  topic: text("topic").notNull(),
  field: text("field").default(""),
  status: text("status").notNull().default("completed"), // 'running' | 'completed' | 'failed'
  summary: text("summary").default(""),
  qualityThreshold: integer("quality_threshold").notNull().default(60),
  requestedCount: integer("requested_count").notNull().default(10),
  createdCount: integer("created_count").notNull().default(0),
  sourcesUsed: text("sources_used").default("[]"), // JSON string array
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// ── Research Configs Table ────────────────────────────────────────────────────
export const researchConfigsTable = sqliteTable("research_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  field: text("field").notNull(),
  customField: text("custom_field").default(""),
  targetIdeaCount: integer("target_idea_count").notNull().default(10),
  scheduleTime: text("schedule_time").notNull().default("18:00"),
  timezone: text("timezone").notNull().default("Europe/Chisinau"),
  frequency: text("frequency").notNull().default("daily"), // 'daily' | 'weekly' | 'custom'
  depth: text("depth").notNull().default("quick"), // 'quick' | 'deep'
  sources: text("sources").default("[\"reddit\",\"hackernews\",\"github\",\"producthunt\",\"stackoverflow\"]"),
  aiMode: text("ai_mode").notNull().default("FREE_ONLY"), // 'FREE_ONLY' | 'FREE_FIRST' | 'BALANCED' | 'CUSTOM'
  minQualityThreshold: integer("min_quality_threshold").notNull().default(60),
  enabled: integer("enabled").notNull().default(1),
  lastRunAt: text("last_run_at"),
  createdAt: text("created_at").notNull(),
});

// ── Research Sources (Raw Scraped Signals) ─────────────────────────────────────
export const researchSourcesTable = sqliteTable("research_sources", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  source: text("source").notNull(),
  title: text("title").default(""),
  url: text("url").default(""),
  snippet: text("snippet").default(""),
  score: integer("score").default(0),
  fetchedAt: text("fetched_at").notNull(),
});

// ── AI Conversations Table ───────────────────────────────────────────────────
export const aiConversationsTable = sqliteTable("ai_conversations", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("New Conversation"),
  scope: text("scope").notNull().default("GLOBAL"),
  targetOpportunityId: text("target_opportunity_id"),
  modelUsed: text("model_used").default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── AI Messages Table ────────────────────────────────────────────────────────
export const aiMessagesTable = sqliteTable("ai_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  modelUsed: text("model_used").default(""),
  contextData: text("context_data").default("{}"), // JSON string
  createdAt: text("created_at").notNull(),
});

// ── Integrations Table ───────────────────────────────────────────────────────
export const integrationsTable = sqliteTable("integrations", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull().unique(),
  status: text("status").notNull().default("NOT_CONNECTED"),
  category: text("category").notNull().default("signal"),
  accountName: text("account_name"),
  accountMetadata: text("account_metadata").default("{}"), // JSON string
  encryptedCredentials: text("encrypted_credentials"), // AES-256-GCM ciphertext
  lastTestedAt: text("last_tested_at"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Model Configs Table ──────────────────────────────────────────────────────
export const modelConfigsTable = sqliteTable("model_configs", {
  id: text("id").primaryKey().default("default"),
  preset: text("preset").notNull().default("BALANCED"),
  roles: text("roles").notNull().default("{}"), // JSON string
  updatedAt: text("updated_at").notNull(),
});

// ── Telegram Messages Table ──────────────────────────────────────────────────
export const telegramMessagesTable = sqliteTable("telegram_messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  messageText: text("message_text").notNull(),
  opportunityIds: text("opportunity_ids").default("[]"), // JSON string array
  status: text("status").notNull().default("sent"),
  sentAt: text("sent_at").notNull(),
});

// ── Validation Records Table ─────────────────────────────────────────────────
export const validationRecordsTable = sqliteTable("validation_records", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull().unique(),
  interviewsCount: integer("interviews_count").notNull().default(0),
  interestedCustomersCount: integer("interested_customers_count").notNull().default(0),
  waitlistCount: integer("waitlist_count").notNull().default(0),
  assumptions: text("assumptions").default("[]"), // JSON string
  risks: text("risks").default("[]"), // JSON string
  validationQuestions: text("validation_questions").default("[]"), // JSON string
  updatedAt: text("updated_at").notNull(),
});
