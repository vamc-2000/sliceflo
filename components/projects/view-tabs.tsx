// components/projects/view-tabs.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectsStore, View } from "@/stores/projects-store";
import {
  List,
  Calendar,
  SquareKanban,
  ChartGantt,
  Plus,
  Home
} from "lucide-react";
import * as Icons from "lucide-react";
import { CustomViewsDropdown } from "@/components/projects/custom-views-dropdown";
import { cn } from "@/lib/utils";

// ✅ Separate Overview from other default views
export const OVERVIEW_VIEW = { id: "overview", name: "Overview", icon: Home, type: "overview" };

// Fixed default view types
export const DEFAULT_VIEWS = [
  { id: "list", name: "List", icon: List, type: "list" },
  { id: "calendar", name: "Calendar", icon: Calendar, type: "calendar" },
  { id: "kanban", name: "Kanban", icon: SquareKanban, type: "kanban" },
  { id: "gantt", name: "Gantt", icon: ChartGantt, type: "gantt" },
];

interface ViewTabsProps {
  projectId: string;
}

export function ViewTabs({ projectId }: ViewTabsProps) {
  const {
    customViews,
    activeViewIds,
    setActiveView,
    addView,
    fetchViews,
  } = useProjectsStore();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize views on mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      // Fetch views when component mounts or projectId changes
      fetchViews(projectId);
    }
  }, [isHydrated, projectId, fetchViews]);

  if (!isHydrated) return null;

  const iconMap: Record<string, React.ElementType> = {
    Home: Icons.Home,
    List: Icons.List,
    Calendar: Icons.Calendar,
    SquareKanban: Icons.SquareKanban,
    ChartGantt: Icons.ChartGantt,
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
  };

  // Get active view for THIS project
  const activeViewId = activeViewIds[projectId] || 'overview';

  // Get the ONLY custom view for this project (latest added)
  const customViewForProject = customViews.find(
    (view) => view.projectId === projectId
  );

  const handleAddView = (name: string, type: string, iconName: string) => {
    const viewId = type;
    const newView = {
      id: viewId,
      name,
      type: type as any,
      projectId,
      category: "custom" as const,
      isDefault: false,
      icon: iconName,
      order: 0,
    };
    addView(newView); // This will replace the existing custom view

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', viewId);
    router.push(`?${params.toString()}`);
  };
  // console.log("customViewForProject", customViewForProject)

  const OverviewIcon = OVERVIEW_VIEW.icon;
  const isOverviewActive = activeViewId === OVERVIEW_VIEW.id;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={isOverviewActive ? "secondary" : "ghost"}
        size="icon"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
          isOverviewActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
        onClick={() => {
          setActiveView(projectId, OVERVIEW_VIEW.id);
          const params = new URLSearchParams(searchParams.toString());
          params.set('view', OVERVIEW_VIEW.id);
          router.push(`?${params.toString()}`);
        }}
        title={OVERVIEW_VIEW.name}
      >
        <OverviewIcon className="h-4 w-4" />
      </Button>

      {/* Fixed Default View Icons */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
        {DEFAULT_VIEWS.map((defaultView) => {
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
              onClick={() => {
                setActiveView(projectId, defaultView.id);
                const params = new URLSearchParams(searchParams.toString());
                params.set('view', defaultView.id);
                router.push(`?${params.toString()}`);
              }}
              title={defaultView.name}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}

        {/* Show the LATEST (and only) custom view for this project */}
        {customViewForProject && customViewForProject.icon && (
          <Button
            variant={activeViewId === customViewForProject.id ? "default" : "ghost"}
            size="icon"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded transition-colors",
              activeViewId === customViewForProject.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setActiveView(projectId, customViewForProject.id);
              const params = new URLSearchParams(searchParams.toString());
              params.set('view', customViewForProject.id);
              router.push(`?${params.toString()}`);
            }}
            title={customViewForProject.name}
          >
            {(() => {
              // ✅ Get icon component from iconMap using stored icon name
              const Icon = iconMap[customViewForProject.icon] || Icons.FileText;
              return <Icon className="h-4 w-4" />;
            })()}
          </Button>
        )}

        {/* More Button with Dropdown */}
        <CustomViewsDropdown onAdd={handleAddView} projectId={projectId} />
      </div>

    </div>
  );
}
