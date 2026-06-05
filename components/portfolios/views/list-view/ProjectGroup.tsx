"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Project } from "@/stores/projects-store";
import { ProjectTable } from "./ProjectTable";
import { AnimatePresence, motion } from "framer-motion";

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
        onClick={() => onToggle(id)}
        className="flex items-center justify-between px-4 py-2 bg-muted rounded-md cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            // onClick={() => onToggle(id)}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <ChevronDown
              className="h-4 w-4 transition-transform duration-200 cursor-pointer"
              style={{ transform: !isOpen ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Status dot */}
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />

          <h3 className="text-xs font-semibold text-foreground leading-none">
            {name}
          </h3>

          {/* Task count badge */}
          <span className="text-xs text-muted-foreground ml-1">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>
      </div>

      {/* ── Task Table ───────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ProjectTable
              portfolioId={portfolioId}
              projects={projects}
              groupColor={color}
              viewType={viewType}
              onAddProject={onAddProject}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}