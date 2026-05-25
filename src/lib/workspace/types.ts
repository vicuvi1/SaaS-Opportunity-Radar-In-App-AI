import type { IdeaReport } from "@/lib/schemas/idea-report";
import type { IdeaDiscovery } from "@/lib/schemas/idea-discovery";

export type ForgeThread = {
  id: string;
  title: string;
  updatedAt: number;
  topic: string;
  founderProfile: string;
  pastedSignals: string;
  favorite?: boolean;
  report?: IdeaReport | null;
  discoveryResult?: IdeaDiscovery | null;
};
