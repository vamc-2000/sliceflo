
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowLeft } from "lucide-react";
import CommandHubLayout from "./CommandHubLayout";
import WorkspaceLabelsPage from "./workspace/WorkspaceLabelsPage";
import ProjectDetailsPage from "./workspace/ProjectDetailsPage";
import ProjectUpdatesPage from "./projects/ProjectUpdatesPage";
import ProjectPriorityPage from "./projects/ProjectPriorityPage";
import WorkStatesPage from "./projects/WorkStatesPage";
import TaskPriorityPage from "./projects/TaskPriorityPage";
import WorkItemTypesPage from "./projects/WorkItemTypesPage";
import FeaturesPage from "./projects/FeaturesPage";
import RepeatingWorkPage from "./projects/RepeatingWorkPage";
import CustomFieldPage from "./projects/CustomFieldPage";
import ProjectPhasesPage from "./workspace/ProjectPhasesPage";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";
import { Loader } from '@/components/Loader';
import Automation from "./projects/Automation";
import WorkflowPage from "./projects/WorkflowPage";
import ProjectLabelsPage from "./projects/ProjectLabelsPage";

interface MenuItem {
  id: string;
  text: string;
}

const workspaceMenuItems: MenuItem[] = [
  { id: "labels", text: "Labels" },
  { id: "projectDetails", text: "Project details" },
  { id: "projectPhases", text: "Project Phases" },

];

const projectsMenuItems: MenuItem[] = [
  { id: "labels", text: "Labels" },
  { id: "customFields", text: "Custom fields" },
  { id: "projectUpdates", text: "Project updates" },
  { id: "projectPriority", text: "Project priority" },
  { id: "workitemtypes", text: "Work item types " },
  { id: "workStates", text: "Work states" },
  { id: "workPriority", text: "Work priority" },
  { id: "repeatingWork", text: "Repeating work" },
  { id: "features", text: "Features" },
  { id: "automations", text: "Automations" },
  { id: "workflows", text: "Workflows" },
  { id: "templates", text: "Templates" },
];

type TabType = "workspace" | "projects";

interface CommandHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandHubModal = ({ isOpen, onClose }: CommandHubModalProps) => {
  // Internal state for tab and section instead of URL
  const [activeTab, setActiveTab] = useState<TabType>("workspace");
  const [activeSection, setActiveSection] = useState<string>(
    workspaceMenuItems[0].id
  );
  const { currentWorkspace } = useWorkspaceStore();

  // Get projects from store
  const { projects, fetchProjects, fetchProjectById } = useProjectsStore();
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  // Track selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const fetchedProjectTimes = useRef<Map<string, number>>(new Map());
  const STALE_MS = 60_000; // 60 seconds

  // ─── Step 1: Fetch list when Projects tab is activated ───────────────────
  useEffect(() => {
    const loadProjects = async () => {
      if (currentWorkspace?.id && activeTab === "projects") {
        setIsLoadingProjects(true);
        try {
          await fetchProjects();
        } finally {
          setIsLoadingProjects(false);
        }
      }
    };
    loadProjects();
  }, [currentWorkspace?.id, activeTab]);

  // ─── Step 2: Once list is ready, auto-select first project & fetch its full detail ─
  useEffect(() => {
    if (activeTab !== "projects" || projects.length === 0) return;

    const targetId = selectedProjectId ?? projects[0]?.id ?? null;
    if (!targetId) return;

    // If not already selected, set it
    if (!selectedProjectId) {
      setSelectedProjectId(targetId);
    }

    // Only fetch full detail if not already fetched for this project
    if (!fetchedProjectTimes.current.has(targetId)) {
      loadFullProject(targetId);
    }
  }, [activeTab, projects]);

  // ─── Step 3: Fetch full project detail locally ────────────────────────────
  const loadFullProject = useCallback(async (projectId: string) => {
    const lastFetched = fetchedProjectTimes.current.get(projectId);
    const isStale = !lastFetched || Date.now() - lastFetched > STALE_MS;

    if (!isStale) return;

    setIsLoadingDetail(true);
    try {
      await fetchProjectById(projectId);
      fetchedProjectTimes.current.set(projectId, Date.now());
    } finally {
      setIsLoadingDetail(false);
    }
  }, [fetchProjectById]);

