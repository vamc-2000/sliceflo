// app/portfolio/[id]/page.tsx

"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { PortfolioHeader } from "@/components/portfolios/portfolio-header";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Loader } from '@/components/Loader';

// Import view components
import PortfolioOverview from "@/components/portfolios/views/PortfolioOverview/PortfolioOverview";
import { ListView } from "@/components/portfolios/views/list-view/ListView";
import { KanbanView } from "@/components/portfolios/views/kanban-view/KanbanView";
import { GanttView } from "@/components/portfolios/views/gantt-view/GanttView";
import { TimelineView } from "@/components/portfolios/views/timeline-view/TimelineView";
import { TableView } from "@/components/portfolios/views/table-view/TableView";
import { LinkedPortfolioDocumentsView } from "@/components/portfolios/LinkedPortfolioDocumentsView";
import AttachmentView from "@/components/portfolios/views/attachment-view/AttachmentView";
import DiscussionPage from "@/components/disucssions/DiscussionPage";

export default function PortfolioDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    fetchPortfolioById,
    portfolios,
    activeViewIds,
    setActiveView,
    customViews,
    fetchViews,
  } = usePortfoliosStore();
  const { fetchProjectById } = useProjectsStore();
  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();

  // ── Group action handlers ──────────────────────────────────────────────
  const collapseAllGroupsRef = useRef<(() => void) | null>(null);
  const expandAllGroupsRef = useRef<(() => void) | null>(null);
  const toggleHideEmptyGroupsRef = useRef<(() => void) | null>(null);

  const [groupsInfo, setGroupsInfo] = useState({
    collapsed: 0,
    total: 0,
    allCollapsed: false,
    hideEmptyGroups: false,
  });

  // ── Export handlers ────────────────────────────────────────────────────
  const exportCSVRef = useRef<(() => void) | null>(null);
  const exportExcelRef = useRef<(() => void) | null>(null);
  const printTasksRef = useRef<(() => void) | null>(null);

  const [overviewActiveTab, setOverviewActiveTab] = useState<string>('properties');
  const [isPortfolioReady, setIsPortfolioReady] = useState(false);

  const handleRegisterCollapseHandlers = useCallback((
    collapse: () => void,
    expand: () => void,
    toggleHideEmpty: () => void,
    info: { collapsed: number; total: number; allCollapsed: boolean; hideEmptyGroups: boolean }
  ) => {
    collapseAllGroupsRef.current = collapse;
    expandAllGroupsRef.current = expand;
    toggleHideEmptyGroupsRef.current = toggleHideEmpty;
    setGroupsInfo(info);
  }, []);

  useEffect(() => {
    const loadPortfolioData = async () => {
      setIsPortfolioReady(false);
      await fetchPortfolioById(id);
      await fetchViews(id);
      setIsPortfolioReady(true);
    };
    loadPortfolioData();
  }, [id, fetchPortfolioById, fetchViews]);

  const portfolio = portfolios.find((p) => p.id === id);

  const viewerIds = portfolio?.viewers ?? [];
  // const memberIds = portfolio?.members?.map((m) => m.userId) ?? [];

  // const allowedIds = Array.from(new Set([...viewerIds, ...memberIds]));
  const allowedIds = viewerIds.map((viewer) => viewer.userId);

  const mentionableMembers = workspaceMembers
    .filter((wm) => allowedIds.includes(wm.userId))
    .map((wm) => ({
      id: wm.userId,
      name: wm.name,
      profilePictureUrl: wm.profilePicture ?? undefined,
    }));

  if (!portfolio && isPortfolioReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Portfolio not found</h2>
          <p className="text-muted-foreground">
            The portfolio you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Get active view for this portfolio 
  const activeViewId = activeViewIds[id] || "overview";
  const customView = customViews.find(
    (view) => view.projectId === id && view.id === activeViewId
  );

  const handleActivityLogClick = () => {
    setOverviewActiveTab('activity')
    setActiveView(id, 'overview')
  }

  // Render appropriate component based on active view
  const renderViewContent = () => {
    if (customView && 'type' in customView && 'name' in customView) {
      switch (customView.type) {
        case 'notes':
          return <LinkedPortfolioDocumentsView portfolioId={id} />;
        case 'discussions':
          return <DiscussionPage entityType="portfolio" entityId={id} mentionableMembers={mentionableMembers} />;
        case 'attachments':
          return (
            <AttachmentView />
          );
        default:
          return (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">{customView.name} View</h3>
              <p className="text-muted-foreground">Custom view component coming soon...</p>
            </div>
          );
      }
    }

    switch (activeViewId) {
      case "overview":
        return <PortfolioOverview
          portfolio={portfolio}
          activeTab={overviewActiveTab}
          onTabChange={setOverviewActiveTab}
        />;
      case "list":
        return <ListView portfolioId={id} />;
      case "kanban":
        return <KanbanView portfolioId={id} />;
      case "gantt":
        return <GanttView portfolioId={id} />;
      case "timeline":
        return <TimelineView portfolioId={id} />;
      case "table":
        return <TableView portfolioId={id} />;
      case "notes":
        return <LinkedPortfolioDocumentsView portfolioId={id} />;
      default:
        return <PortfolioOverview
          portfolio={portfolio}
          activeTab={overviewActiveTab}
          onTabChange={setOverviewActiveTab}
        />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Fixed Header Section - No scrolling */}
      <div className="flex-none">
        <div className="w-full">
          <Breadcrumbs data-testid="portfolio-breadcrumbs" />
        </div>
        {portfolio && (
          <PortfolioHeader
            data-testid="portfolio-header"
            portfolioName={portfolio.name}
            portfolioId={id}
            activeView={activeViewId}
            onViewChange={(view) => setActiveView(id, view)}
            onCollapseAllGroups={collapseAllGroupsRef.current}
            onExpandAllGroups={expandAllGroupsRef.current}
            onToggleHideEmptyGroups={toggleHideEmptyGroupsRef.current}
            collapsedGroupsCount={groupsInfo.collapsed}
            totalGroupsCount={groupsInfo.total}
            allGroupsCollapsed={groupsInfo.allCollapsed}
            hideEmptyGroups={groupsInfo.hideEmptyGroups}
            onExportCSV={exportCSVRef.current}
            onExportExcel={exportExcelRef.current}
            onPrint={printTasksRef.current}
            onActivityLogClick={handleActivityLogClick}
          />
        )}
      </div>

      {/* Content Area - Let child components handle their own scrolling */}
      <div className="h-full flex-1 overflow-hidden" data-testid="scrollable-content-area">
        {!isPortfolioReady ? (
          <div className="flex items-center justify-center h-full">
            <Loader message="Loading portfolio..." size="md" />
          </div>
        ) : (
          renderViewContent()
        )}
      </div>
    </div>
  );
}