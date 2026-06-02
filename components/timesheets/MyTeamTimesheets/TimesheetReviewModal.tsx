"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import type { TimesheetWithUser } from "@/types/timesheet.types";
import { toast } from "@/components/ui/sonner";

// ─── Types ──── //
interface TimesheetEntry {
  taskName: string;
  time: string;
}

interface TimesheetReviewModalProps {
  open: boolean;
  onClose: () => void;
  /** The action that triggered this modal */
  action: "Approve" | "Reject";
  /** All raw entries for the user being reviewed */
  entries: TimesheetWithUser[];
  /** Called with the note when user clicks Done */
  onConfirm: (action: "Approve" | "Reject", note: string) => Promise<void>;
  taskMap: Map<string, string>;
}

// ─── Helpers ───────────────
function minutesToHrs(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function totalMinutes(entries: TimesheetWithUser[]): number {
  return entries.reduce((sum, e) => sum + e.timeSpentMinutes, 0);
}

function getWeekLabel(entries: TimesheetWithUser[]): string {
  if (!entries.length) return "";
  // Derive "Week N" from weekStart date
  const weekStart = new Date(entries[0].weekStart);
  const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `W${weekNum}`;
}

type ToolbarAction = {
  label: string;
  icon: string;
  className?: string;
};

// ─── Rich Text Toolbar ─────────────
const TOOLBAR_ACTIONS: readonly ToolbarAction[] = [
  { label: "Magic", icon: "✦" },
  { label: "Align Left", icon: "≡" },
  { label: "Align Center", icon: "≡" },
  { label: "Align Right", icon: "≡" },
  { label: "Font Size", icon: "Aa" },
  { label: "Bold", icon: "B", className: "font-bold" },
  { label: "Italic", icon: "I", className: "italic" },
  { label: "Underline", icon: "U", className: "underline" },
  { label: "Strikethrough", icon: "S", className: "line-through" },
  { label: "Clear Format", icon: "Tx" },
] as const;

function NoteToolbar() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-t border-border">
      {TOOLBAR_ACTIONS.map(({ label, icon, className }) => (
        <button
          data-testid={`btn-note-toolbar-${label.toLowerCase().replace(/\s+/g, '-')}`}
          key={label}
          type="button"
          aria-label={label}
          className={`
            w-7 h-7 flex items-center justify-center rounded text-xs
            text-muted-foreground hover:bg-muted hover:text-foreground
            transition-colors ${className ?? ""}
          `}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TimesheetReviewModal({
  open,
  onClose,
  action,
  entries,
  onConfirm,
  taskMap,
}: TimesheetReviewModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!entries.length) return null;

  const profile = entries[0].userProfile;
  const weekLabel = getWeekLabel(entries);
  const totalHrs = minutesToHrs(totalMinutes(entries));

  const initials = (profile?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const tableEntries: TimesheetEntry[] = entries.map((e) => ({
    taskName: taskMap.get(e.taskId) ?? e.taskId,
    time: minutesToHrs(e.timeSpentMinutes),
  }));

  async function handleDone() {
    try {
      setIsSubmitting(true);

      await onConfirm(action, note);

      toast("success", {
        title:
          action === "Approve"
            ? "Timesheet approved successfully"
            : "Timesheet rejected successfully",
      });

      setNote("");
      onClose();
    } catch (error) {
      toast("error", { title: "Something went wrong", });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="timesheet-review-modal"
        className="p-0 gap-0 max-w-[530px] w-full rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
        // Hide the default DialogContent close button — we render our own
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {action} {weekLabel} Timesheet
        </DialogTitle>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* ── Header ── */}
              <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  {/* Week badge */}
                  <span data-testid="timesheet-review-week-badge" className="flex items-center gap-1 text-xs font-semibold bg-muted text-foreground px-2 py-1 rounded-full border border-border">
                    {weekLabel}
                    <span className="text-[10px] text-muted-foreground">ⓘ</span>
                  </span>

                  <div>
                    <h2 className="text-sm font-semibold text-foreground leading-tight">
                      {action} {weekLabel} Timesheet
                    </h2>
                    {/* Total hours pill */}
                    <span data-testid="timesheet-review-total-hours" className="inline-block mt-0.5 text-[11px] font-semibold bg-amber-100 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5">
                      {totalHrs}
                    </span>
                  </div>
                </div>

                <button
                  data-testid="btn-close-timesheet-review-modal"
                  onClick={onClose}
                  className="rounded-md p-1 hover:bg-muted transition-colors text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Employee ── */}
              <div className="px-5 pb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Employee</p>
                <div data-testid="timesheet-review-employee" className="flex items-center gap-3 border border-border rounded-xl px-4 py-1 bg-background">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={profile?.profilePictureUrl ?? undefined} alt={profile?.name} />
                    <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {profile?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{profile?.jobRole ?? ""}</p>
                  </div>
                </div>
              </div>

              {/* ── Tasks Table ── */}
              <div className="px-5 pb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Tasks Submitted</p>
                <div data-testid="timesheet-review-tasks-table" className="border border-border rounded-xl overflow-hidden">
                  {/* Scrollable Container with Sticky Header */}
                  <div className="max-h-[170px] overflow-y-auto overflow-x-hidden relative">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_80px] bg-muted/95 px-4 py-2.5 sticky top-0 z-10 border-b border-border">
                      <span className="text-xs font-semibold text-foreground">Task Name</span>
                      <span className="text-xs font-semibold text-foreground text-right">Time</span>
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-border">
                      {tableEntries.map((entry, i) => (
                        <div
                          key={i}
                          data-testid={`timesheet-review-task-row-${i}`}
                          className="grid grid-cols-[1fr_80px] px-4 py-3 items-center"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={2.5} />
                            <span className="text-sm text-foreground truncate">{entry.taskName}</span>
                          </div>
                          <span className="text-sm text-foreground text-right">{entry.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Note for Employee ── */}
              <div className="px-5 pb-4">
                {/* <p className="text-xs font-medium text-muted-foreground mb-1.5">Note for Employee</p> */}
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {action === "Approve"
                    ? "Approval Note (optional)"
                    : "Reason for Rejection"}
                </p>
                <div className="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
                  <textarea
                    data-testid="input-timesheet-review-note"
                    className="w-full min-h-[100px] resize-none px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-background outline-none"
                    placeholder="Enter your message here....."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <NoteToolbar />
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex justify-end px-5 pt-0 pb-0 shrink-0">
                <Button
                  data-testid={`btn-timesheet-review-confirm-${action.toLowerCase()}`}
                  onClick={handleDone}
                  disabled={isSubmitting}
                  className={`px-6 mb-4 text-primary-foreground min-w-[120px] ${action === "Approve"
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {action === "Approve" ? "Approving..." : "Rejecting..."}
                    </span>
                  ) : (
                    action
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}