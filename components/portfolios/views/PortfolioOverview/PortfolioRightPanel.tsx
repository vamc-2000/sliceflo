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
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Full-width pill tab switcher */}
      <div className="bg-[#F2F2F7] p-2 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange?.(tab.value)}
            className={`
              flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${
                activeTab === tab.value
                  ? "bg-[#001F3F] text-white shadow-sm"
                  : "text-[#8E8E93] hover:text-[#3C3C43]"
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