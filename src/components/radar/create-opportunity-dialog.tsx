"use client";

import React, { useState } from "react";
import type { Opportunity, OpportunityStatus } from "@/lib/opportunities/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Sparkles, Plus, Loader2 } from "lucide-react";

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: OpportunityStatus;
  onCreateOpportunity: (data: Partial<Opportunity>) => Promise<void>;
}

export function CreateOpportunityDialog({
  open,
  onOpenChange,
  defaultStatus = "NEW",
  onCreateOpportunity,
}: CreateOpportunityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [industry, setIndustry] = useState("");
  const [currentSolution, setCurrentSolution] = useState("");
  const [currentWorkflow, setCurrentWorkflow] = useState("");
  const [whyInteresting, setWhyInteresting] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [initialNote, setInitialNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !problem.trim()) return;

    setLoading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const notes = initialNote.trim()
        ? [
            {
              id: `note-${Date.now()}`,
              content: initialNote.trim(),
              createdAt: new Date().toISOString(),
            },
          ]
        : [];

      await onCreateOpportunity({
        title: title.trim(),
        problem: problem.trim(),
        description: whyInteresting.trim() || problem.trim(),
        targetCustomer: targetCustomer.trim() || "B2B",
        industry: industry.trim() || "SaaS",
        currentSolutions: currentSolution.trim(),
        currentWorkflow: currentWorkflow.trim(),
        whyInteresting: whyInteresting.trim(),
        whyTheProblemMatters: whyInteresting.trim(),
        nextAction: nextAction.trim() || "Interview 5 potential users",
        tags,
        notes,
        status: defaultStatus,
        isUserGenerated: true,
        createdBy: "USER",
        source: "Manual",
        myDecision: "INTERESTED",
        researchScore: 65,
        aiPriority: "MEDIUM_POTENTIAL",
        aiConfidence: "MEDIUM",
        evidenceStrength: "MEDIUM",
      });

      // Reset form
      setTitle("");
      setProblem("");
      setTargetCustomer("");
      setIndustry("");
      setCurrentSolution("");
      setCurrentWorkflow("");
      setWhyInteresting("");
      setNextAction("");
      setTagsInput("");
      setInitialNote("");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create opportunity:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <User className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">Create New Opportunity</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Capture your own thesis or user-discovered SaaS idea. Marked as <strong className="text-purple-300">MY IDEA</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="opp-title" className="text-xs font-semibold">
              Opportunity Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="opp-title"
              required
              placeholder="e.g. AI Security Questionnaire Assistant"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Problem */}
          <div className="space-y-1.5">
            <Label htmlFor="opp-problem" className="text-xs font-semibold">
              The Painful Problem <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="opp-problem"
              required
              rows={3}
              placeholder="What concrete, painful, recurring problem are users experiencing?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Target Customer & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-customer" className="text-xs font-semibold">
                Target Customer
              </Label>
              <Input
                id="opp-customer"
                placeholder="e.g. B2B SaaS companies ($1M-$20M ARR)"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-industry" className="text-xs font-semibold">
                Industry
              </Label>
              <Input
                id="opp-industry"
                placeholder="e.g. Cybersecurity, DevTools, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Current Solution & Current Workflow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-solutions" className="text-xs font-semibold">
                Current Solutions & Workarounds
              </Label>
              <Input
                id="opp-solutions"
                placeholder="e.g. Excel spreadsheets, Loopio, manual copy-paste"
                value={currentSolution}
                onChange={(e) => setCurrentSolution(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-workflow" className="text-xs font-semibold">
                Current Workflow
              </Label>
              <Input
                id="opp-workflow"
                placeholder="e.g. Sales engineers spend 20h per deal copying answers"
                value={currentWorkflow}
                onChange={(e) => setCurrentWorkflow(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Why I Think This Is Interesting */}
          <div className="space-y-1.5">
            <Label htmlFor="opp-why" className="text-xs font-semibold">
              Why I Think This Is Interesting (The Wedge / Angle)
            </Label>
            <Textarea
              id="opp-why"
              rows={2}
              placeholder="Why is now the right time? What is the unfair advantage or market gap?"
              value={whyInteresting}
              onChange={(e) => setWhyInteresting(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Next Action */}
          <div className="space-y-1.5">
            <Label htmlFor="opp-action" className="text-xs font-semibold">
              Next Action
            </Label>
            <Input
              id="opp-action"
              placeholder="e.g. Interview 5 potential customers on LinkedIn"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Tags & Initial Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-tags" className="text-xs font-semibold">
                Tags (comma separated)
              </Label>
              <Input
                id="opp-tags"
                placeholder="e.g. B2B, AI, Compliance, Fast MVP"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opp-note" className="text-xs font-semibold">
                Initial Personal Note
              </Label>
              <Input
                id="opp-note"
                placeholder="e.g. Discovered while talking to friend in InfoSec"
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !problem.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-3.5" />
                  Save Opportunity
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
