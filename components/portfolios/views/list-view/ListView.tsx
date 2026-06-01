"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersVertical, ArrowUpDown, Funnel, Pin, EyeOff, Monitor, Search, Layers, X } from "lucide-react";
import { ProjectGroup } from "./ProjectGroup";
import { Button } from "@/components/ui/button";
import LinkPortfolioProjectDialog from "../PortfolioOverview/LinkPortfolioProjectDialog";
import { PortfolioFieldVisibilityPopup } from "./common/PortfolioFieldVisibilityPopup";

interface ListViewProps {
  portfolioId: string;
}

export function ListView({ portfolioId }: ListViewProps) {
  const portfolios = usePortfoliosStore((state) => state.portfolios);
  const projects = useProjectsStore((state) => state.projects);
  const { projectPhases, currentWorkspace } = useWorkspaceStore();

  const portfolio = portfolios.find((p) => p.id === portfolioId);
  const portfolioProjectIds = portfolio?.projects || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"phase" | "status" | "none">("phase");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openLinkProjectDialog, setOpenLinkProjectDialog] = useState(false);


  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => portfolioProjectIds.includes(p.id!))
      .filter((p) =>
        searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
      );
  }, [projects, portfolioProjectIds, searchQuery]);

  const groupedProjects = useMemo(() => {
    const groups: Record<string, { id: string; name: string; color: string; projects: typeof projects }> = {};

    if (groupBy === "none") {
      groups["all"] = {
        id: "all",
        name: "All Projects",
        color: "#6B7280",
        projects: filteredProjects,
      };
      return groups;
    }

    if (groupBy === "status") {
      const defaultStatuses = [
        { id: "active", name: "Active", color: "#10B981" },
        { id: "archived", name: "Archived", color: "#6B7280" },
      ];

      defaultStatuses.forEach((status) => {
        groups[status.id] = { ...status, projects: [] };
      });

      // "Unassigned" fallback
      groups["unassigned"] = {
        id: "unassigned",
        name: "No value",
        color: "#9CA3AF",
        projects: [],
      };

      filteredProjects.forEach((project) => {
        const s = project.status?.toLowerCase() || "unassigned";
        if (groups[s]) {
          groups[s].projects.push(project);
        } else {
          groups["unassigned"].projects.push(project);
        }
      });
    }

    if (groupBy === "phase") {
      // Build flat list of all phases (including children)
      const allPhases = projectPhases.flatMap((p) => [p, ...(p.children || [])]);

      allPhases.forEach((phase) => {
        if (phase.value) {
          groups[phase.value] = {
            id: phase.value,
            name: phase.label,
            color: phase.color || "#3B82F6",
            projects: [],
          };
        }
      });

      // "Unassigned" fallback
      groups["unassigned"] = {
        id: "unassigned",
        name: "No value",
        color: "#9CA3AF",
        projects: [],
      };

      filteredProjects.forEach((project) => {
        const phaseValue = project.phase;
        if (phaseValue && groups[phaseValue]) {
          groups[phaseValue].projects.push(project);
        } else {
          groups["unassigned"].projects.push(project);
        }
      });
    }

    // Only show unassigned group if it contains projects
    if (groups["unassigned"].projects.length === 0) {
      delete groups["unassigned"];
    }

    return groups;
  }, [filteredProjects, groupBy, projectPhases]);

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-2 pr-8 rounded w-[240px]"
            />
            <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Group By Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-2 rounded cursor-pointer">
                <Layers className="h-4 w-4" />
                Group by: <span className="capitalize">{groupBy}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 border-b-5 border-b-primary p-1">
              <DropdownMenuItem
                onClick={() => setGroupBy("phase")}
                className="cursor-pointer text-sm"
              >
                Phase
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setGroupBy("status")}
                className="cursor-pointer text-sm"
              >
                Status
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setGroupBy("none")}
                className="cursor-pointer text-sm"
              >
                None
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSortOptions(!showSortOptions)}
              className={`rounded cursor-pointer ${showSortOptions ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
            >
              <SlidersVertical className="h-4 w-4" />
            </Button>

            {showSortOptions && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="p-4 border-b-5 border-b-primary">
                    <p className="text-xs text-muted-foreground">Coming soon for portfolios...</p>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer">
                      <Funnel className="h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="p-4 border-b-5 border-b-primary">
                    <p className="text-xs text-muted-foreground">Coming soon for portfolios...</p>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer">
                      <Pin className="h-4 w-4" />
                      Freeze Fields
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="p-4 border-b-5 border-b-[#001F3F]">
                    <p className="text-xs text-gray-500">Coming soon for portfolios...</p>
                  </DropdownMenuContent>
                </DropdownMenu> */}

                {/* <PortfolioFieldVisibilityPopup portfolioId={portfolioId}>
                  <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer">
                    <EyeOff className="h-4 w-4" />
                    Hide Fields
                  </Button>
                </PortfolioFieldVisibilityPopup> */}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer">
                      <Monitor className="h-4 w-4" />
                      Display
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="p-4 border-b-5 border-b-primary">
                    <p className="text-xs text-muted-foreground">Coming soon for portfolios...</p>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content - Groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.values(groupedProjects).length === 0 ? (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No projects found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try adjusting your search or grouping options, or link new projects.
              </p>
            </div>
          </div>
        ) : (
          Object.values(groupedProjects).map((group) => (
            <ProjectGroup
              key={group.id}
              id={group.id}
              portfolioId={portfolioId}
              name={group.name}
              color={group.color}
              projects={group.projects}
              isOpen={!collapsedGroups.has(group.id)}
              onToggle={toggleGroup}
              viewType="list"
              onAddProject={() => setOpenLinkProjectDialog(true)}
            />
          ))
        )}
      </div>

      <LinkPortfolioProjectDialog
        open={openLinkProjectDialog}
        onClose={() => setOpenLinkProjectDialog(false)}
        portfolioId={portfolioId}
        existingProjectIds={portfolioProjectIds}
      />
    </div>
  );
}
