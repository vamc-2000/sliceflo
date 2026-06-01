"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTeamStore } from "@/stores/teams-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useDocStore } from "@/stores/useDoc-store"; // ✅ add this
import { listRootDocuments } from "@/lib/api/documents-api"; // ✅ add this

/**
 * SyncObserver is a headless component that monitors store changes
 * and coordinates data synchronization across the application shell.
 * It helps maintain the "Realtime" feel of the Sidebar and Layout.
 */
export function SyncObserver() {
    const { isAuthenticated, isHydrated: isAuthHydrated } = useAuthStore();
    const { initializeDynamicData } = useSidebarStore();
    const { currentWorkspace } = useWorkspaceStore();
    const { teams } = useTeamStore();
    const { projects } = useProjectsStore();
    const { loadDocuments, reset: resetDocs } = useDocStore();

    // 1. Initial Sync when Auth/Sidebar hydrate
    useEffect(() => {
        if (isAuthHydrated && isAuthenticated) {
            initializeDynamicData();
        }
    }, [isAuthHydrated, isAuthenticated, initializeDynamicData]);

    // 2. React to Workspace Changes
    // When the workspace changes, we usually need to re-initialize the sidebar
    // to show projects/teams belonging to the new workspace.
    useEffect(() => {
        if (isAuthenticated && currentWorkspace?.id) {
            initializeDynamicData();
        }
    }, [currentWorkspace?.id, isAuthenticated, initializeDynamicData]);

    // 3. React to Data Changes
    // If teams or projects are updated elsewhere, ensure sidebar reflects them.
    useEffect(() => {
        if (isAuthenticated && (teams.length > 0 || projects.length > 0)) {
            initializeDynamicData();
        }
    }, [teams.length, projects.length, isAuthenticated, initializeDynamicData]);

      useEffect(() => {
    if (isAuthHydrated && isAuthenticated && currentWorkspace?.id) {
      resetDocs(); 
      listRootDocuments()
        .then((docs) => loadDocuments(docs as any))
        .catch(() => {}); // silent fail
    }
  }, [isAuthHydrated, isAuthenticated, currentWorkspace?.id, loadDocuments, resetDocs]);


    return null; // Headless component
}
