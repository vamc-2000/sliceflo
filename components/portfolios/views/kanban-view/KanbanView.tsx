// components/portfolios/views/kanban-view/KanbanView.tsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  KanbanCard,
  type DragEndEvent,
} from "@/components/ui/shadcn-io/kanban";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useKanbanSettingsStore } from "@/stores/kanban-settings-store";
import { PortfolioKanbanCard } from "./KanbanCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Layers,
  SlidersVertical,
  EyeOff,
  ChevronDown,
  Check,
  Eye,
  X,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PortfolioViewersSection from "../../PortfolioViewersSection";
import { useRouter } from "next/navigation";

interface KanbanViewProps {
  portfolioId: string;
}

type KanbanColumn = {
  id: string;
  name: string;
  color: string;
  value: string;
};

export function KanbanView({ portfolioId }: KanbanViewProps) {
  const router = useRouter();
  const portfolios = usePortfoliosStore((state) => state.portfolios);
  const projects = useProjectsStore((state) => state.projects);
  const { currentWorkspace, projectPhases, addProjectPhase } = useWorkspaceStore();
  const {
    updateProjectPhase,
    updateProjectStatus,
    addProject,
  } = useProjectsStore();

  const { getSettings, hideColumn, showColumn } = useKanbanSettingsStore();
  const settings = getSettings(portfolioId);

  const portfolio = portfolios.find((p) => p.id === portfolioId);
  const portfolioProjectIds = portfolio?.projects || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"phase" | "status">("phase");



  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [addingProjectInColumn, setAddingProjectInColumn] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [editedColumnName, setEditedColumnName] = useState("");

  const colorOptions = [
    { name: "Gray", value: "#6B7280" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Red", value: "#EF4444" },
    { name: "Pink", value: "#EC4899" },
    { name: "Yellow", value: "#EAB308" },
  ];

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => portfolioProjectIds.includes(p.id!))
      .filter((p) =>
        searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
      );
  }, [projects, portfolioProjectIds, searchQuery]);

  const columns: KanbanColumn[] = useMemo(() => {
    let rawCols: KanbanColumn[] = [];
    if (groupBy === "status") {
      rawCols = [
        { id: "active", name: "Active", value: "active", color: "#10B981" },
        { id: "archived", name: "Archived", value: "archived", color: "#6B7280" },
      ];
    } else {
      const phases = projectPhases.flatMap((p) => [p, ...(p.children || [])]);
      rawCols = phases.map((phase) => ({
        id: phase.value,
        name: phase.label,
        value: phase.value,
        color: phase.color || "#3B82F6",
      }));
    }

    // Add "No value" column if there are unassigned projects
    const hasUnassigned = filteredProjects.some(p => {
      if (groupBy === "status") return !p.status;
      return !p.phase;
    });

    if (hasUnassigned) {
      rawCols.push({ id: "unassigned", name: "No value", value: "unassigned", color: "#9CA3AF" });
    }

    return rawCols.filter(c => !settings.hiddenColumns.includes(c.id));
  }, [groupBy, projectPhases, settings.hiddenColumns, filteredProjects]);

  const kanbanData = useMemo(() => {
    return filteredProjects.map((p) => {
      let columnId = "unassigned";
      if (groupBy === "status") {
        columnId = p.status?.toLowerCase() || "unassigned";
      } else {
        columnId = p.phase || "unassigned";
      }
      return {
        id: p.id!,
        name: p.name,
        column: columnId,
        project: p,
      };
    });
  }, [filteredProjects, groupBy]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const projectId = active.id as string;
    const newColumnId = over.id as string;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    if (groupBy === "status") {
      await updateProjectStatus(projectId, newColumnId as any);
    } else {
      await updateProjectPhase(projectId, newColumnId);
    }
  };

  const handleAddProject = (columnId: string) => {
    router.push(`/portfolio/${portfolioId}/create-project`);
  };

  const handleStartEditColumnName = (columnId: string) => {
    const col = columns.find(c => c.id === columnId);
    if (col) {
      setEditingColumnName(columnId);
      setEditedColumnName(col.name);
    }
  };

  const handleStartCreateGroup = () => {
    setIsCreatingNewGroup(true);
    setNewGroupName("");
  };

  const handleSaveNewGroup = async () => {
    if (newGroupName.trim() && currentWorkspace?.id) {
      const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)].value;
      await addProjectPhase(currentWorkspace.id, {
        label: newGroupName.trim(),
        color: randomColor,
      });
      setIsCreatingNewGroup(false);
      setNewGroupName("");
    }
  };

  const handleCancelCreateGroup = () => {
    setIsCreatingNewGroup(false);
    setNewGroupName("");
  };

  const AddGroupCard = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void; }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { inputRef.current?.focus(); }, []);
    return (
      <div className="w-80 bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Group Name</label>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              else if (e.key === 'Escape') onCancel();
            }}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} className="flex-1"><Check className="w-4 h-4 mr-2" />Create</Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="flex-1"><X className="w-4 h-4 mr-2" />Cancel</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="relative flex">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-2 pr-8 rounded w-[240px] h-9"
            />
            <Search className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-2 rounded cursor-pointer h-9 px-3">
                <Layers className="h-4 w-4" />
                Group by: <span className="capitalize">{groupBy}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 border-b-5 border-b-[#001F3F] p-1">
              <DropdownMenuItem onClick={() => setGroupBy("phase")} className="cursor-pointer text-sm">Phase</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("status")} className="cursor-pointer text-sm">Status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="secondary" size="sm" className="rounded cursor-pointer h-9">
            <SlidersVertical className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2 h-9">
                <EyeOff className="h-4 w-4" />
                {settings.hiddenColumns.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#F68C1F] text-white rounded-full">
                    {settings.hiddenColumns.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-3 border-b-5 border-b-[#001F3F]">
              <h3 className="text-sm font-semibold mb-3">Unhide Group</h3>
              {settings.hiddenColumns.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No hidden groups</p>
              ) : (
                <div className="space-y-1">
                  {settings.hiddenColumns.map(colId => (
                    <button
                      key={colId}
                      onClick={() => showColumn(portfolioId, colId)}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100 text-sm transition-colors capitalize"
                    >
                      <span>{colId.replace(/-/g, ' ')}</span>
                      <Check className="h-4 w-4 text-blue-600" />
                    </button>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="flex gap-4 items-stretch w-max min-h-full">
          <KanbanProvider
            columns={columns}
            data={kanbanData}
            onDragEnd={handleDragEnd}
          >
            {(column) => (
              <KanbanBoard key={column.id} id={column.id} className="w-80 h-full flex flex-col shrink-0 bg-gray-100 border-none shadow-none ring-0 divide-y-0 overflow-visible rounded-t-lg" style={{ borderTop: `4px solid ${column.color}` }}>
                <KanbanHeader className="border-none py-2 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {editingColumnName === column.id ? (
                        <Input
                          value={editedColumnName}
                          onChange={(e) => setEditedColumnName(e.target.value)}
                          onBlur={() => setEditingColumnName(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingColumnName(null)}
                          className="h-7 text-xs font-bold uppercase p-1"
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide truncate cursor-pointer hover:underline" onClick={() => handleStartEditColumnName(column.id)}>{column.name}</h3>
                          <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs bg-gray-200 text-gray-500 border-none font-bold">
                            {kanbanData.filter(item => item.column === column.id).length}
                          </Badge>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" onClick={() => hideColumn(portfolioId, column.id)}><Eye className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </KanbanHeader>

                <KanbanCards id={column.id} className="gap-2">
                  {(item) => (
                    <KanbanCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      column={item.column}
                      onCardClick={() => router.push(`/project/${item.id}`)}
                      className="px-2 py-0 border-none bg-transparent shadow-none ring-0 h-auto"
                    >
                      <PortfolioKanbanCard project={item.project as any} groupColor={column.color} />
                    </KanbanCard>
                  )}
                </KanbanCards>

                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex justify-start items-center gap-2 border-l-4 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors py-2 px-3 rounded-md w-full h-10"
                    style={{ borderLeftColor: `${column.color}80` }}
                    onClick={() => handleAddProject(column.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />Add Project
                  </Button>
                </div>
              </KanbanBoard>
            )}
          </KanbanProvider>

          <div className="self-start">
            {isCreatingNewGroup ? (
              <AddGroupCard onSave={handleSaveNewGroup} onCancel={handleCancelCreateGroup} />
            ) : (
              <button onClick={handleStartCreateGroup} className="w-80 bg-white rounded-lg hover:bg-gray-50 p-4 transition-colors flex items-center justify-start gap-2 text-gray-600 hover:text-gray-800 font-medium">
                <Plus className="w-5 h-5" />Add Group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
