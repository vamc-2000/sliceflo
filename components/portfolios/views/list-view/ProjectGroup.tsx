"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Project } from "@/stores/projects-store";
import { ProjectTable } from "./ProjectTable";

interface ProjectGroupProps {
  id: string;
  portfolioId?: string;
  name: string;
  color?: string;
  projects: Project[];
  isOpen: boolean;
  onToggle: (id: string) => void;
  viewType?: "list" | "table" | "gantt";
  onAddProject?: () => void;
}

export function ProjectGroup({
  id,
  portfolioId,
  name,
  color = "#3B82F6",
  projects,
  isOpen,
  onToggle,
  viewType = "list",
  onAddProject
}: ProjectGroupProps) {
  
  return (
    <div className="flex flex-col gap-2 overflow-hidden">
      {/* ── Group Header ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-200 rounded-l-md"
      >
        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            onClick={() => onToggle(id)}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 transition-colors text-gray-500"
          >
            <ChevronDown
              className="h-4 w-4 transition-transform duration-200"
              style={{ transform: !isOpen ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Status dot */}
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />

          <h3 className="text-sm font-semibold text-gray-800 leading-none">
            {name}
          </h3>

          {/* Task count badge */}
          <span className="text-xs text-gray-400 ml-1">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>
      </div>

      {/* ── Task Table ───────────────────────────────────────────── */}
      {isOpen && (
        <ProjectTable portfolioId={portfolioId} projects={projects} groupColor={color} viewType={viewType} onAddProject={onAddProject} />
      )}
    </div>
  );
}
