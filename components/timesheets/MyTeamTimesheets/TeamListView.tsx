"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { TeamFilter } from "@/app/(pages)/timesheet/create/page";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import type { TimesheetStatus, TimesheetWithUser } from "@/types/timesheet.types";
import { TimesheetReviewModal } from "./TimesheetReviewModal";
import EmptyTeamsTimesheet from "./EmptyTeamsTimesheet";
import { Loader } from "@/components/Loader";
import { formatLocalDate } from "@/utils/timezone-utils";

// ─── UI-layer types ────────────────────────────────────────────────────────────
type UITimesheetStatus = "Rejected" | "Pending" | "Approved" | "NotSent";

interface TimesheetEntry {
  project: string;
  task: string;
  duration: string;
  timeType: "Regular" | "Overtime";
  date: string;
}

interface RejectionReason {
  title: string;
  reasons: string[];
}

interface UserTimesheet {
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: UITimesheetStatus;
  period: string;
  regularWorkHour: string;
  overTime: string;
  totalWorkHour: string;
  tasksSubmitted: number;
  entries: TimesheetEntry[];
  rejection?: RejectionReason;
  /** Raw API entries — passed straight to TimesheetReviewModal */
  rawEntries: TimesheetWithUser[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minutesToHrsMin(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hrs ${m} mins` : `${h} hrs`;
}

function formatPeriod(weekStart: string | null, entries: TimesheetWithUser[]): string {
  if (weekStart) {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(weekStart + "T00:00:00");
    end.setDate(end.getDate() + 6);
    return `${formatLocalDate(start)} through ${formatLocalDate(end)}`;
  }
  if (entries.length > 0) return entries[0].weekStart;
  return "";
}

function mapStoreToUI(
  grouped: Map<string, TimesheetWithUser[]>,
  weekStartFilter: string | null,
  projectMap: Map<string, string>,
  taskMap: Map<string, string>
): UserTimesheet[] {
  const result: UserTimesheet[] = [];

  grouped.forEach((entries, userId) => {
    const first = entries[0];
    const profile = first.userProfile;

    // Map API status → UI status (Draft becomes NotSent)
    const apiStatus = first.status;
    const uiStatus: UITimesheetStatus =
      apiStatus === "Draft" ? "NotSent" :
        apiStatus === "Pending" ? "Pending" :
          apiStatus === "Approved" ? "Approved" :
            "Rejected";

    // Weekly capacity logic (hardcoded to 40 hours for now)
    const WEEKLY_CAPACITY_MINS = 40 * 60;

    let totalLoggedMins = 0;
    entries.forEach((e) => {
      totalLoggedMins += e.timeSpentMinutes;
    });

    const regularMins = totalLoggedMins;
    const overTimeMins = Math.max(totalLoggedMins - WEEKLY_CAPACITY_MINS, 0);
    const totalMins = WEEKLY_CAPACITY_MINS; // Display 40 hrs for "Total Work Hour"

    // Build rejection info from the first rejected entry (if any)
    const rejectedEntry = entries.find((e) => e.rejectedReason);
    const rejection: RejectionReason | undefined = rejectedEntry
      ? {
        title: rejectedEntry.freetext || rejectedEntry.notes || "Entry",
        reasons: [rejectedEntry.rejectedReason!],
      }
      : undefined;

    result.push({
      userId,
      name: profile?.name ?? "Unknown",
      role: profile?.jobRole ?? "",
      avatarUrl: profile?.profilePictureUrl ?? undefined,
      status: uiStatus,
      period: formatPeriod(weekStartFilter, entries),
      regularWorkHour: minutesToHrsMin(regularMins),
      overTime: minutesToHrsMin(overTimeMins),
      totalWorkHour: minutesToHrsMin(totalMins),
      tasksSubmitted: new Set(entries.map((e) => e.taskId)).size,
      entries: entries.map((e) => ({
        project: projectMap.get(e.projectId) ?? e.projectId,
        task: taskMap.get(e.taskId) ?? e.taskId,
        duration: minutesToHrsMin(e.timeSpentMinutes),
        timeType: e.isOverTime ? "Overtime" : "Regular",
        date: e.date,
      })),
      rejection,
      rawEntries: entries,
    });
  });

  return result;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09, // delay between each row
    },
  },
};

const sectionVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const fadeSlideItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  userId,
}: {
  status: UITimesheetStatus;
  userId: string;
}) {
  const config: Record<
    UITimesheetStatus,
    { label: string; className: string }
  > = {
    Rejected: { label: "Rejected", className: "bg-red-100 text-red-600 border border-red-200" },
    Pending: { label: "Awaiting Approval", className: "bg-amber-100 text-amber-600 border border-amber-200" },
    Approved: { label: "Approved", className: "bg-green-100 text-green-600 border border-green-200" },
    NotSent: { label: "Not sent for Approval", className: "bg-gray-100 text-gray-500 border border-gray-200" },
  };

  const { label, className } = config[status];

  return (
    <span
      data-testid={`timesheet-status-${userId}`}
      className={`
        inline-flex items-center justify-center
        w-full sm:w-[180px] md:w-[200px]
        rounded-full px-3 py-1 text-xs font-medium
        ${className}
      `}
    >
      {label}
    </span>
  );
}

// ─── Summary Box ──────────────────────────────────────────────────────────────

function SummaryBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

// ─── Entry Row ────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: TimesheetEntry }) {

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={itemVariants}
      className="grid grid-cols-5 gap-4 py-3 border-b border-border last:border-0"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Project
        </p>
        <p className="text-sm text-foreground">{entry.project}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Task
        </p>
        <p className="text-sm text-foreground">{entry.task}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Date
        </p>
        <p className="text-sm text-foreground">
          {entry.date ? formatLocalDate(entry.date + "T00:00:00") : "-"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Duration (HRS)
        </p>
        <p className="text-sm text-foreground">{entry.duration}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Time Type
        </p>
        <p className="text-sm text-foreground">{entry.timeType}</p>
      </div>
    </motion.div>
  );
}

// ─── Accordion Row ────────────────────────────────────────────────────────────

interface TimesheetRowProps {
  sheet: UserTimesheet;
  expanded: boolean;
  onToggle: () => void;
  onApprove: (entries: TimesheetWithUser[]) => void;
  onReject: (entries: TimesheetWithUser[]) => void;
}

function TimesheetRow({ sheet, expanded, onToggle, onApprove, onReject }: TimesheetRowProps) {

  const initials = sheet.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const hasPeriodHeader =
    sheet.status === "Rejected" || sheet.status === "Pending" || sheet.status === "Approved";

  return (
    <div
      data-testid={`timesheet-row-${sheet.userId}`}
      className="border border-border border-l-4 border-l-[#001F3F] rounded-xl overflow-hidden bg-card shadow-sm mb-3"
    >
      {/* ── Header row ── */}
      <div
        data-testid={`timesheet-row-header-${sheet.userId}`}
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={sheet.avatarUrl} alt={sheet.name} />
          <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
        </Avatar>

        {/* Name + role */}
        <div className="w-44 shrink-0">
          <p className="text-sm font-semibold text-foreground leading-tight">{sheet.name}</p>
          <p className="text-xs text-muted-foreground">{sheet.role}</p>
        </div>

        {/* Period text */}
        {/* <p className="flex-1 text-sm text-muted-foreground text-center">
          {sheet.status === "NotSent" || sheet.status === "Rejected"
            ? `No time logged from ${sheet.period}`
            : sheet.status === "Approved"
              ? `Logged from ${sheet.period}`
              : `No time logged from ${sheet.period}`}
        </p> */}

        {/* Period sub-header */}
        {hasPeriodHeader && (
          <p className="flex-1 text-sm text-muted-foreground text-center">
            Seeking Approval for time totals for period{" "}
            <span className="font-semibold text-foreground">{sheet.period}</span>
          </p>
        )}

        {/* Status badge */}
        <StatusBadge status={sheet.status} userId={sheet.userId} />

        {/* Toggle icon */}
        <button
          className="ml-2 rounded-md p-1 hover:bg-muted transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-foreground" strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>

      {/* ── Expanded body ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              className="border-t border-border px-5 pb-5 pt-4 space-y-4"
            >
              {/* Rejection notice */}
              {sheet.status === "Rejected" && sheet.rejection && (
                <div className="rounded-lg bg-orange-500/20 border border-orange-200 px-4 py-3">
                  <p className="text-sm font-bold text-orange-500 mb-1">
                    Task rejected:{" "}
                    <span className="font-bold">{sheet.rejection.title}</span>
                  </p>
                  <p className="text-sm font-medium text-black mb-1.5">
                    Reason for Non - Approval
                  </p>
                  <ul className="space-y-0.5">
                    {/* {sheet.rejection.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-orange-500 flex items-center gap-1">
                        <span >•</span>
                        <span>{r}</span>
                      </li>
                    ))} */}
                    <ul className="list-disc pl-4 space-y-0.5">
                      {sheet.rejection.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-orange-500">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </ul>
                </div>
              )}

              {/* Summary boxes */}
              <div className="flex items-center gap-8 bg-muted/40 rounded-lg px-5 py-4">
                <SummaryBox label="Regular Work Hour" value={sheet.regularWorkHour} />
                <SummaryBox label="Over Time" value={sheet.overTime} />
                <SummaryBox label="Total Work Hour" value={sheet.totalWorkHour} />
                <SummaryBox label="No. of Tasks Submitted" value={sheet.tasksSubmitted} />

                <div className="ml-auto flex gap-2">
                  <Button
                    data-testid={`btn-approve-timesheet-${sheet.userId}`}
                    size="sm"
                    variant="default"
                    className="w-24 bg-primary hover:bg-primary text-primary-foreground gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => { e.stopPropagation(); onApprove(sheet.rawEntries); }}
                    disabled={sheet.status !== "Pending"}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    data-testid={`btn-reject-timesheet-${sheet.userId}`}
                    size="sm"
                    variant="destructive"
                    className="w-24 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => { e.stopPropagation(); onReject(sheet.rawEntries); }}
                    disabled={sheet.status !== "Pending"}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>


              </div>

              {/* Entry rows */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border"
              >
                {sheet.entries.map((entry, i) => (
                  <EntryRow key={i} entry={entry} />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TeamListViewProps {
  selectedWeek?: { start: Date; end: Date };
  teamFilter: TeamFilter;
}

export default function TeamListView({ selectedWeek, teamFilter }: TeamListViewProps) {
  // ── Modal state ──────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"Approve" | "Reject">("Approve");
  const [modalEntries, setModalEntries] = useState<TimesheetWithUser[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openModal(action: "Approve" | "Reject", entries: TimesheetWithUser[]) {
    setModalAction(action);
    setModalEntries(entries);
    setModalOpen(true);
  }

  async function handleModalConfirm(action: "Approve" | "Reject", note: string) {
    if (!modalEntries.length) return;

    const targetUserId = modalEntries[0].userId;
    const weekStart = modalEntries[0].weekStart;

    const payload = {
      targetUserId,
      weekStart,
      comment: note,
    };

    let success = false;

    if (action === "Approve") {
      success = await approveTimesheets(payload);
    } else {
      success = await rejectTimesheets(payload);
    }

    if (success) {
      setModalOpen(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  const approvalQueue = useTimesheetStore((state) => state.approvalQueue);
  const approvalWeekStartFilter = useTimesheetStore((state) => state.approvalWeekStartFilter);
  const isApprovalLoading = useTimesheetStore((state) => state.isApprovalLoading);
  const fetchApprovalQueue = useTimesheetStore((state) => state.fetchApprovalQueue);
  const approveTimesheets = useTimesheetStore((s) => s.approveTimesheets);
  const rejectTimesheets = useTimesheetStore((s) => s.rejectTimesheets);

  // Build id→name lookup maps from the project and task stores
  const projects = useProjectsStore((state) => state.projects);
  const tasks = useTasksStore((state) => state.tasks);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id ?? "", p.name])),
    [projects]
  );
  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t.name])),
    [tasks]
  );

  // Fetch approval queue whenever the selected week changes
  useEffect(() => {
    const params: Parameters<typeof fetchApprovalQueue>[0] = {};
    if (selectedWeek) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const d = selectedWeek.start;
      params.weekStart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    fetchApprovalQueue(params);
  }, [selectedWeek, fetchApprovalQueue]);

  // Group raw entries by userId, then map to UI shape
  const timesheets = useMemo(() => {
    const grouped = new Map<string, TimesheetWithUser[]>();
    for (const entry of approvalQueue) {
      const list = grouped.get(entry.userId) ?? [];
      list.push(entry);
      grouped.set(entry.userId, list);
    }
    return mapStoreToUI(grouped, approvalWeekStartFilter, projectMap, taskMap);
  }, [approvalQueue, approvalWeekStartFilter, projectMap, taskMap]);

  const statusMap: Record<TeamFilter, UITimesheetStatus[]> = {
    all: ["Rejected", "Pending", "Approved", "NotSent"],
    approved: ["Approved"],
    awaiting_approval: ["Pending"],
    rejected: ["Rejected"],
  };

  const filtered = timesheets.filter((s) =>
    statusMap[teamFilter].includes(s.status)
  );

  if (isApprovalLoading) {
    return (
      <div data-testid="team-timesheet-loading-container" className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader
          message="Loading timesheets..."
          size="md"
        />
      </div>
    );
  }

  if (!timesheets.length) {
    return (
      <EmptyTeamsTimesheet />
    );
  }

  if (!filtered.length) {
    return (
      <div data-testid="team-timesheet-no-filter-results" className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No timesheets match this filter.</p>
      </div>
    );
  }

  return (
    <>
      <div data-testid="team-timesheet-list" className="space-y-2 p-4">
        {filtered.map((sheet) => (
          <TimesheetRow
            key={sheet.userId}
            sheet={sheet}
            expanded={expandedId === sheet.userId}
            onToggle={() => setExpandedId(expandedId === sheet.userId ? null : sheet.userId)}
            onApprove={(entries) => openModal("Approve", entries)}
            onReject={(entries) => openModal("Reject", entries)}
          />
        ))}
      </div>

      <TimesheetReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        action={modalAction}
        entries={modalEntries}
        onConfirm={handleModalConfirm}
        taskMap={taskMap}
      />
    </>
  );
}