


"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, ArrowUpDown, Trash2, Smartphone, Tablet, LogOut } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { DataTable } from "../../layout/DataTable";
import { useAuthStore } from "@/stores/auth-store";
import { Session } from "@/types/auth.types";
import {
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLogoutAllConfirmOpen, setIsLogoutAllConfirmOpen] = useState(false);
  const [sessionIdToLogout, setSessionIdToLogout] = useState<string | null>(null);

  const { getSessions, terminateOtherSessions, terminateSession, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchSessions();
    }
  }, [token]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await getSessions();
      console.log("Session response:", response);
      setSessions(response.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast("error", { title: "Error", description: "Failed to load sessions" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    setSessionIdToLogout(sessionId);
    setIsLogoutConfirmOpen(true);
  };

  const executeLogoutSession = async () => {
    if (!sessionIdToLogout) return;
    try {
      const response = await terminateSession(sessionIdToLogout);
      if (response.success) {
        toast("success", { title: "Success", description: "Session terminated successfully" });
        fetchSessions();
        setIsLogoutConfirmOpen(false);
      }
    } catch (error) {
      console.error("Failed to terminate session:", error);
      toast("error", { title: "Error", description: "Failed to terminate session" });
    } finally {
      setSessionIdToLogout(null);
    }
  };

  const handleLogoutAll = async () => {
    setIsLogoutAllConfirmOpen(true);
  };

  const executeLogoutAll = async () => {
    try {
      const response = await terminateOtherSessions();
      if (response.success) {
        toast("success", { title: "Success", description: "All other sessions terminated successfully" });
        fetchSessions();
        setIsLogoutAllConfirmOpen(false);
      }
    } catch (error) {
      console.error("Failed to terminate sessions:", error);
      toast("error", { title: "Error", description: "Failed to terminate sessions" });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const deletePromises = selectedSessions.map((session) =>
        terminateSession(session.id)
      );

      await Promise.all(deletePromises);
      toast("success", { title: "Success", description: `${selectedSessions.length} session(s) terminated` });
      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error("Failed to delete selected sessions:", error);
      toast("error", { title: "Error", description: "Failed to delete selected sessions" });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const parseBrowserInfo = (browserInfo: string) => {
    if (browserInfo.includes("Thunder Client")) return "Thunder Client";
    if (browserInfo.includes("Chrome")) {
      const version = browserInfo.match(/Chrome\/([\d.]+)/)?.[1]?.split(".")[0];
      return `Chrome ${version || ""}`;
    }
    if (browserInfo.includes("Firefox")) {
      const version = browserInfo.match(/Firefox\/([\d.]+)/)?.[1]?.split(".")[0];
      return `Firefox ${version || ""}`;
    }
    if (browserInfo.includes("Safari") && !browserInfo.includes("Chrome")) {
      const version = browserInfo.match(/Version\/([\d.]+)/)?.[1]?.split(".")[0];
      return `Safari ${version || ""}`;
    }
    if (browserInfo.includes("Edge")) {
      const version = browserInfo.match(/Edge\/([\d.]+)/)?.[1]?.split(".")[0];
      return `Edge ${version || ""}`;
    }
    return "Unknown Browser";
  };

  const parseOS = (browserInfo: string) => {
    if (browserInfo.includes("Windows NT 10.0")) return "Windows 10/11";
    if (browserInfo.includes("Windows NT")) return "Windows";
    if (browserInfo.includes("Mac OS X")) {
      const version = browserInfo.match(/Mac OS X ([\d_]+)/)?.[1]?.split("_")[0];
      return `macOS ${version || ""}`;
    }
    if (browserInfo.includes("Linux")) return "Linux";
    if (browserInfo.includes("Android")) return "Android";
    if (browserInfo.includes("iPhone") || browserInfo.includes("iPad")) return "iOS";
    return "Unknown OS";
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4 text-muted-foreground" />;
      case "tablet":
        return <Tablet className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Monitor className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const columns: ColumnDef<Session>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-border"
          disabled={sessions.every((s) => s.isCurrentSession)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-border"
          disabled={row.original.isCurrentSession}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "deviceType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          Device
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const browser = parseBrowserInfo(row.original.browserInfo);
        const os = parseOS(row.original.browserInfo);
        return (
          <div className="flex items-center gap-2">
            {getDeviceIcon(row.getValue("deviceType"))}
            <div>
              <div className="text-[14px] font-medium text-[var(--primary)]">{browser}</div>
              <div className="text-[12px] text-[var(--muted-foreground)]">{os}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <code className="text-[12px] bg-[var(--muted)] px-2 py-1 rounded-md text-[var(--primary)] font-medium">
          {row.getValue("ipAddress")}
        </code>
      ),
    },
    {
      accessorKey: "lastActive",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          Last Active
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.getValue("lastActive")),
    },
    {
      accessorKey: "createdAt",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-[13px] text-[var(--muted-foreground)]">
          {formatTimeAgo(row.getValue("createdAt"))}
        </span>
      ),
    },
    {
      accessorKey: "isCurrentSession",
      id: "isCurrentSession",
      header: "Status",
      filterFn: (row, id, filterValue) => {
        return String(row.getValue(id)) === filterValue;
      },
      cell: ({ row }) => {
        const isCurrent = row.original.isCurrentSession;
        return (
          <Badge
            variant={isCurrent ? "default" : "secondary"}
            className={
              isCurrent
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border-none shadow-none"
                : "bg-muted text-muted-foreground border-none shadow-none"
            }
          >
            {isCurrent ? "Current" : "Active"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleLogoutSession(row.original.id)}
          disabled={row.original.isCurrentSession}
          className="text-xs border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--logout-button)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Log out
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full space-y-4 p-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading sessions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 ">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--primary)] tracking-tight">
            Session History
          </h2>
          <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed">
            {sessions.length} Active Session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        enableGlobalFilter={false}
        enableColumnFilter={true}
        filterColumn="isCurrentSession"
        filterOptions={[
          { label: "Current Session", value: "true" },
          { label: "Other Sessions", value: "false" },
        ]}
        onRowSelectionChange={setSelectedSessions}
        emptyMessage="No active sessions found."
        toolbarActions={
          <>
            {selectedSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedSessions.length})
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const current = sessions.find((s) => s.isCurrentSession);
                  if (current) handleLogoutSession(current.id);
                }}
                className="h-8 px-4 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:opacity-80 text-xs font-medium border-none shadow-none transition-all focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
              >
                Logout
              </Button>
              {sessions.length > 1 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLogoutAll}
                  className="h-8 px-4 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)] hover:opacity-90 text-xs font-medium shadow-none transition-all focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                >
                  Logout from All
                </Button>
              )}
            </div>
          </>
        }
      />

      {/* Individual Logout Confirmation Modal */}
      <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 text-center" showCloseButton={true}>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[var(--logout-button)]/10 border-[12px] border-[var(--logout-button)]/5">
              <div className="flex items-center justify-center w-full h-full rounded-full bg-[var(--logout-button)] text-white">
                <LogOut className="w-10 h-10 ml-1" />
              </div>
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-[var(--primary)] text-center">Log out of this device?</DialogTitle>
              <DialogDescription className="text-[13px] text-[var(--muted-foreground)] leading-tight px-4 pb-2 text-center">
                You'll be signed out from this device only. You can log back in anytime.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex flex-row gap-3 sm:justify-center p-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="flex-1 max-w-[160px] h-12 border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] rounded-xl hover:bg-[var(--muted)] bg-[var(--background)]"
            >
              Cancel
            </Button>
            <Button
              onClick={executeLogoutSession}
              className="flex-1 max-w-[160px] h-12 bg-[var(--logout-button)] hover:bg-[var(--logout-button)] hover:opacity-90 text-white text-sm font-medium rounded-xl shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout All Confirmation Modal */}
      <Dialog open={isLogoutAllConfirmOpen} onOpenChange={setIsLogoutAllConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 text-center" showCloseButton={true}>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[var(--logout-button)]/10 border-[12px] border-[var(--logout-button)]/5">
              <div className="flex items-center justify-center w-full h-full rounded-full bg-[var(--logout-button)] text-white">
                <LogOut className="w-10 h-10 ml-1" />
              </div>
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-[var(--primary)] text-center">Log out from all devices?</DialogTitle>
              <DialogDescription className="text-[13px] text-[var(--muted-foreground)] leading-tight px-4 pb-2 text-center">
                You'll be signed out from all active sessions across devices. You'll need to log in again on each device.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex flex-row gap-3 sm:justify-center p-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsLogoutAllConfirmOpen(false)}
              className="flex-1 max-w-[160px] h-12 border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] rounded-xl hover:bg-[var(--muted)] bg-[var(--background)]"
            >
              Cancel
            </Button>
            <Button
              onClick={executeLogoutAll}
              className="flex-1 max-w-[160px] h-12 bg-[var(--logout-button)] hover:bg-[var(--logout-button)] hover:opacity-90 text-white text-sm font-medium rounded-xl whitespace-nowrap shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
            >
              Log out from all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



