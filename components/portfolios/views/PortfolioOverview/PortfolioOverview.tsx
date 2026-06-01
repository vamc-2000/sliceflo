// components/portfolios/views/PortfolioOverview/PortfolioOverview.tsx
"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore, Project } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderClosed, Target } from "lucide-react";
import { PortfolioViewersDisplay } from "./PortfolioViewersDisplay";
import { PortfolioRightPanel } from "./PortfolioRightPanel";
import InvitePortfolioViewersDialog from "./InvitePortfolioViewersDialog";
import PortfolioProjectsList from "./PortfolioProjectsList";
import LinkPortfolioProjectDialog from "./LinkPortfolioProjectDialog";
import Image from "next/image";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface PortfolioOverviewProps {
  portfolio?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}



const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio: passedPortfolio,
  activeTab = "properties",
  onTabChange,
}) => {
  const portfolioId = passedPortfolio?.id;

  const portfolio = usePortfoliosStore(
    (state) => state.portfolios.find((p) => p.id === portfolioId)
  );
  const fetchPortfolios = usePortfoliosStore((s) => s.fetchPortfolios);
  const removeViewersFromPortfolio = usePortfoliosStore((s) => s.removeViewersFromPortfolio);
  const removeProjectFromPortfolio = usePortfoliosStore((s) => s.removeProjectFromPortfolio);

  const { currentWorkspace, projectPhases } = useWorkspaceStore();

  // Projects store
  const projects = useProjectsStore((state) => state.projects);
  const isProjectsLoading = useProjectsStore((state) => state.isLoading);

  // Tasks store
  const tasks = useTasksStore((state) => state.tasks);
  const fetchTasks = useTasksStore((state) => state.fetchTasks);

  const [openViewersDialog, setOpenViewersDialog] = useState(false);
  const [openAddProjectDialog, setOpenAddProjectDialog] = useState(false);
  const [openGoalsDialog, setOpenGoalsDialog] = useState(false);

  const portfolioViewerIds = (portfolio?.viewers ?? []).map((v: any) => typeof v === 'string' ? v : v.userId);
  const portfolioProjectIds = portfolio?.projects ?? [];

  // Fetch tasks for linked projects (same pattern as TeamOverview)
  const tasksFetchingRef = useRef<Set<string>>(new Set());

  const fetchPortfolioTasks = useCallback(async (projectIds: string[]) => {
    const newIds = projectIds.filter((id) => !tasksFetchingRef.current.has(id));
    for (const projectId of newIds) {
      tasksFetchingRef.current.add(projectId);
      try {
        await fetchTasks(projectId);
      } catch (error) {
        console.error(`Failed to fetch tasks for project ${projectId}:`, error);
      } finally {
        tasksFetchingRef.current.delete(projectId);
      }
    }
  }, [fetchTasks]);

  useEffect(() => {
    if (portfolioProjectIds.length > 0) {
      fetchPortfolioTasks(portfolioProjectIds);
    }
  }, [portfolioProjectIds.join(','), fetchPortfolioTasks]);

  // Enrich projects with task counts (same pattern as TeamOverview)
  const enrichedPortfolioProjects = useMemo(() => {
    return portfolioProjectIds
      .map((projectId) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return null;
        const projectTasks = tasks.filter((t) => t.projectId === projectId);
        return { ...project, tasksCount: projectTasks.length };
      })
      .filter(
        (p): p is Project & { tasksCount: number } =>
          Boolean(p && typeof (p as any).tasksCount === 'number')
      );
  }, [portfolioProjectIds.join(','), projects, tasks]);

  const hasProjects = enrichedPortfolioProjects.length > 0;

  // Compute dynamic health metrics based on project phases and linked projects
  const healthMetrics = useMemo(() => {
    if (!projectPhases || projectPhases.length === 0) return [];

    const metricsMap = new Map<string, { label: string; count: number; color: string }>();

    // Map all phases (top-level and children)
    projectPhases.forEach(phase => {
      metricsMap.set(phase.value, {
        label: phase.label,
        count: 0,
        color: phase.color || '#3B82F6',
      });
      (phase.children || []).forEach(child => {
        metricsMap.set(child.value, {
          label: child.label,
          count: 0,
          color: child.color || '#3B82F6',
        });
      });
    });

    // Count linked projects per phase
    enrichedPortfolioProjects.forEach(project => {
      if (project.phase) {
        const metric = metricsMap.get(project.phase);
        if (metric) {
          metric.count++;
        }
      }
    });

    // Return all top-level project phases so the health dashboard remains stable and always shows all top-level statuses, even if count is 0.
    // We will include children phases as well if we want, but top-level is cleaner. Let's just return all phases exactly as mapped.
    return Array.from(metricsMap.values());
  }, [enrichedPortfolioProjects, projectPhases]);

  // Handle removing a viewer from the portfolio
  const handleRemoveViewer = async (userId: string) => {
    if (!portfolio || !portfolioId) return;

    try {
      await removeViewersFromPortfolio(portfolioId, [userId]);
    } catch (error) {
      console.error("Failed to remove viewer:", error);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden text-xs">
      <ResizablePanelGroup direction="horizontal" className="flex h-full w-full">
        {/* ── Left Section - Scrollable ── */}
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="flex-1 overflow-y-auto space-y-4 p-4 h-full">

            {/* Portfolio Health Section */}
            <div>
              <div>
                <h3 className="text-sm font-semibold">Portfolio Health</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Summary of project status, blockers, and completion rates. Spot risks before they affect strategy
                </p>
              </div>
              <Card className="p-3">
                <CardContent className="space-y-3 px-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:overflow-x-visible md:pb-0">
                    {healthMetrics.map(({ label, count, color }) => (
                      <div
                        key={label}
                        className="flex-1 min-w-[70px] md:min-w-[80px] rounded-lg p-1.5 text-white"
                        style={{ backgroundColor: color }}
                      >
                        <span className="block text-[10px] md:text-xs font-semibold truncate">
                          {label}
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs md:text-sm font-bold">
                            {count}
                          </span>
                          <FolderClosed className="h-3 w-3 md:h-4 md:w-4 opacity-50" />
                        </div>
                      </div>
                    ))}
                    {healthMetrics.length === 0 && (
                      <div className="col-span-4 text-xs text-muted-foreground text-center py-4">
                        No phases configured in this workspace.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Collaborators Section */}
            <div>
              <div>
                <h3 className="text-sm font-semibold">Team Roster</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Manage people assigned to this portfolio. Add or remove collaborators.
                </p>
              </div>
              <Card>
                <CardContent className="flex justify-start items-center px-6 py-2">
                  {/* Viewers */}
                  <div>
                    {portfolio ? (
                      <PortfolioViewersDisplay
                        viewerIds={portfolioViewerIds}
                        portfolioId={portfolioId}
                        onAddViewer={() => setOpenViewersDialog(true)}
                        onRemoveViewer={handleRemoveViewer}
                      />
                    ) : (
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full bg-muted animate-pulse"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Attached Projects</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Link projects to this portfolio for reporting, and strategic governance
                  </p>
                </div>
                {hasProjects && (
                  <button
                    onClick={() => setOpenAddProjectDialog(true)}
                    className="flex items-center justify-center h-8 w-8 text-muted-foreground cursor-pointer"
                    aria-label="Add project"
                  >
                    <Plus size={25} />
                  </button>
                )}
              </div>

              <Card
                className={`rounded-lg transition-shadow ${hasProjects
                  ? 'border-0 shadow-none bg-transparent'
                  : 'border-l-4 border-l-primary shadow-sm hover:shadow-md'
                  }`}
              >
                <CardContent className={hasProjects ? "p-0" : "px-4 py-2"}>
                  {hasProjects ? (
                    <PortfolioProjectsList
                      projects={enrichedPortfolioProjects}
                      portfolioId={portfolioId}
                      onDetachProject={(projectId) =>
                        removeProjectFromPortfolio(portfolioId, projectId)
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <Image
                        src="/images/projects/portfolios-illustration.svg"
                        alt="projects illustration"
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          data-testid="portfoliooverview-add-new-project-btn"
                          onClick={() => setOpenAddProjectDialog(true)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                            <Plus size={18} />
                          </span>
                          <span>Add new Project</span>
                        </button>
                        <button
                          data-testid="portfoliooverview-add-existing-project-btn"
                          onClick={() => setOpenAddProjectDialog(true)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                            <FolderClosed size={18} />
                          </span>
                          <span>Add from existing Projects</span>
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Goals Section */}
            <div>
              <div>
                <h3 className="text-sm font-semibold">Linked Goals</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Attach one or more goals. Every goal tied to this portfolio has a clear owner and progress metric
                </p>
              </div>
              <Card>
                <CardContent className="px-4 py-2">
                  <div className="flex items-center gap-4">
                    <Image
                      src="/images/projects/goals-illustration.svg"
                      alt="goals illustration"
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                    <button
                      data-testid="portfoliooverview-create-goal-btn"
                      onClick={() => setOpenGoalsDialog(true)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                        <Target size={18} />
                      </span>
                      <span className="text-xs">Create new Goal</span>
                    </button>
                    <button
                      data-testid="portfoliooverview-existing-goal-btn"
                      onClick={() => setOpenGoalsDialog(true)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                        <Target size={18} />
                      </span>
                      <span className="text-xs">Add existing Goal</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[2px] bg-muted hover:bg-muted-foreground/50 transition-all" />

        {/* ── Right Panel - Fixed ── */}
        <ResizablePanel defaultSize={30} minSize={20} className="border-l">
          <div className="h-full">
            <PortfolioRightPanel
              portfolioId={portfolioId}
              workspaceId={currentWorkspace?.id}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ── Dialogs ── */}
      <InvitePortfolioViewersDialog
        open={openViewersDialog}
        onClose={() => setOpenViewersDialog(false)}
        portfolioId={portfolioId}
        portfolioName={portfolio?.name ?? ""}
        existingViewerIds={portfolioViewerIds}
        onViewersUpdate={fetchPortfolios}
      />

      <LinkPortfolioProjectDialog
        open={openAddProjectDialog}
        onClose={() => setOpenAddProjectDialog(false)}
        portfolioId={portfolioId}
        existingProjectIds={portfolioProjectIds}
      />
    </div>
  );
};

export default PortfolioOverview;