  // ─── Step 4: On project switch, fetch full detail if not cached ───────────
  const handleProjectChange = useCallback(async (projectId: string) => {
    setSelectedProjectId(projectId);
    const lastFetched = fetchedProjectTimes.current.get(projectId);
    const isStale = !lastFetched || Date.now() - lastFetched > STALE_MS;

    if (isStale) {
      await loadFullProject(projectId);
    }
  }, [loadFullProject]);

  // ─── Transform for sidebar display ────────────────────────────────────────
  const mappedProjects = useMemo(() => {
    return projects.map((project) => ({
      id: project.id || "",
      name: project.name,
      icon: project.icon,
      iconId: project.iconId,
      color: project.color || project.icon?.color || "#3b82f6",
    }));
  }, [projects]);

  if (!currentWorkspace || !currentWorkspace.id) {
    return <div>No workspace selected</div>;
  }

  const getCurrentMenuItems = (): MenuItem[] => {
    return activeTab === "workspace" ? workspaceMenuItems : projectsMenuItems;
  };

  const currentMenuItems = getCurrentMenuItems();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newMenuItems = tab === "workspace" ? workspaceMenuItems : projectsMenuItems;
    setActiveSection(newMenuItems[0].id);

    // Reset selected project when switching to Projects tab
    // so the useEffect auto-selects & fetches the first project fresh
    if (tab === "projects") {
      // Keep previously selected project if it's still valid
      const stillValid = selectedProjectId &&
        projects.some(p => p.id === selectedProjectId);
      if (!stillValid) {
        setSelectedProjectId(null);
      }
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };


