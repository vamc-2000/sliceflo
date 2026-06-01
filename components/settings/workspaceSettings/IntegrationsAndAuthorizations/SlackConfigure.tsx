"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SlackConfigureProps {
  onBack: () => void;
  onBackToIntegrations: () => void;
}

function ConnectedWorkspaceRow({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-border bg-card">
      <span className="text-lg text-[#B3B3B3]">{label}</span>
      {onAdd && (
        <button
          onClick={onAdd}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Add workspace"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function SlackConfigure({ onBack, onBackToIntegrations }: SlackConfigureProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [workspaces, setWorkspaces] = useState<string[]>([]);

  const addWorkspace = () => {
    setWorkspaces((prev) => [...prev, `Workspace ${prev.length + 1}`]);
  };

  return (
    <div className="w-full space-y-5">
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button
          onClick={onBackToIntegrations}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Back to integrations"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={onBackToIntegrations} className="hover:text-foreground transition-colors">
          Integrations &amp; Authorizations
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={onBack} className="hover:text-foreground transition-colors">
          Explore Apps
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Slack</span>
      </div>

      {/* ── Page title ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Slack Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create tasks from Slack messages and sync threads
        </p>
      </div>

      {/* ── Connection Status card ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <Image
              src="/images/settings/Slack.svg"
              alt="Slack"
              width={26}
              height={26}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Connection Status</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConnected ? (
                <span className="text-green-600 font-medium">Connected</span>
              ) : (
                "Not connected"
              )}
            </p>
          </div>
        </div>
        <Button
          className="h-9 px-5 rounded-lg font-medium text-sm"
          style={{ backgroundColor: isConnected ? "#ef4444" : "#f59e0b", color: "#fff" }}
          onClick={() => setIsConnected((p) => !p)}
        >
          <Link2 className="w-4 h-4 mr-1.5" />
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {/* ── Overview ───────────────────────────────────────────── */}
      <div className="px-5 py-5 rounded-xl border border-border bg-card space-y-2">
        <p className="text-lg font-semibold text-[#1E1E1E]">Overview</p>
        <p className="text-sm text-[#757575] leading-relaxed">
          The Slack integration makes it easy to create, update, and view SliceFlo tasks from Slack.
          Notifications and synced threads keep colleagues in the loop on projects and tasks.
          {showFullOverview && (
            <>
              {" "}You can create issues directly from any Slack message, get notified when tasks are
              assigned or updated, and keep your entire team aligned without ever leaving Slack.
            </>
          )}
        </p>
        <button
          className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
          onClick={() => setShowFullOverview((v) => !v)}
        >
          {showFullOverview ? "Read less" : "Read more"}
        </button>
      </div>

      {/* ── Personal Slack account ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 rounded-xl border border-border bg-card">
        <p className="text-lg text-[#1E1E1E]">Personal Slack account not connected</p>
        <button className="flex items-center gap-1 text-xs text-[#B3B3B3] hover:text-foreground transition-colors font-medium">
          Connected accounts
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Connection Status section ──────────────────────────── */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Connection Status
        </p>
        <ConnectedWorkspaceRow label="Connected workspaces" onAdd={addWorkspace} />
      </div>

      {/* ── Settings section ───────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Settings
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          To better keep your team aware of changes in Linear, you can connect Linear teams to
          specific Slack channels. Go to &quot;Notifications&quot; in team&apos;s settings to set
          up Slack notifications.
        </p>
      </div>

      {/* ── Linkbacks section ──────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Linkbacks
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Automatically reply in a thread with a link to the Linear issue when its issue identifier
          is mentioned in a Slack channel the Linear bot is a member of. We&apos;ll only link the
          issue once every 60 minutes per Slack thread. Issues in private teams will not be linked.
        </p>
        <ConnectedWorkspaceRow label="No Slack workspaces connected" onAdd={addWorkspace} />
      </div>

      {/* ── Unfurls section ────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Unfurls
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Show expanded previews of issues, comments, documents and more when shared in Slack.
          Allow taking actions from issue unfurl menus in Slack when people are reading threads,
          commenting or assigning to yourself. Links from private teams will not be unfurled.
          Disable unfurling if you are linking a public Slack workspace.
        </p>
        <ConnectedWorkspaceRow label="No Slack workspaces connected" onAdd={addWorkspace} />
      </div>

      {/* ── Issue templates section ────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Issue templates available in Slack
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Add team or workspace issue templates to make them available in Slack
        </p>
        <ConnectedWorkspaceRow label="No Slack workspaces connected" onAdd={addWorkspace} />
      </div>

      {/* Separator */}
      <div className="border-t border-border pt-2" />

      {/* ── Project channels section ───────────────────────────── */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Project channels
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Automatically create a Slack channel when a new project is created. Project members will
          be invited to the channel and receive project updates.
        </p>
        <ConnectedWorkspaceRow label="No Slack workspaces connected" onAdd={addWorkspace} />
      </div>

      {/* Separator */}
      <div className="border-t border-border pt-2" />

      {/* ── Linear Agent section ───────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[#B0B0B0]">
          Linear Agent
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Linear Agent uses AI to create issues from Slack messages. Once enabled, you can mention
          @Linear in channels or threads, or DM it directly to search issues, create new ones, and
          get help with your workspace.
        </p>

        <p className="text-lg font-semibold text-[#B0B0B0]">
          Code Intelligence
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Allow Linear Agent to analyze code and answer questions about your repositories when triggered in the Slack workspace.
        </p>

        <p className="text-lg font-semibold text-[#B0B0B0]">
          Slack workflow access
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Allow Linear Agent to act with workspace-wide access to non-private team data when triggered by Slack workflows.
        </p>

        <p className="text-lg font-semibold text-[#B0B0B0]">
          Workspace guidance
        </p>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          Guide how Linear Agent creates issues by providing instructions or examples. You can also @mention teams, people, or link to docs for reference.
        </p>

        {/* Separator */}
        <div className="border-t border-border pt-2" />

        <p className="text-sm text-[#B3B3B3]">
          Linear Agent is not enabled for any workspace.
        </p>
      </div>
    </div>
  );
}
