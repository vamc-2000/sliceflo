"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Plus, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface MicrosoftTeamsConfigureProps {
  /** Go back one level → Explore Apps */
  onBack: () => void;
  /** Go back two levels → Integrations & Authorizations */
  onBackToIntegrations: () => void;
}

export default function MicrosoftTeamsConfigure({
  onBack,
  onBackToIntegrations,
}: MicrosoftTeamsConfigureProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPersonalConnected, setIsPersonalConnected] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [tenants, setTenants] = useState<string[]>([]);

  const handleConnect = () => {
    setIsConnected((prev) => !prev);
  };

  const handlePersonalConnect = () => {
    setIsPersonalConnected((prev) => !prev);
  };

  const handleAddTenant = () => {
    const name = `Tenant ${tenants.length + 1}`;
    setTenants((prev) => [...prev, name]);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button
          onClick={onBackToIntegrations}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Back to integrations"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onBackToIntegrations}
          className="hover:text-foreground transition-colors"
        >
          Integrations &amp; Authorizations
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={onBack}
          className="hover:text-foreground transition-colors"
        >
          Explore Apps
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Microsoft Teams</span>
      </div>

      {/* ── Page title ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Microsoft Teams
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drive work forward by turning conversations into issues, projects, and
          documents
        </p>
      </div>

      {/* ── Connection Status card ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <Image
              src="/images/settings/teams.svg"
              alt="Microsoft Teams"
              width={26}
              height={26}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Connection Status
            </p>
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
          style={{
            backgroundColor: isConnected ? "#ef4444" : "#f59e0b",
            color: "#fff",
          }}
          onClick={handleConnect}
        >
          <Link2 className="w-4 h-4 mr-1.5" />
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {/* ── Overview card ──────────────────────────────────────── */}
      <div className="px-5 py-5 rounded-xl border border-border bg-card space-y-2">
        <p className="text-sm font-semibold text-foreground">Overview</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mention @workspace in any Microsoft Teams channel to turn your
          discussions into actionable work. You can file issues, update
          projects, or ask questions about your workspace without leaving Teams.
          {showFullOverview && (
            <>
              {" "}
              Connect your Microsoft Teams workspace to get real-time
              notifications on issues, projects, and documents. Receive updates
              directly in your Teams channels whenever tasks are created,
              updated, or completed.
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

      {/* ── Personal Account section ───────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
          Personal Account
        </p>
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-border bg-card">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Personal Microsoft account
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sync attribution of your Microsoft Teams messages
            </p>
          </div>
          <button
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            onClick={handlePersonalConnect}
          >
            {isPersonalConnected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <>
                Connect
                <ExternalLink className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Connections section ────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
          Connections
        </p>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Connected tenants header row */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">
              Connected tenants
            </p>
            <button
              onClick={handleAddTenant}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Add tenant"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tenant list */}
          {tenants.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-muted-foreground">
              No tenants connected yet. Click&nbsp;
              <span className="font-semibold">+</span> to add one.
            </div>
          ) : (
            tenants.map((tenant, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {tenant[0]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{tenant}</p>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  Active
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
