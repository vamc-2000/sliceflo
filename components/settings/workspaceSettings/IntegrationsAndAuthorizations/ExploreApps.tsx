"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Search, X, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import Image from "next/image";

interface ExploreApp {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const exploreAppsData: ExploreApp[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Messaging app for business that connects people to the information they need.",
    icon: "/images/settings/Slack.svg",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Automate all your pull request and commit workflows and keep tasks synced both ways",
    icon: "/images/settings/github.svg",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "Automate your Merge Request workflow",
    icon: "/images/settings/gitlab.svg",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Drive work forward by turning conversations into tasks, projects and documents",
    icon: "/images/settings/teams.svg",
  },
];

interface ExploreAppsProps {
  onBack: () => void;
  onConfigureApp: (appId: string) => void;
}

export default function ExploreApps({ onBack, onConfigureApp }: ExploreAppsProps) {
  const [search, setSearch] = useState("");

  const filtered = exploreAppsData.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-4">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onBack}
            className="hover:text-foreground transition-colors"
          >
            Integrations &amp; Authorizations
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Explore Apps</span>
        </div>
      </div>

      {/* Search + Connected Apps */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Apps"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
        <Button
          className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-primary-foreground h-10 px-5 rounded-md font-medium text-sm flex items-center gap-2"
          onClick={onBack}
        >
          <Plug className="w-4 h-4" />
          Connected Apps
        </Button>
      </div>

      {/* App List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No apps found matching &quot;{search}&quot;
          </div>
        ) : (
          filtered.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between gap-4 px-5 py-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              style={{ borderLeft: "4px solid var(--primary)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{app.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">{app.description}</p>
                </div>
              </div>
              <Button
                className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-primary-foreground h-9 px-5 rounded-md font-medium text-sm flex-shrink-0"
                onClick={() => onConfigureApp(app.id)}
              >
                Configure
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
