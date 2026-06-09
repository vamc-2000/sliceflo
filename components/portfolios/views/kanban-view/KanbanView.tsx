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
import LinkPortfolioProjectDialog from "../PortfolioOverview/LinkPortfolioProjectDialog";
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
  Link as LinkIcon,
  ChevronUp,
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
  const [openLinkProjectDialog, setOpenLinkProjectDialog] = useState(false);



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
      <div className="w-80 bg-card rounded-lg border-2 border-dashed border-input p-4">
        <div className="mb-3">
          <label className="text-xs font-medium text-foreground mb-2 block">Group Name</label>
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
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <div className="relative flex">
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-2 pr-8 rounded text-xs w-[240px]"
            />
            <Search className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-2 rounded cursor-pointer text-xs">
                <Layers className="h-4 w-4" />
                Group by: <span className="capitalize">{groupBy}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 border-b-5 border-b-primary p-1">
              <DropdownMenuItem onClick={() => setGroupBy("phase")} className="cursor-pointer text-sm">Phase</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy("status")} className="cursor-pointer text-sm">Status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="secondary" size="sm" className="rounded cursor-pointer text-xs">
            <SlidersVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2 rounded text-xs">
                <EyeOff className="h-4 w-4" />
                {settings.hiddenColumns.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#F68C1F] text-white rounded-full">
                    {settings.hiddenColumns.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3 border-b-5 border-b-primary">
              <h3 className="text-sm font-semibold mb-3">Unhide Group</h3>
              {settings.hiddenColumns.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No hidden groups</p>
              ) : (
                <div className="space-y-1">
                  {settings.hiddenColumns.map(colId => (
                    <button
                      key={colId}
                      onClick={() => showColumn(portfolioId, colId)}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-muted text-sm transition-colors capitalize"
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
      <div className="flex-1 overflow-x-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="flex gap-4 items-stretch w-max min-h-full">
          <KanbanProvider
            columns={columns}
            data={kanbanData}
            onDragEnd={handleDragEnd}
          >
            {(column) => (
              <KanbanBoard key={column.id} id={column.id} className="w-80 h-full flex flex-col shrink-0 bg-muted border-none shadow-none ring-0 divide-y-0 overflow-visible rounded-t-lg" style={{ borderTop: `4px solid ${column.color}` }}>
                <KanbanHeader className="border-none py-2 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {editingColumnName === column.id ? (
                        <Input
                          value={editedColumnName}
                          onChange={(e) => setEditedColumnName(e.target.value)}
                          onBlur={() => setEditingColumnName(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingColumnName(null)}
                          className="h-8 w-40 text-xs font-semibold uppercase"
                          autoFocus
                        />
                      ) : (
                        <>
                           <h3 className="font-semibold text-xs text-foreground uppercase tracking-wide truncate cursor-pointer hover:underline" onClick={() => handleStartEditColumnName(column.id)}>{column.name}</h3>
                           <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs bg-muted text-muted-foreground border-none font-bold">
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
                  <div
                    className="flex items-center justify-between border border-input text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md w-full h-8 overflow-hidden bg-card"
                    style={{ borderLeft: `4px solid ${column.color}80` }}
                  >
                    <button
                      className="flex-1 flex items-center justify-start gap-2 h-full px-3 text-left focus:outline-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => handleAddProject(column.id)}
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span>Add Project</span>
                    </button>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="h-full px-2 flex items-center justify-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] focus:outline-none shrink-0 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side="top"
                        className="bg-card border border-border border-b-[5px] border-b-primary rounded-md shadow-lg min-w-[170px] p-0"
                      >
                        <DropdownMenuItem
                          onClick={() => router.push(`/portfolio/${portfolioId}/create-project`)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground cursor-pointer rounded-none focus:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add new project</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setOpenLinkProjectDialog(true)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground cursor-pointer rounded-none border-t border-border focus:bg-muted"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>Add existing project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </KanbanBoard>
            )}
          </KanbanProvider>

          <div className="self-start">
            {isCreatingNewGroup ? (
              <AddGroupCard onSave={handleSaveNewGroup} onCancel={handleCancelCreateGroup} />
            ) : (
              <button onClick={handleStartCreateGroup} className="w-80 bg-card border border-border rounded-lg hover:bg-muted/50 p-2 transition-colors flex items-center justify-start gap-2 text-muted-foreground hover:text-foreground font-medium text-xs">
                <Plus className="w-5 h-5" />Add Group
              </button>
            )}
          </div>
        </div>
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
