"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivityLogStore } from "@/stores/activity-log-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActivityLogs() {
  const { user } = useAuthStore();
  const { currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();
  const {
    activityLogs = [],
    loading,
    error,
    fetchActivityLogs,
    currentPage,
    pageCount,
    hasNextPage,
    hasPrevPage,
    total,
  } = useActivityLogStore();

  const [limit, setLimit] = useState(15);

  useEffect(() => {
    const workspaceId = currentWorkspace?.id;
    if (!user?.id || !workspaceId) return;

    const userId = user.id;

    fetchWorkspaceMembers(workspaceId)
      .then(() => fetchActivityLogs(userId, 1, limit))
      .catch(() => fetchActivityLogs(userId, 1, limit));
  }, [user?.id, currentWorkspace?.id, fetchWorkspaceMembers, fetchActivityLogs, limit]);

  const handlePageChange = (page: number) => {
    if (!user?.id) return;
    fetchActivityLogs(user.id, page, limit);
  };

  if (!user?.id && !error) {
    return (
      <div className="w-full max-w-4xl space-y-2">
        <h2 className="text-[16px] font-semibold text-brand tracking-tight" data-testid="activity-log-title">
          Activity log
        </h2>
        <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed">
          Track recent actions across your workspaces.
        </p>
        <div className="flex items-center justify-center py-8" data-testid="activity-log-loading">
          <p className="text-sm text-[var(--muted-foreground)]">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-2">
      <h2 className="text-[16px] font-semibold text-brand tracking-tight" data-testid="activity-log-title">
        Activity log
      </h2>
      <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed">
        Terminal-style activity feed.
      </p>

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
        <div className="space-y-4">
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
                  <span className="min-w-[150px] text-[var(--muted-foreground)]" data-testid={`activity-log-row-time-${log._id}`}>
                    [{timestamp}]
                  </span>

                  {/* Tag */}
                  <span className="min-w-[80px] text-brand font-semibold" data-testid={`activity-log-row-tag-${log._id}`}>
                    [{tag}]
                  </span>

                  {/* Event */}
                  <span className="flex-1 text-foreground leading-relaxed" data-testid={`activity-log-row-text-${log._id}`}>
                    {eventText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 px-2" data-testid="activity-log-pagination">
              <div className="flex items-center gap-6">
                <div className="text-xs text-muted-foreground">
                  Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                  <span className="font-semibold text-foreground">{pageCount}</span> ({total} logs)
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="text-muted-foreground">Logs per page</span>
                  <Select
                    value={`${limit}`}
                    onValueChange={(val) => {
                      setLimit(Number(val));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px] bg-background border-border text-foreground">
                      <SelectValue placeholder={limit} />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 30, 50, 100].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-background text-foreground border-border hover:bg-muted"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-background text-foreground border-border hover:bg-muted"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