  const renderContent = () => {
    if (activeTab === "projects" && (isLoadingProjects || isLoadingDetail)) {
      return (
        <div className="flex items-center justify-center h-full bg-background text-foreground">
          <Loader message="Loading projects..." size="md" />
        </div>
      );
    }
    if (activeTab === "workspace") {
      switch (activeSection) {
        case "labels":
          return <WorkspaceLabelsPage />;
        case "projectDetails":
          return <ProjectDetailsPage />;
        case "projectPhases":
          return <ProjectPhasesPage workspaceId={currentWorkspace.id!} />;
        default:
          return <WorkspaceLabelsPage />;
      }
    }
    if (activeTab === "projects") {
      // Use selectedProjectId instead of hardcoded value
      const projectId = selectedProjectId || projects[0]?.id;
      // console.log("Selected Project ID in CommandHubModal:", projectId);

      // Guard: no project available
      if (!projectId) {
        return (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background">
            No projects found
          </div>
        );
      }

      switch (activeSection) {
        case "labels":
          return <ProjectLabelsPage projectId={projectId} />;
        case "customFields":
          return <CustomFieldPage projectId={projectId} />;
        case "projectUpdates":
          return <ProjectUpdatesPage projectId={projectId} />;
        case "projectPriority":
          return <ProjectPriorityPage projectId={projectId} />;
        case "workitemtypes":
          return <WorkItemTypesPage projectId={projectId} />;
        case "workStates":
          return <WorkStatesPage projectId={projectId} />;
        case "workPriority":
          return <TaskPriorityPage projectId={projectId} />;
        case "repeatingWork":
          return <RepeatingWorkPage projectId={projectId} />;
        case "features":
          return <FeaturesPage projectId={projectId} />;
        case "workflows":
          return <WorkflowPage projectId={projectId} onClose={onClose} />;
        case "automations":
          return <Automation projectId={projectId} />;
        case "templates":
          return <div className="p-6 text-muted-foreground bg-background">Templates Section</div>;
        default:
          return <ProjectLabelsPage projectId={projectId} />;
      }
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] h-[85vh] p-0 overflow-hidden border border-border bg-background">
        <VisuallyHidden>
          <DialogTitle>Command Hub</DialogTitle>
        </VisuallyHidden>

        <CommandHubLayout
          title={
            <div className="flex items-center gap-2">
              <ArrowLeft
                className="w-5 h-5 cursor-pointer"
                onClick={onClose} // ← Back button functionality
              />
              <span>Command Hub</span>
            </div>
          }
          menuItems={currentMenuItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          projects={mappedProjects}
          onProjectChange={handleProjectChange}
        >
          {renderContent()}
        </CommandHubLayout>
      </DialogContent>
    </Dialog>
  );
};

export default CommandHubModal;







//pathing code
// "use client";

// import React from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
// import CommandHubLayout from "./CommandHubLayout";
// import LabelPage from "./LabelPage";
// import { ArrowLeft } from "lucide-react";
// import ProjectDetailsPage from "./ProjectDetailsPage";

// interface MenuItem {
//   id: string;
//   text: string;
// }

// const workspaceMenuItems: MenuItem[] = [
//   { id: "labels", text: "Labels" },
//   { id: "projectDetails", text: "Project details" },
//   { id: "miscellaneous", text: "Miscellaneous" },
// ];

// const projectsMenuItems: MenuItem[] = [
//   { id: "labels", text: "Labels" },
//   { id: "customFields", text: "Custom fields" },
//   { id: "projectUpdates", text: "Project updates" },
//   { id: "workStates", text: "Work states" },
//   { id: "repeatingWork", text: "Repeating work" },
//   { id: "features", text: "Features" },
//   { id: "automations", text: "Automations" },
//   { id: "integrations", text: "Integrations" },
//   { id: "templates", text: "Templates" },
// ];

// type TabType = "workspace" | "projects";

// interface CommandHubModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const CommandHubModal = ({ isOpen, onClose }: CommandHubModalProps) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const activeTab = (searchParams.get("commandhubTab") as TabType) || "workspace";
//   const activeSection = searchParams.get("commandhubSection") || "";

//   const getCurrentMenuItems = (): MenuItem[] => {
//     return activeTab === "workspace" ? workspaceMenuItems : projectsMenuItems;
//   };

//   const currentMenuItems = getCurrentMenuItems();

//   const handleTabChange = (tab: string) => {
//     const newMenuItems =
//       tab === "workspace" ? workspaceMenuItems : projectsMenuItems;

//     const params = new URLSearchParams(searchParams.toString());
//     params.set("commandhubTab", tab);
//     params.set("commandhubSection", newMenuItems[0].id);

//     router.push(`?${params.toString()}`);
//   };

//   const renderContent = () => {
//     if (activeTab === "workspace") {
//       switch (activeSection || "labels") {
//         case "labels":
//           return <LabelPage />;
//         case "projectDetails":
//           return <ProjectDetailsPage />;
//         case "miscellaneous":
//           return <div className="p-6 text-gray-600">Workspace Miscellaneous Section</div>;
//         default:
//           return <LabelPage />;
//       }
//     }

//     if (activeTab === "projects") {
//       switch (activeSection || "labels") {
//         case "labels":
//           return <LabelPage />;
//         case "customFields":
//           return <div className="p-6 text-gray-600">Projects Custom Fields Section</div>;
//         case "projectUpdates":
//           return <div className="p-6 text-gray-600">Projects Updates Section</div>;
//         case "workStates":
//           return <div className="p-6 text-gray-600">Work States Section</div>;
//         case "repeatingWork":
//           return <div className="p-6 text-gray-600">Repeating Work Section</div>;
//         case "features":
//           return <div className="p-6 text-gray-600">Features Section</div>;
//         case "automations":
//           return <div className="p-6 text-gray-600">Automations Section</div>;
//         case "integrations":
//           return <div className="p-6 text-gray-600">Integrations Section</div>;
//         case "templates":
//           return <div className="p-6 text-gray-600">Templates Section</div>;
//         default:
//           return <LabelPage />;
//       }
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="!max-w-[75vw] !w-[75vw] h-[75vh] p-0 overflow-hidden">

//         {/* Hidden Title (for accessibility only) */}
//         <VisuallyHidden>
//           <DialogTitle>Command Hub</DialogTitle>
//         </VisuallyHidden>

//         {/* Actual UI Layout */}
//         <CommandHubLayout
//           title={
//             <div className="flex items-center gap-2">
//               <ArrowLeft
//                 className="w-5 h-5 cursor-pointer"
//                 onClick={onClose}   // ← BACK BUTTON FUNCTIONALITY
//               />
//               <span>Command Hub</span>
//             </div>
//           }
//           menuItems={currentMenuItems}
//           activeTab={activeTab}
//           onTabChange={handleTabChange}
//           projects={[
//             { id: "1", name: "Project A", color: "#3b82f6" },
//             { id: "2", name: "Project B", color: "#8b5cf6" },
//             { id: "3", name: "Project C", color: "#10b981" },
//           ]}
//         >
//           {renderContent()}
//         </CommandHubLayout>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default CommandHubModal;
