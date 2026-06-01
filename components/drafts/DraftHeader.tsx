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
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg ml-4">
              <SquarePen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-none">Draft</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                className="pl-8 h-9 border-gray-200 focus:ring-blue-500"
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 bg-[#F2F2F7] text-[#8E8E93] border-gray-200 hover:bg-gray-100 relative"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#001F3F] text-[10px] text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 border-0 border-b-[5px] border-[#001F3F] rounded-lg">
                {/* Project Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative">
                    {activeFilters.project && (
                      <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
                    )}
                    <span>Project</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-[#001F3F] rounded-lg">
                      <DropdownMenuItem onClick={() => onFilterChange('project', undefined)} className="relative">
                        {!activeFilters.project && (
                          <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
                        )}
                        All Projects
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {filterData.projects.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => onFilterChange('project', p.name)}
                          className="relative"
                        >
                          {activeFilters.project === p.name && (
                            <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
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
                      <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
                    )}
                    <span>Assignee</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-[#001F3F] rounded-lg">
                      <DropdownMenuItem onClick={() => onFilterChange('assignee', undefined)} className="relative">
                        {!activeFilters.assignee && (
                          <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
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
                            <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
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
                      <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
                    )}
                    <span>Priority</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-[#001F3F] rounded-lg">
                      <DropdownMenuItem onClick={() => onFilterChange('priority', undefined)} className="relative">
                        {!activeFilters.priority && (
                          <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
                        )}
                        All Priorities
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {filterData.priorities.map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => onFilterChange('priority', p)}
                          className="relative capitalize"
                        >
                          {activeFilters.priority === p && (
                            <div className="absolute left-0 w-[3px] h-full bg-[#001F3F] rounded-r-full" />
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
                      className="text-center justify-center font-medium bg-[#001F3F] text-white hover:bg-[#002F5F] focus:bg-[#002F5F] focus:text-white"
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
                className="h-9 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold border border-red-100"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedCount})
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="h-9 gap-2 bg-[#001F3F] hover:bg-[#002F5F] text-white"
            onClick={onDraftTask}
          >
            <Plus className="h-4 w-4" />
            Draft a task
          </Button>
        </div>
      </div>
    </div>
  );
}
