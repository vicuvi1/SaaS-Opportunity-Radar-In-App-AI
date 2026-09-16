import crypto from "crypto";

const PAIN_PATTERNS = [
  /i wish there was/i,
  /why isn't there an? (app|tool|service|software)/i,
  /alternative to/i,
  /too expensive/i,
  /wasting hours on/i,
  /manual(ly)? (copying|pasting|entering|tracking)/i,
  /nightmare to/i,
  /hate using/i,
  /frustrated with/i,
  /broken integration/i,
  /clunky (ui|ux|software)/i,
  /can anyone recommend/i,
  /looking for a tool that/i,
  /missing feature/i,
  /can't figure out how to/i,
];

const COMMERCIAL_PATTERNS = [
  /\$\d+(\/mo|\/month|\/yr|\/year|\/seat)?/i,
  /pricing/i,
  /cost(s)?/i,
  /budget/i,
  /willing to pay/i,
  /gladly pay/i,
  /subscription/i,
  /corporate card/i,
  /enterprise tier/i,
  /expensive/i,
  /cheap(er)?/i,
];

const KNOWN_COMPETITORS = [
  "Salesforce", "HubSpot", "Zendesk", "Jira", "Notion", "Airtable", "Linear",
  "ClickUp", "Slack", "Asana", "Monday", "Intercom", "Stripe", "Paddle", "Shopify",
  "QuickBooks", "Xero", "Workday", "NetSuite", "Datadog", "PagerDuty", "Snowflake",
  "DocuSign", "Figma", "Canva", "Postman", "Zapier", "Make", "Retool", "Loopio",
  "OneTrust", "Whistic", "BlackLine", "Medallion", "Shipyard", "Bunnyshell"
];

export function computeSignalHash(sourceType: string, url: string, content: string): string {
  const norm = `${sourceType}:${url}:${content.slice(0, 300).trim().toLowerCase()}`;
  return crypto.createHash("sha256").update(norm).digest("hex");
}

export function extractPainSignals(text: string): string[] {
  const signals: string[] = [];
  for (const p of PAIN_PATTERNS) {
    const match = text.match(p);
    if (match) {
      signals.push(match[0].toLowerCase());
    }
  }
  return Array.from(new Set(signals));
}

export function extractCommercialSignals(text: string): string[] {
  const signals: string[] = [];
  for (const c of COMMERCIAL_PATTERNS) {
    const match = text.match(c);
    if (match) {
      signals.push(match[0].toLowerCase());
    }
  }
  return Array.from(new Set(signals));
}

export function extractCompetitorSignals(text: string): string[] {
  const found: string[] = [];
  for (const comp of KNOWN_COMPETITORS) {
    const regex = new RegExp(`\\b${comp}\\b`, "i");
    if (regex.test(text)) {
      found.push(comp);
    }
  }
  return found;
}

export function cleanText(input: string, maxLen = 3000): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}
