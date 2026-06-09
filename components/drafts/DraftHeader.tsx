"use client";

import React from "react";
import { SquarePen, Search, Filter, Plus, Trash2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface FilterOption {
  id: string;
  name: string;
  avatar?: string;
}

interface DraftHeaderProps {
  onSearchChange: (value: string) => void;
  onFilterChange: (type: 'project' | 'assignee' | 'priority', value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilters: {
    project?: string;
    assignee?: string;
    priority?: string;
  };
  filterData: {
    projects: FilterOption[];
    assignees: FilterOption[];
    priorities: string[];
  };
  onDraftTask: () => void;
  selectedCount?: number;
  onDeleteClick?: () => void;
}

export function DraftHeader({
  onSearchChange,
  onFilterChange,
  onClearFilters,
  activeFilters,
  filterData,
  onDraftTask,
  selectedCount = 0,
  onDeleteClick
}: DraftHeaderProps) {
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 py-1.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg ml-4">
              <SquarePen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground leading-none">Draft</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                className="pl-8 border-border focus:ring-primary text-xs"
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-muted text-muted-foreground border-border hover:bg-muted/80 relative text-xs"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 border-0 border-b-[5px] border-primary rounded-lg text-xs">
                {/* Project Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative">
                    {activeFilters.project && (
                      <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full text-xs" />
                    )}
                    <span className="text-xs">Project</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-primary rounded-lg">
                      <DropdownMenuItem onClick={() => onFilterChange('project', undefined)} className="relative text-xs">
                        {!activeFilters.project && (
                          <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                        )}
                        All Projects
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {filterData.projects.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => onFilterChange('project', p.id)}
                          className="relative text-xs"
                        >
                          {activeFilters.project === p.id && (
                            <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                          )}
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Assignee Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative">
                    {activeFilters.assignee && (
                      <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                    )}
                    <span className="text-xs">Assignee</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-primary rounded-lg text-xs">
                      <DropdownMenuItem onClick={() => onFilterChange('assignee', undefined)} className="relative text-xs">
                        {!activeFilters.assignee && (
                          <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                        )}
                        All Assignees
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {filterData.assignees.map((a) => (
                        <DropdownMenuItem
                          key={a.id}
                          onClick={() => onFilterChange('assignee', a.name)}
                          className="flex items-center gap-2 relative"
                        >
                          {activeFilters.assignee === a.name && (
                            <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                          )}
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={a.avatar} alt={a.name} />
                            <AvatarFallback>{a.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{a.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Priority Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative">
                    {activeFilters.priority && (
                      <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                    )}
                    <span className="text-xs">Priority</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-primary rounded-lg text-xs">
                      <DropdownMenuItem onClick={() => onFilterChange('priority', undefined)} className="relative text-xs">
                        {!activeFilters.priority && (
                          <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                        )}
                        All Priorities
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {filterData.priorities.map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => onFilterChange('priority', p)}
                          className="relative text-xs capitalize"
                        >
                          {activeFilters.priority === p && (
                            <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                          )}
                          {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {activeFilterCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-center text-xs justify-center font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 focus:text-primary-foreground"
                      onClick={onClearFilters}
                    >
                      Clear All Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 font-bold border border-destructive/20"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedCount})
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            className="h-8 gap-2 px-2 py-0.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onDraftTask}
          >
            <Plus className="h-3 w-3" />
            Draft a task
          </Button>
        </div>
      </div>
    </div>
  );
}
