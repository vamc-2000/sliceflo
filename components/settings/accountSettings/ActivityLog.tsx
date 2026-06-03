"use client";

import { useEffect } from "react";
import { useActivityLogStore } from "@/stores/activity-log-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

export default function ActivityLogs() {
  const { user } = useAuthStore();
  const { currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();
  const {
    activityLogs = [],
    loading,
    error,
    fetchActivityLogs,
  } = useActivityLogStore();

  useEffect(() => {
    const workspaceId = currentWorkspace?.id;
    if (!user?.id || !workspaceId) return;

    const userId = user.id;

    fetchWorkspaceMembers(workspaceId)
      .then(() => fetchActivityLogs(userId))
      .catch(() => fetchActivityLogs(userId));
  }, [user?.id, currentWorkspace?.id, fetchWorkspaceMembers, fetchActivityLogs]);

  if (!user?.id && !error) {
    return (
      <div className="w-full max-w-4xl">
        <h2 className="text-xl font-semibold mb-1" data-testid="activity-log-title">Activity log</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Track recent actions across your workspaces.
        </p>
        <Separator className="mb-2" />
        <div className="flex items-center justify-center py-8" data-testid="activity-log-loading">
          <p className="text-sm text-muted-foreground">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-xl font-semibold mb-1 text-foreground" data-testid="activity-log-title">Activity log</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Terminal-style activity feed.
      </p>
      <Separator className="mb-2" />

      {loading && (
        <div className="flex items-center justify-center py-8" data-testid="activity-log-loading">
          <p className="text-sm text-muted-foreground">
            Loading activity logs...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 text-sm text-red-700 py-4" data-testid="activity-log-error">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && activityLogs.length > 0 && (
        <div className="rounded-md px-0 py-1 text-[11px] md:text-xs overflow-x-auto" data-testid="activity-log-list">
          {activityLogs.map((log) => {
            const actor = log.actor;
            const d = new Date(log.time);

            const timestamp = d.toISOString().replace("T", " ").slice(0, 19);

            const rawTag = (log.resource || "ACT").toUpperCase();
            const tag = rawTag.slice(0, 8).padEnd(8, " ");

            const eventText = (log.message || "").slice(0, 120);

            return (
              <div
                key={log._id}
                className="flex items-start gap-1 px-2 py-1 text-[14px] md:text-xs text-foreground hover:bg-muted rounded-md transition"
                data-testid={`activity-log-row-${log._id}`}
              >
                {/* Timestamp */}
                <span className="min-w-[150px] text-emerald-500 dark:text-emerald-400" data-testid={`activity-log-row-time-${log._id}`}>
                  [{timestamp}]
                </span>

                {/* Tag */}
                <span className="min-w-[80px] text-primary font-semibold" data-testid={`activity-log-row-tag-${log._id}`}>
                  [{tag}]
                </span>

                {/* Event */}
                <span className="flex-1 text-muted-foreground leading-relaxed" data-testid={`activity-log-row-text-${log._id}`}>
                  {eventText}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && activityLogs.length === 0 && (
        <div className="flex items-center justify-center py-8" data-testid="activity-log-empty">
          <p className="text-sm text-muted-foreground">
            No activity logs found.
          </p>
        </div>
      )}
    </div>
  );
}
