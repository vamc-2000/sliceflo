import { useAuthStore } from "./auth-store";
import { useGoalsStore } from "./goals-store";
import { useMailStore } from "./mailbox-store";
import { useProfileStore } from "./profile-store";
import { useProjectsStore } from "./projects-store";
import { useTasksStore } from "./tasks-store";
import { useTeamStore } from "./teams-store";
import { useTimesheetStore } from "./timesheet-store";
import { useWorkspaceStore } from "./workspace-store";
import { useAccountStore } from "./account-store";
import { useActivityLogStore } from "./activity-log-store";
import { usePortfoliosStore } from "./portfolios-store";
import { useAutomationStore } from "./automation-store";
import { useUserStore } from "./user-store";
import { useOnboardingStore } from "./onboarding-store";
import { useDocStore } from "./useDoc-store";
import { useDiscussionStore } from "./discussions-store";
import { useSidebarStore } from "./sidebar-store";

export function resetAllStores() {
  useAuthStore.getState().reset();
  resetWorkspaceData();
}

export function resetWorkspaceData() {
  useTeamStore.getState().reset();
  useProjectsStore.getState().reset();
  useTasksStore.getState().reset();
  useTimesheetStore.getState().reset();
  useGoalsStore.getState().resetStore();
  useProfileStore.getState().resetProfile();
  useWorkspaceStore.getState().reset();
  useMailStore.getState().reset();
  useAccountStore.getState().reset();
  useActivityLogStore.getState().reset();
  usePortfoliosStore.getState().reset();
  useAutomationStore.getState().reset();
  useUserStore.getState().reset();
  useOnboardingStore.getState().resetOnboarding();
  useDocStore.getState().reset();
  useDiscussionStore.getState().reset();
  useSidebarStore.getState().reset();
}