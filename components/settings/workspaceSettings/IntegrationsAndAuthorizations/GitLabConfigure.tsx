"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Link2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface GitLabConfigureProps {
  /** Go back one level → Explore Apps */
  onBack: () => void;
  /** Go back two levels → Integrations & Authorizations */
  onBackToIntegrations: () => void;
}

const BRANCH_FORMATS = [
  "username/identifier-title",
  "identifier-title",
  "username/title",
  "identifier/title",
  "title",
];

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[var(--primary)]" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function GitLabConfigure({
  onBack,
  onBackToIntegrations,
}: GitLabConfigureProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [branchFormat, setBranchFormat] = useState(BRANCH_FORMATS[0]);
  const [formatOpen, setFormatOpen] = useState(false);

  const [linkbacks, setLinkbacks] = useState({
    privateRepos: false,
    publicRepos: false,
    internalRepos: true,
    includeDescriptions: false,
  });

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
        <span className="text-foreground font-medium">GitLab</span>
      </div>

      {/* ── Page title ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          GitLab Integration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automate your Merge Request workflow
        </p>
      </div>

      {/* ── Connection Status card ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <Image
              src="/images/settings/gitlab.svg"
              alt="GitLab"
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
          onClick={() => setIsConnected((p) => !p)}
        >
          <Link2 className="w-4 h-4 mr-1.5" />
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {/* ── Overview card ──────────────────────────────────────── */}
      <div className="px-5 py-5 rounded-xl border border-border bg-card space-y-2">
        <p className="text-sm font-semibold text-foreground">Overview</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Our GitLab integration keeps your work in sync in both applications.
          It links issues to Merge Requests so that issues update automatically
          from In Progress to Done as the MR moves from drafted to merged —
          there is no need to update the issue in Linear at all.
          {showFullOverview && (
            <>
              {" "}
              Move even faster by using a keyboard shortcut that creates the
              issue&apos;s git branch name, assigns the issue and moves the
              issue to In Progress in one step.
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

      {/* ── Branch format card ─────────────────────────────────── */}
      <div className="px-5 py-5 rounded-xl border border-border bg-card space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Branch format</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Linear helps you keep your git branch names aligned across your
            entire organization. Users can copy a git branch name for their
            issue using the Copy git branch name action&nbsp;
            <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">
              Ctrl + Shift + .
            </kbd>
          </p>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
          <label className="text-sm text-muted-foreground font-medium">
            Format
          </label>
          {/* Custom dropdown */}
          <div className="relative">
            <button
              onClick={() => setFormatOpen((o) => !o)}
              className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors min-w-[200px] justify-between"
            >
              <span>{branchFormat}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
            {formatOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border border-border bg-card shadow-lg overflow-hidden">
                {BRANCH_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setBranchFormat(fmt);
                      setFormatOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted ${
                      fmt === branchFormat
                        ? "text-foreground font-medium bg-muted/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Linkbacks card ─────────────────────────────────────── */}
      <div className="px-5 py-5 rounded-xl border border-border bg-card space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Linkbacks</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Automatically comment in GitLab with a link to the Linear issue.
            Private team issue titles will not be included in the comment.
          </p>
        </div>

        <div className="space-y-0 divide-y divide-border">
          {(
            [
              {
                key: "privateRepos",
                label: "Private repositories",
              },
              {
                key: "publicRepos",
                label: "Public repositories",
              },
              {
                key: "internalRepos",
                label: "Internal repositories",
              },
              {
                key: "includeDescriptions",
                label: "Include issue descriptions in linkbacks",
              },
            ] as { key: keyof typeof linkbacks; label: string }[]
          ).map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <Toggle
                checked={linkbacks[key]}
                onChange={(val) =>
                  setLinkbacks((prev) => ({ ...prev, [key]: val }))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
