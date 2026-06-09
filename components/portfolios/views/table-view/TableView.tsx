"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { SlidersVertical, ArrowUpDown, Funnel, Pin, EyeOff, Monitor, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectTable } from "../list-view/ProjectTable";
import LinkPortfolioProjectDialog from "../PortfolioOverview/LinkPortfolioProjectDialog";
import { PortfolioFieldVisibilityPopup } from "../list-view/common/PortfolioFieldVisibilityPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableViewProps {
  portfolioId: string;
}

export function TableView({ portfolioId }: TableViewProps) {
  const portfolios = usePortfoliosStore((state) => state.portfolios);
  const projects = useProjectsStore((state) => state.projects);

  const portfolio = portfolios.find((p) => p.id === portfolioId);
  const portfolioProjectIds = portfolio?.projects || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openLinkProjectDialog, setOpenLinkProjectDialog] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => portfolioProjectIds.includes(p.id!))
      .filter((p) =>
        searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
      );
  }, [projects, portfolioProjectIds, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Action Bar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Search bar */}
          <div className="relative flex">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-2 pr-8 rounded text-xs"
            />
            <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSortOptions(!showSortOptions)}
              className={`rounded cursor-pointer text-xs ${showSortOptions ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
            >
              <SlidersVertical className="h-4 w-4" />
            </Button>

            {showSortOptions && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
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
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
                      <Funnel className="h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="p-4 border-b-5 border-b-primary">
                    <p className="text-xs text-muted-foreground">Coming soon for portfolios...</p>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-2 rounded cursor-pointer text-xs">
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

      {/* Main content - Direct Table */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProjects.length === 0 ? (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No projects found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try adjusting your search, or link new projects.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <ProjectTable 
              portfolioId={portfolioId} 
              projects={filteredProjects} 
              onAddProject={() => setOpenLinkProjectDialog(true)} 
              viewType="table"
            />
          </div>
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
