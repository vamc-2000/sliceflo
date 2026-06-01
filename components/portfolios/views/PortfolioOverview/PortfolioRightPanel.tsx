// components/portfolios/views/PortfolioOverview/PortfolioRightPanel.tsx
"use client";
import React from "react";

import AboutPortfolio from "./AboutPortfolio";
import SharedActivityLog from "@/components/shared/ActivityLog";

interface PortfolioRightPanelProps {
  portfolioId: string;
  workspaceId?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function PortfolioRightPanel({
  portfolioId,
  workspaceId,
  activeTab = "properties",
  onTabChange,
}: PortfolioRightPanelProps) {
  const tabs = [
    { value: "properties", label: "Properties" },
    { value: "activity", label: "Activity Log" },
  ];

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Full-width pill tab switcher */}
      <div className="bg-muted p-2 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange?.(tab.value)}
            className={`
              flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === "properties" && (
          <AboutPortfolio portfolioId={portfolioId} workspaceId={workspaceId} />
        )}

        {activeTab === "activity" && (
          <SharedActivityLog entityType="portfolio" entityId={portfolioId} />
        )}
      </div>
    </div>
  );
}