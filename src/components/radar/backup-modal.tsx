"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, FileCode, FolderSync, CheckCircle2, AlertTriangle } from "lucide-react";

interface BackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupModal({ open, onOpenChange }: BackupModalProps) {
  const [vaultPath, setVaultPath] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleDownloadDb = () => {
    window.location.href = "/api/backup?type=db";
  };

  const handleDownloadJson = () => {
    window.location.href = "/api/backup?type=json";
  };

  const handleSyncObsidian = async () => {
    if (!vaultPath.trim()) {
      setSyncError("Please enter an absolute Obsidian vault directory path");
      return;
    }
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const res = await fetch("/api/opportunities/export/obsidian-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultPath: vaultPath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }
      setSyncSuccess(`Successfully exported ${data.writtenCount} opportunities to your Obsidian vault!`);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-xl">Local Storage & Obsidian Backup</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manage your local SQLite database file, export complete snapshots, or sync directly to Obsidian.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Direct Downloads */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Database Exports
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-1 text-left hover:border-emerald-500/50"
                onClick={handleDownloadDb}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Download SQLite DB
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Raw <code>startup-radar.db</code> file containing all tables and records.
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-1 text-left hover:border-blue-500/50"
                onClick={handleDownloadJson}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  Export Full JSON
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Structured JSON dump of opportunities, notes, and research runs.
                </div>
              </Button>
            </div>
          </div>

          {/* Obsidian Vault Sync */}
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Obsidian Vault Sync
            </Label>
            <p className="text-xs text-muted-foreground">
              Enter your local Obsidian vault directory. All opportunities and 13-dimension deep research notes will be formatted with frontmatter and written directly into <code>Startup Intelligence/Opportunities/</code>.
            </p>

            <div className="space-y-1.5">
              <Input
                placeholder="e.g. C:\Users\victo\Documents\MyObsidianVault"
                value={vaultPath}
                onChange={(e) => setVaultPath(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            {syncSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {syncSuccess}
              </div>
            )}

            {syncError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {syncError}
              </div>
            )}

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs gap-2"
              disabled={syncing}
              onClick={handleSyncObsidian}
            >
              <FolderSync className="w-3.5 h-3.5" />
              {syncing ? "Syncing to Obsidian..." : "Sync All Opportunities to Obsidian"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
