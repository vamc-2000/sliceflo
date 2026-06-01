// components/portfolios/portfolio-view-tabs.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import {
  List,
  Calendar,
  BarChart2, // For Timeline
  Home,
  Plus,
  SquareKanban,
  ChartGantt,
  Table,
  SlidersHorizontal
} from "lucide-react";
import * as Icons from "lucide-react";
import { PortfolioCustomViewsDropdown } from "@/components/portfolios/portfolio-custom-views-dropdown";
import { cn } from "@/lib/utils";

// Separate Overview from other views
export const OVERVIEW_VIEW_PORTFOLIO = { id: "overview", name: "Overview", icon: Home, type: "overview" };

// Default view types for Portfolio (matching user's original set)
export const DEFAULT_VIEWS_PORTFOLIO = [
  { id: "list", name: "List", icon: List, type: "list" },
  { id: "table", name: "Table", icon: Table, type: "table" },
  { id: "timeline", name: "Timeline View", icon: SlidersHorizontal, type: "timeline" },
  { id: "kanban", name: "Kanban", icon: SquareKanban, type: "kanban" },
  { id: "gantt", name: "Gantt", icon: ChartGantt, type: "gantt" },
];

interface Props {
  portfolioId: string;
}

export function PortfolioViewTabs({ portfolioId }: Props) {
  const {
    customViews,
    activeViewIds,
    setActiveView,
    addView,
    fetchViews,
  } = usePortfoliosStore();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      fetchViews(portfolioId);
    }
  }, [isHydrated, portfolioId, fetchViews]);

  if (!isHydrated) return null;

  const iconMap: Record<string, React.ElementType> = {
    Home: Icons.Home,
    List: Icons.List,
    Calendar: Icons.Calendar,
    BarChart2: Icons.BarChart2,
    FileText: Icons.FileText,
    Paperclip: Icons.Paperclip,
    StickyNote: Icons.StickyNote,
    ListTree: Icons.ListTree,
    Presentation: Icons.Presentation,
    MessageSquare: Icons.MessageSquare,
    Star: Icons.Star,
    Users: Icons.Users,
    MessageCircle: Icons.MessageCircle,
    Palette: Icons.Palette,
    FolderOpen: Icons.FolderOpen,
    ListTodo: Icons.ListTodo,
    Video: Icons.Video,
    SlidersHorizontal: Icons.SlidersHorizontal,
  };

  // Get active view for THIS portfolio
  const activeViewId = activeViewIds[portfolioId] || 'overview';

  // Get the custom view for this portfolio
  const customViewForPortfolio = customViews.find(
    (view) => view.projectId === portfolioId // Using projectId for portfolioId linkage in common View interface
  );

  const handleAddView = (name: string, type: string, iconName: string) => {
    const newView = {
      id: `view-${Date.now()}`,
      name,
      type: type as any,
      projectId: portfolioId,
      category: "custom" as const,
      isDefault: false,
      icon: iconName,
      order: 0,
    };
    addView(newView);
  };

  const isOverviewActive = activeViewId === OVERVIEW_VIEW_PORTFOLIO.id;

  return (
    <div className="flex items-center gap-1">
      {/* Overview Button */}
      <Button
        variant={isOverviewActive ? "secondary" : "ghost"}
        size="icon"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
          isOverviewActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
        onClick={() => setActiveView(portfolioId, OVERVIEW_VIEW_PORTFOLIO.id)}
        title={OVERVIEW_VIEW_PORTFOLIO.name}
      >
        <Home className="h-4 w-4" />
      </Button>

      {/* Main Container for other views */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
        {DEFAULT_VIEWS_PORTFOLIO.map((defaultView) => {
          const Icon = defaultView.icon;
          const isActive = activeViewId === defaultView.id;

          return (
            <Button
              key={defaultView.id}
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded transition-colors",
                isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveView(portfolioId, defaultView.id)}
              title={defaultView.name}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}

        {/* Custom Views */}
        {customViewForPortfolio && (
          <Button
            variant={activeViewId === customViewForPortfolio.id ? "default" : "ghost"}
            size="icon"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded transition-colors",
              activeViewId === customViewForPortfolio.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveView(portfolioId, customViewForPortfolio.id)}
            title={customViewForPortfolio.name}
          >
            {(() => {
              const Icon = iconMap[customViewForPortfolio.icon || ""] || Icons.FileText;
              return <Icon className="h-4 w-4" />;
            })()}
          </Button>
        )}

        {/* Add Custom View Dropdown */}
        <PortfolioCustomViewsDropdown onAdd={handleAddView} portfolioId={portfolioId} />
      </div>
    </div>
  );
}