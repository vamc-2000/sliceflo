// stores/projects-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createProject,
  updateProjectApi,
  getAllProjects,
  getProjectById,
  renameProjectPatchApi,
  updateProjectStatusPatchApi,
  updateProjectPriorityPatchApi,
  addViewersToProjectPatchApi,
  removeViewersFromProjectPatchApi,
  addMembersToProjectPatchApi,
  removeMembersFromProjectPatchApi,
  updateProjectIconPatchApi,
  archiveProjectPatchApi,
  attachUploadsToProjectPatchApi,
  removeUploadsFromProjectPatchApi,
  deleteProjectPatchApi,
  deleteProjectApi,
  createTaskTypeApi,
  updateTaskTypeApi,
  deleteTaskTypeApi,
  createTaskStatusApi,
  updateTaskStatusApi,
  deleteTaskStatusApi,
  createTaskPriorityConfigApi,
  updateTaskPriorityConfigApi,
  deleteTaskPriorityConfigApi,
  createProjectStatusConfigApi,
  updateProjectStatusConfigApi,
  deleteProjectStatusConfigApi,
  createProjectPriorityConfigApi,
  updateProjectPriorityConfigApi,
  deleteProjectPriorityConfigApi,
  changeProjectPhasePatchApi,
  updateProjectDatesPatchApi,
  UpdateProjectPayload,
  updateProjectCustomFieldValuesApi,
  getCustomFieldsApi,
  createCustomFieldApi,
  updateCustomFieldApi,
  deleteCustomFieldApi,
  CustomFieldAPI,
  updateProjectLabelsPatchApi,
  updateProjectLeadersPatchApi,
  attachPortfoliosPatchApi,
  detachPortfoliosPatchApi,
  addMembersToProjectViaTeamPatchApi,
  addUserToProjectFromTeamPatchApi,
  getCycleConfigApi,
  updateCycleConfigApi,
  getParallelCycleConfigsApi,
  createParallelCycleConfigApi,
  updateParallelCycleConfigApi,
  deleteParallelCycleConfigApi,
  getCyclesApi,
  createCycleApi,
  getCycleByIdApi,
  updateCycleApi,
  deleteCycleApi,
  Cycle,
  CycleConfig,
  ParallelCycleConfig,
  StatusHistoryEntry,
  getProjectStatusHistoryApi,
  postProjectStatusHistoryApi,
  restoreProjectApi,
} from "@/lib/api/projects-api";

export type { Cycle, CycleConfig, ParallelCycleConfig };
// import toast from "react-hot-toast";
import { toast } from "@/components/ui/sonner"
import { useTasksStore } from "@/stores/tasks-store"
import { useProfileStore } from "@/stores/profile-store";
import {
  CheckSquare,
  Target,
  CheckCircle,
  Calendar,
  LayoutTemplate,
  LucideIcon,
} from 'lucide-react';
import { mapAPIToStore, mapStoreToAPI } from '@/utils/custom-field-mapper';
import { StringFormatParams } from 'zod/v4/core';
import { useWorkspaceStore } from './workspace-store';

// Icon mapper for task types
export const TASK_TYPE_ICON_MAP: Record<string, LucideIcon> = {
  'CheckSquare': CheckSquare,
  'check-square': CheckSquare,
  'Target': Target,
  'target': Target,
  'CheckCircle': CheckCircle,
  'check-circle': CheckCircle,
  'Calendar': Calendar,
  'calendar': Calendar,
};

// ✅ Helper function to get icon component from task type
export const getTaskTypeIcon = (taskType?: TaskTypeConfig | null): LucideIcon | null => {
  if (!taskType) return null;

  // Try to get icon from icon object first
  if (taskType.icon?.name) {
    return TASK_TYPE_ICON_MAP[taskType.icon.name] || null;
  }

  // Try iconId as fallback
  if (taskType.iconId) {
    return TASK_TYPE_ICON_MAP[taskType.iconId] || null;
  }

  return null;
};

// ✅ Get icon color from task type
export const getTaskTypeIconColor = (taskType?: TaskTypeConfig | null): string => {
  if (!taskType) return '#6366f1';

  // Use icon color if available
  if (taskType.icon?.color) {
    return taskType.icon.color;
  }

  // Fallback to task type color
  return taskType.color || '#6366f1';
};

// ✅ Get default icon for task types without icon
export const getDefaultTaskTypeIcon = (): LucideIcon => {
  return LayoutTemplate;
};

// Default images for backend task types that don't have custom icons
export const DEFAULT_BACKEND_TYPE_IMAGES: Record<string, string> = {
  task: "/images/commandhub/task.svg",
  milestone: "/images/commandhub/milestone.svg",
  approval: "/images/commandhub/approval.svg",
  meeting: "/images/commandhub/meeting.svg",
};

export const getTaskTypeDisplayImage = (
  taskType?: TaskTypeConfig | null
): string | null => {
  if (!taskType) return null;

  if (taskType.displayImage) return taskType.displayImage;

  return DEFAULT_BACKEND_TYPE_IMAGES[taskType.value] ?? null;
};

export const enrichTaskTypeConfig = (
  taskType: TaskTypeConfig
): TaskTypeConfig => {
  return {
    ...taskType,
    displayImage: DEFAULT_BACKEND_TYPE_IMAGES[taskType.value] ?? null,
  };
};

export const enrichTaskTypeConfigs = (
  taskTypes: TaskTypeConfig[] = []
): TaskTypeConfig[] => {
  return taskTypes.map(enrichTaskTypeConfig);
};

const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

export function getProfilePictureUrl(profilePicture?: string | null) {
  if (!profilePicture) return undefined;
  if (profilePicture.startsWith('http')) return profilePicture;
  return `${S3_BASE_URL}/${profilePicture}`;
}


// Add these interfaces after the existing interfaces
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Portfolio {
  id: string
  name: string
  description?: string
  color?: string
}

// Add dummy portfolios data
export const dummyPortfolios: Portfolio[] = [
  {
    id: 'portfolio-1',
    name: 'Portfolio AAA',
    description: 'Marketing and growth initiatives',
    color: '#3B82F6'
  },
  {
    id: 'portfolio-2',
    name: 'Portfolio BBB',
    description: 'Product development projects',
    color: '#10B981'
  },
  {
    id: 'portfolio-3',
    name: 'Portfolio CCC',
    description: 'Customer success and support',
    color: '#F59E0B'
  },
  {
    id: 'portfolio-4',
    name: 'Portfolio DDD',
    description: 'Engineering and infrastructure',
    color: '#8B5CF6'
  }
]


export interface ProjectStatusConfig {
  _id: string;           // was: id
  value: string;         // was: name (slug form, e.g. "on_track")
  label: string;         // was: name (display form, e.g. "On Track")
  description?: string;
  color: string;
  order: number;
}


export interface TaskStatusConfig {
  _id: string;
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
  isFinal?: boolean;
}


// export interface WorkItemType {
//   id: string;
//   name: string;
//   pluralName?: string;
//   description?: string;
//   icon?: any; // You might want to type this better if possible, e.g., string or object
//   projectId: string;
//   order: number;
//   isDefault?: boolean;
// }
export interface Feature {
  id: string;
  name: string;
  description: string;
  icon?: string;
  projectId: string;
  isEnabled: boolean;
  order: number;
  isDefault?: boolean;
}
export interface RepeatingWorkSection {
  id: string;
  title: string;
  description: string;
  projectId: string;
  isEnabled: boolean;
  order: number;
  type: 'recurring-tasks' | 'recurring-milestones';
}

export interface ProjectCustomField {
  id: string;
  name: string;
  type: 'select-one' | 'select-many';
  description?: string;
  options: string[];
  required?: boolean;
  [key: string]: any;
}

export interface TaskCustomField {
  id: string;
  name: string;
  type: 'select-one' | 'select-many' | 'text' | 'textarea' | 'label' | 'number' |
  'website' | 'email' | 'phone' | 'checkbox' | 'date' | 'budget' | 'formula' | 'rating' | 'people' |
  'rollup' | 'voting' | 'location' | 'ip-address' | 'social-media' | 'auto-number' | 'field-difference' | 'tshirt-size';
  projectId: string;
  description?: string;
  required?: boolean
  options: (string | { value: string; color: string })[];
  defaultValue?: string | number;
  defaultSelected?: string[];
  sortOrder?: 'manual' | 'alphabetical-az' | 'alphabetical-za';
  numberFormat?: 'number' | 'percentage' | 'currency' | 'customLabel' | 'none';
  decimalPlaces?: number;
  currency?: string; // Used by both 'number' and 'budget' types
  customLabel?: string;
  labelPosition?: 'left' | 'right';
  hyperlink?: boolean;
  emojiType?: string; // Used by rating and voting
  maxRating?: number;
  prefix?: string;
  startFrom?: number;
  template?: string;
  expression?: {
    field1: string;
    operator: '+' | '-' | '*' | '/';
    field2: string;
  };
  relatedTo?: 'date' | 'number';
  difference?: {
    field1: string;
    field2: string;
  };
  outputFormat?: 'days' | 'hours';
  showMembers?: boolean;
  showGuests?: boolean;
  includeFromTeam?: boolean;
  selectedTeams?: string[];   // max 1 item
}

export interface FilterCriteria {
  id: string;
  field: string;
  condition: string;
  value: any;
  operator?: "AND" | "OR";
}

export interface FilterBlock {
  id: string;
  operator: "AND" | "OR";
  children: FilterCriteria[];
}

export interface TailoredView {
  id: string;
  name: string;
  identifier: string;
  description?: string;
  type: View['type'];
  projectId: string;
  userId: string;
  icon?: {
    iconId: string;
    type: "icon" | "file";
    name: string;
    color: string;
    presignedUrl?: string;
  } | null;
  iconId?: string | null;
  color?: string;
  filters: FilterBlock;
  groupBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface View {
  id: string;
  name: string;
  type: 'overview' | 'list' | 'calendar' | 'kanban' | 'gantt' | 'form' | 'attachments' | 'notes' | 'listTree' | 'whiteboard' | 'discussions';
  projectId: string;
  isDefault?: boolean;
  order?: number;
  category?: 'default' | 'custom';
  icon?: string;
}

export interface TaskTypeConfig {
  _id: string;
  value: string;
  label: string;
  pluralLabel?: string;
  description: string;
  color: string;
  order: number;
  // ✅ Icon structure matching backend format
  icon?: {
    iconId: string;
    type: "icon" | "file";
    name: string;
    color: string;
    presignedUrl?: string;
  } | null;
  iconId?: string | null;

  displayImage?: string | null;
}

export interface ProjectPriorityConfig {
  _id: string;
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
}

export interface TaskPriorityConfig {
  _id: string;
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
}

// Update Project interface to match API response (around line 100)
export interface Project {
  id?: string; // ✅ Required now (from API)
  name: string;
  status?: string;
  description?: string;
  slug?: string; // ✅ Add slug
  portfolioId?: string; // ✅ Add from API
  linkedPortfolios?: string[]; // ✅ Add from API
  leaders?: string[]; // ✅ Add from API
  viewers?: string[]; // ✅ Add from API
  members?: Array<{ userId: string; role: string }>; // ✅ Add from API
  phase?: string
  labelIds?: string[]; // ✅ Add from API

  // Icon fields - matching API response
  icon?: {
    iconId: string;
    type: "icon" | "file";
    name: string;
    color: string;
    presignedUrl?: string;
  } | null;
  iconId?: string | null;
  color?: string;

  priority?: string;
  projectLeader?: string; // ✅ Keep for backward compatibility
  privacy?: 'private' | 'public';
  linkedPortfolio?: string; // ✅ Keep for backward compatibility
  projectDate?: string;
  startDate?: string;
  endDate?: string;
  customFields?: TaskCustomField[];
  customFieldValues?: Record<string, string>;
  customFieldsConfig?: ProjectCustomField[];
  projectStatusConfig?: ProjectStatusConfig[];
  taskTypeConfig?: TaskTypeConfig[]; // Custom task types from API
  projectPriorityConfig?: ProjectPriorityConfig[];
  taskStatusConfig?: TaskStatusConfig[];
  taskPriorityConfig?: TaskPriorityConfig[];

  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: "file";
    status: "completed";
    createdAt: string;
    updatedAt: string;
    uploadedBy: string;
  }>;

  labels?: Array<{ id: string; name: string; color: string }>; // ✅ Add labels from API

  linkedDocuments?: string[];

  // API timestamps
  createdAt?: string;
  updatedAt?: string;

  // Cycle fields
  cycleConfig?: CycleConfig;
  parallelCycleConfigs?: ParallelCycleConfig[];
  cycles?: Cycle[];
  usesParallelCycleConfigs?: boolean;
  statusHistory?: StatusHistoryEntry[];
  currentProjectUpdate?: string;
}

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  customViews: View[];
  tailoredViews: TailoredView[];
  activeViewIds: Record<string, string>;
  viewLayout: 'list' | 'grid';
  // workItemTypes: WorkItemType[];
  features: Feature[];
  repeatingWorkSections: RepeatingWorkSection[];
  fetchProjectStatusHistory: (projectId: string) => Promise<void>;
  postProjectStatusHistory: (projectId: string, status: string, message: string) => Promise<void>;

  //document related actions
  addDocumentToProject: (projectId: string, docId: string) => void;
  removeDocumentFromProject: (projectId: string, docId: string) => void;
  getLinkedDocuments: (projectId: string) => string[];

  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<Project | null>;
  addProject: (project: Project) => Promise<string>;
  updateProject: (id: string, project: Partial<Project>) => void;
  updateProjectCustomFieldValue: (projectId: string, fieldId: string, fieldName: string, value: any) => Promise<void>;
  duplicateProject: (id: string, newName?: string, mode?: string, selectedFieldIds?: string[]) => Promise<string> | null;
  updateProjectDates: (id: string, startDate?: string, endDate?: string) => void; // Add this
  updateProjectPriority: (id: string, priority: string) => void; // Add this
  updateProjectLeaders: (projectId: string, leaderIds: string[]) => Promise<void>;

  getMembersByProject: (projectId: string) => Array<{
    userId: string;
    role: string;
    name?: string;
    email?: string;
    avatar?: string | null;
  }>;

  // ✅ Update existing actions to use API
  renameProject: (id: string, newName: string) => Promise<void>;
  updateProjectStatus: (id: string, status: "active" | "planning" | "completed" | "on-hold") => Promise<void>;
  addViewersToProject: (projectId: string, viewerIds: string[]) => Promise<void>;
  removeViewersFromProject: (projectId: string, viewerIds: string[]) => Promise<void>;
  addMembersToProject: (projectId: string, members: Array<{ userId: string; role: string }>) => Promise<void>;
  addMembersToProjectViaTeam: (projectId: string, teamId: string) => Promise<void>;
  addUserToProjectFromTeam: (projectId: string, members: Array<{ userId: string; role: string; teamId: string }>) => Promise<void>;

  removeMembersFromProject: (projectId: string, userIds: string[]) => Promise<void>;
  updateProjectIcon: (projectId: string, iconId: string) => Promise<void>;
  attachUploadsToProject: (projectId: string, uploadIds: string[]) => Promise<void>;
  removeUploadsFromProject: (projectId: string, uploadIds: string[]) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
  updateProjectPhase: (projectId: string, state: string) => Promise<void>;
  updateProjectLabels: (projectId: string, labelIds: string[]) => Promise<void>;
  attachPortfoliosToProject: (projectId: string, portfolioIds: string[]) => Promise<void>;
  detachPortfoliosFromProject: (projectId: string, portfolioIds: string[]) => Promise<void>;

  fetchViews: (projectId: string) => Promise<void>;
  addView: (view: View) => void;
  updateView: (id: string, view: Partial<View>) => void;
  deleteView: (id: string) => void;
  setActiveView: (projectId: string, viewId: string) => void;
  getActiveViewId: (projectId: string) => string | null;
  reorderView: (projectId: string, viewId: string, newOrder: number) => void;
  setViewLayout: (layout: 'list' | 'grid') => void;

  // Tailored Views (Saved Filters)
  addTailoredView: (view: TailoredView) => Promise<void>;
  updateTailoredView: (id: string, updates: Partial<TailoredView>) => Promise<void>;
  deleteTailoredView: (id: string) => Promise<void>;
  getTailoredViewsByProject: (projectId: string) => TailoredView[];
  setTailoredViews: (views: TailoredView[]) => void;
  syncTailoredViewsToBackend: (views: TailoredView[]) => Promise<void>;

  addFeature: (feature: Omit<Feature, 'id' | 'order'>) => string;
  updateFeature: (id: string, updates: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;
  toggleFeature: (id: string) => void;
  getFeaturesByProject: (projectId: string) => Feature[];

  toggleRepeatingWorkSection: (id: string) => void;
  getRepeatingWorkByProject: (projectId: string) => RepeatingWorkSection[];

  // Task Type Config Actions
  getTaskTypesByProject: (projectId: string) => TaskTypeConfig[];
  addTaskTypeToProject: (projectId: string, taskType: Omit<TaskTypeConfig, '_id'>) => Promise<void>;
  updateTaskTypeInProject: (projectId: string, typeId: string, updates: Partial<TaskTypeConfig>) => Promise<void>;
  deleteTaskTypeFromProject: (projectId: string, typeId: string) => Promise<void>;

  // Project Status Config Actions
  getProjectStatusConfigs: (projectId: string) => ProjectStatusConfig[];
  addProjectStatusConfig: (projectId: string, data: Omit<ProjectStatusConfig, '_id' | 'order'>) => Promise<void>;
  updateProjectStatusConfig: (projectId: string, statusId: string, data: Partial<ProjectStatusConfig>) => Promise<void>;
  deleteProjectStatusConfig: (projectId: string, statusId: string) => Promise<void>;

  // Project Priority Config Actions
  getProjectPriorityConfigs: (projectId: string) => ProjectPriorityConfig[];
  addProjectPriorityConfig: (projectId: string, data: Omit<ProjectPriorityConfig, '_id'>) => Promise<void>;
  updateProjectPriorityConfig: (projectId: string, priorityId: string, data: Partial<Omit<ProjectPriorityConfig, '_id'>>) => Promise<void>;
  deleteProjectPriorityConfig: (projectId: string, priorityId: string) => Promise<void>;

  // Task Status Config Actions
  getTaskStatusConfigs: (projectId: string) => TaskStatusConfig[];
  addTaskStatusConfig: (projectId: string, status: Omit<TaskStatusConfig, '_id' | 'order'>) => Promise<string>;
  updateTaskStatusConfig: (projectId: string, statusId: string, updates: Partial<TaskStatusConfig>) => Promise<void>;
  deleteTaskStatusConfig: (projectId: string, statusId: string) => Promise<void>;

  // Task Priority Config Actions
  getTaskPriorityConfigs: (projectId: string) => TaskPriorityConfig[];
  addTaskPriorityConfig: (projectId: string, data: Omit<TaskPriorityConfig, '_id'>) => Promise<void>;
  updateTaskPriorityConfig: (projectId: string, priorityId: string, data: Partial<Omit<TaskPriorityConfig, '_id'>>) => Promise<void>;
  deleteTaskPriorityConfig: (projectId: string, priorityId: string) => Promise<void>;

  // Task-level custom field CRUD (definitions live in project.customFields)
  fetchTaskCustomFields: (projectId: string) => Promise<void>;
  getTaskCustomFields: (projectId: string) => TaskCustomField[];
  getTaskCustomFieldById: (projectId: string, fieldId: string) => TaskCustomField | undefined;
  addTaskCustomField: (projectId: string, fieldData: Omit<TaskCustomField, 'id' | 'projectId'>) => Promise<string>;
  updateTaskCustomField: (projectId: string, fieldId: string, updates: Partial<TaskCustomField>) => Promise<void>;
  updateTaskCustomFieldOptions: (projectId: string, fieldId: string, options: (string | { value: string; color: string })[]) => void;
  deleteTaskCustomField: (projectId: string, fieldId: string) => Promise<void>;
  deleteTaskCustomFieldOption: (projectId: string, fieldId: string, optionToDelete: string) => void;

  // Cycle Actions
  fetchCycleConfig: (projectId: string) => Promise<void>;
  updateCycleConfig: (projectId: string, payload: Partial<CycleConfig>) => Promise<void>;
  fetchParallelCycleConfigs: (projectId: string) => Promise<void>;
  createParallelCycleConfig: (projectId: string, payload: Partial<ParallelCycleConfig> & {
    cycleName?: string;
    description?: string;
    slug?: string;
    cycleNumber?: number;
    sortOrder?: number;
    status?: string;
    endDate?: string;
  }) => Promise<string>;
  updateParallelCycleConfig: (projectId: string, cycleConfigId: string, payload: Partial<ParallelCycleConfig>) => Promise<void>;
  deleteParallelCycleConfig: (projectId: string, cycleConfigId: string) => Promise<void>;
  fetchCycles: (projectId: string, params?: { status?: string; startAfter?: string; startBefore?: string; cycleConfigId?: string }) => Promise<void>;
  createCycle: (projectId: string, payload: Partial<Cycle>) => Promise<void>;
  updateCycle: (projectId: string, cycleId: string, payload: Partial<Cycle>) => Promise<void>;
  deleteCycle: (projectId: string, cycleId: string) => Promise<void>;

  reset: () => void;
}

// Default statuses to be added to each new project
// export const defaultStatuses = [
//   { name: 'On Track', color: '#22C55E', backgroundColor: '#DCFCE7' },
//   { name: 'At Risk', color: '#EF4444', backgroundColor: '#FEE2E2' },
//   { name: 'Off Track', color: '#F97316', backgroundColor: '#FFEDD5' },
//   { name: 'On Hold', color: '#3B82F6', backgroundColor: '#DBEAFE' },
// ];

// Default work state groups for new projects
// export const defaultWorkStateGroups = [
//   { name: 'Backlog', color: '#EF4444' },
//   { name: 'Unstarted', color: '#3B82F6' },
//   { name: 'Started', color: '#F59E0B' },
//   { name: 'Completed', color: '#10B981' },
//   { name: 'Cancelled', color: '#6B7280' },
// ];

// Default work item types for new projects
// export const defaultWorkItemTypes = [
//   { name: 'Task' },
//   { name: 'Milestone' },
//   { name: 'Approval' },
//   { name: 'Meeting' },
//   { name: 'Group' },
// ];

// Default features for new projects
export const defaultFeatures = [
  {
    name: 'Time management',
    description: 'Keep your work hours organized and on track with easy-to-manage timesheets.',
    icon: '📄',
    isEnabled: false,
  },
  {
    name: 'Feature',
    description: 'Feature subtext',
    icon: '📄',
    isEnabled: false,
  },
];

// Default repeating work sections for new projects
export const defaultRepeatingWorkSections = [
  {
    title: 'Recurring Tasks',
    description: 'Configure tasks that repeat on a set schedule.',
    isEnabled: false,
    type: 'recurring-tasks' as const,
  },
  {
    title: 'Recurring Milestones',
    description: 'Set milestones to recur automatically based on your project timeline.',
    isEnabled: false,
    type: 'recurring-milestones' as const,
  },
];

// Define this helper once, above useProjectsStore
// Define above useProjectsStore
const mapAttachment = (att: any): {
  id: string; fileName: string; fileSize: number; mimeType: string;
  type: 'file'; status: 'completed'; createdAt: string; updatedAt: string; uploadedBy: string;
} | null => {
  if (typeof att === 'object' && att !== null) {
    return {
      id: att.id ?? att._id,
      fileName: att.fileName ?? 'Unknown',
      fileSize: att.fileSize ?? 0,
      mimeType: att.mimeType ?? 'application/octet-stream',
      type: 'file' as const,
      status: 'completed' as const,
      createdAt: att.createdAt ?? new Date().toISOString(),
      updatedAt: att.updatedAt ?? new Date().toISOString(),
      uploadedBy: att.uploadedBy ?? '',
    };
  }
  if (typeof att === 'string') {
    return {
      id: att,
      fileName: 'Unknown',
      fileSize: 0,
      mimeType: 'application/octet-stream',
      type: 'file' as const,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedBy: '',
    };
  }
  return null;
};

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      isLoading: false,
      error: null,
      customViews: [],
      tailoredViews: [],
      activeViewIds: {},
      viewLayout: 'list',
      // workItemTypes: [],
      features: [],
      repeatingWorkSections: [],


      // Update the fetchProjects implementation
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const apiProjects = await getAllProjects();
          // console.log("fetching projects from API:", apiProjects)

          const mappedProjects: Project[] = apiProjects.map((apiProject) => {
            return {
              id: apiProject.id,
              name: apiProject.name,
              description: apiProject.description,
              slug: apiProject.slug,
              startDate: apiProject.startDate,
              endDate: apiProject.endDate,
              status: apiProject.status,
              linkedPortfolios: apiProject.linkedPortfolios || [],
              leaders: apiProject.leaders || [],
              viewers: apiProject.viewers || [],
              members: apiProject.members || [],
              phase: apiProject.state,
              // priority: mapApiPriorityToLocal(apiProject.priority),
              priority: apiProject.priority,
              privacy: apiProject.privacy as any,
              // ✅ Project-level field schema & values (for Overview, settings panels)
              customFieldsConfig: apiProject.customFieldsConfig ?? [],      // field definitions
              customFieldValues: apiProject.customFieldValues ?? {},         // project-level values

              // ✅ Task-level field definitions (for List view columns, task rows)
              customFields: (apiProject.customFields ?? []).map(f => mapAPIToStore(f, apiProject.id)),                   // task field schema
              // taskTypeConfig: apiProject.taskTypeConfig || [],
              taskTypeConfig: enrichTaskTypeConfigs(apiProject.taskTypeConfig ?? []),
              labels: apiProject.labels || [], // ✅ Add labels
              createdAt: apiProject.createdAt,
              updatedAt: apiProject.updatedAt,

              // Icon handling
              iconId: apiProject.iconId || apiProject.icon?.iconId || null,
              icon: apiProject.icon, // Store the entire icon object
              color: apiProject.icon?.color || "#3B82F6",

              // ✅ FIX: Ensure attachments are objects, not just IDs
              // attachments: Array.isArray(apiProject.attachments)
              //   ? apiProject.attachments.map(att => {
              //     // If attachment is already an object with properties, use it
              //     if (typeof att === 'object' && att !== null && 'id' in att && 'fileName' in att) {
              //       return {
              //         ...att,  // Keeps fileName, fileSize, mimeType, etc.
              //         // Add any missing defaults if needed
              //       };
              //     }
              //     // If attachment is just a string (ID), create an object
              //     if (typeof att === 'string') {
              //       return {
              //         id: att,
              //         fileName: 'Unknown',
              //         fileSize: 0,
              //         mimeType: 'application/octet-stream',
              //         type: 'file' as const,
              //         status: 'completed' as const,
              //         createdAt: new Date().toISOString(),
              //         updatedAt: new Date().toISOString(),
              //         uploadedBy: ''
              //       };
              //     }
              //     return att;
              //   }).filter(Boolean)
              //   : [],
              // attachments: apiProject.attachments ?? [],
              attachments: Array.isArray(apiProject.attachments)
                ? apiProject.attachments.map(mapAttachment).filter((att): att is NonNullable<typeof att> => att !== null)
                : [],

              // UI-specific fields
              projectLeader: apiProject.leaders?.[0],
              linkedPortfolio: apiProject.portfolioId,

              // Cycle fields
              cycleConfig: apiProject.cycleConfigs?.find(c => c && c.id !== null),
              parallelCycleConfigs: apiProject.cycleConfigs || [],
              usesParallelCycleConfigs: apiProject.usesParallelCycleConfigs,
            };
          });
          // console.log("mapped projects:", mappedProjects)

          // merge to preserve rich fields already loaded by fetchProjectById:
          set((state) => {
            const mergedProjects = mappedProjects.map((incoming) => {
              const existing = state.projects.find((p) => p.id === incoming.id);
              if (!existing) return incoming;

              return {
                ...incoming,
                // Preserve these — fetchProjects list API never returns them
                taskTypeConfig: existing.taskTypeConfig?.length
                  ? existing.taskTypeConfig
                  : [],
                taskStatusConfig: existing.taskStatusConfig?.length
                  ? existing.taskStatusConfig
                  : [],
                taskPriorityConfig: existing.taskPriorityConfig?.length
                  ? existing.taskPriorityConfig
                  : [],
                projectStatusConfig: existing.projectStatusConfig?.length
                  ? existing.projectStatusConfig
                  : [],
                projectPriorityConfig: existing.projectPriorityConfig?.length
                  ? existing.projectPriorityConfig
                  : [],
                customFieldsConfig: existing.customFieldsConfig?.length
                  ? existing.customFieldsConfig
                  : [],
                customFieldValues: Object.keys(existing.customFieldValues || {}).length
                  ? existing.customFieldValues
                  : {},
                attachments: existing.attachments?.some(a => a.fileName !== 'Unknown')
                  ? existing.attachments
                  : incoming.attachments,
                cycles: existing.cycles?.length ? existing.cycles : [],
              };
            });

            return { projects: mergedProjects, isLoading: false, error: null };
          });

          // Update sidebar
          try {
            const { useSidebarStore } = require("@/stores/sidebar-store");
            useSidebarStore.getState().updateMenuItemSubmenu("project",
              mappedProjects.map((p) => ({
                key: `project-${p.id}`,
                label: p.name,
                href: `/project/${p.id}`,
              }))
            );
          } catch (error) {
            console.error("Failed to update sidebar", error);
          }
        } catch (error: any) {
          console.error("Fetch Projects Error:", error);
          set({
            error: error.response?.data?.message || "Failed to fetch projects",
            isLoading: false,
          });
        }
      },

      // Update fetchProjectById similarly
      fetchProjectById: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const apiProject = await getProjectById(projectId);

          // ✅ ADD THIS — see raw API shape
          // console.group(`📦 RAW API — fetchProjectById(${projectId})`);
          // console.log("taskTypeConfig:", apiProject.taskTypeConfig);
          // console.log("taskStatusConfig:", apiProject.taskStatusConfig);
          // console.log("projectStatusConfig:", apiProject.projectStatusConfig);
          // console.log("Full raw:", apiProject);
          // console.groupEnd();

          const mappedProject: Project = {
            id: apiProject.id,
            name: apiProject.name,
            description: apiProject.description,
            slug: apiProject.slug,
            status: apiProject.status,
            startDate: apiProject.startDate,
            endDate: apiProject.endDate,
            linkedPortfolios: apiProject.linkedPortfolios || [],
            phase: apiProject.state,
            leaders: apiProject.leaders || [],
            viewers: apiProject.viewers || [],
            members: apiProject.members || [],
            // priority: mapApiPriorityToLocal(apiProject.priority),
            priority: apiProject.priority,
            privacy: apiProject.privacy as any,
            // ✅ Project-level field schema & values (for Overview, settings panels)
            customFieldsConfig: apiProject.customFieldsConfig ?? [],      // field definitions
            customFieldValues: apiProject.customFieldValues ?? {},         // project-level values

            // ✅ Task-level field definitions (for List view columns, task rows)
            customFields: (apiProject.customFields ?? []).map(f => mapAPIToStore(f, apiProject.id)),                   // task field schema
            projectStatusConfig: apiProject.projectStatusConfig || [],
            projectPriorityConfig: apiProject.projectPriorityConfig || [],
            // taskTypeConfig: apiProject.taskTypeConfig || [],
            taskTypeConfig: enrichTaskTypeConfigs(apiProject.taskTypeConfig ?? []),
            taskStatusConfig: apiProject.taskStatusConfig || [],
            taskPriorityConfig: apiProject.taskPriorityConfig || [],
            labels: apiProject.labels || [], // ✅ Add labels
            createdAt: apiProject.createdAt,
            updatedAt: apiProject.updatedAt,
            // attachments: Array.isArray(apiProject.attachments)
            //   ? apiProject.attachments.map(att => {
            //     if (typeof att === 'object' && att !== null && 'id' in att && 'fileName' in att) {
            //       return { ...att };  // Keeps real fileName from API
            //     }
            //     if (typeof att === 'string') {
            //       return {
            //         id: att,
            //         fileName: 'Unknown',
            //         fileSize: 0,
            //         mimeType: 'application/octet-stream',
            //         type: 'file' as const,
            //         status: 'completed' as const,
            //         createdAt: new Date().toISOString(),
            //         updatedAt: new Date().toISOString(),
            //         uploadedBy: ''
            //       };
            //     }
            //     return att;
            //   }).filter(Boolean)
            //   : [],

            // attachments: apiProject.attachments ?? [],
            attachments: Array.isArray(apiProject.attachments)
              ? apiProject.attachments.map(mapAttachment).filter((att): att is NonNullable<typeof att> => att !== null)
              : [],


            // Icon handling
            iconId: apiProject.iconId || apiProject.icon?.iconId || null,
            icon: apiProject.icon, // Store entire icon object
            color: apiProject.icon?.color || "#3B82F6",

            // UI fields
            projectLeader: apiProject.leaders?.[0],
            linkedPortfolio: apiProject.portfolioId,

            // Cycle fields
            cycleConfig: apiProject.cycleConfigs?.find(c => c && c.id !== null),
            parallelCycleConfigs: apiProject.cycleConfigs || [],
            usesParallelCycleConfigs: apiProject.usesParallelCycleConfigs,
          };

          // ✅ ADD THIS — see what actually gets stored
          // console.group(`✅ MAPPED — fetchProjectById(${projectId})`);
          // console.log("taskTypeConfig:", mappedProject.taskTypeConfig);
          // console.log("taskStatusConfig:", mappedProject.taskStatusConfig);
          // console.log("projectStatusConfig:", mappedProject.projectStatusConfig);
          // console.log("Full mapped:", mappedProject);
          // console.groupEnd();

          set((state) => {
            const existingIndex = state.projects.findIndex((p) => p.id === projectId);
            if (existingIndex >= 0) {
              const updatedProjects = [...state.projects];
              updatedProjects[existingIndex] = {
                ...mappedProject,
                cycles: state.projects[existingIndex].cycles || []
              };
              return { projects: updatedProjects, isLoading: false };
            } else {
              return {
                projects: [...state.projects, mappedProject],
                isLoading: false
              };
            }
          });

          return mappedProject;
        } catch (error: any) {
          console.error("Fetch Project By ID Error:", error);
          set({
            error: error.response?.data?.message || "Failed to fetch project",
            isLoading: false,
          });
          return null;
        }
      },

      addProject: async (project) => {
        let projectId = project.id || `project-${Date.now()}`;
        console.log("Adding project:", project);

        if (project.name) {
          try {

            const apiPayload: any = {
              name: project.name,
              description: project.description || `${project.name} project`,
              slug: project.slug,
            };

            // Only add fields if they have valid values
            if (project.linkedPortfolios && project.linkedPortfolios.length > 0) {
              apiPayload.linkedPortfolios = project.linkedPortfolios;
            } else if (project.linkedPortfolio) {
              apiPayload.portfolioId = project.linkedPortfolio;
              apiPayload.linkedPortfolios = [project.linkedPortfolio];
            }

            if (project.projectLeader) {
              apiPayload.leaders = [project.projectLeader];
            }

            // Handle priority - only add if it's a valid value (not empty or clear)
            if (project.priority) {
              apiPayload.priority = project.priority;
            }

            if (project.privacy) {
              apiPayload.privacy = project.privacy;
            }

            if (project.iconId) {
              apiPayload.iconId = project.iconId;
            }

            if (project.startDate) {
              apiPayload.startDate = new Date(project.startDate).toISOString();
            }

            if (project.endDate) {
              apiPayload.endDate = new Date(project.endDate).toISOString();
            }

            if (project.phase) {
              apiPayload.state = project.phase;
            }

            console.log("API Payload:", apiPayload);

            const apiResponse = await createProject(apiPayload);
            console.log("project created response", apiResponse);

            projectId = apiResponse.id;

            // Update project with API response data
            project = {
              ...project,
              id: apiResponse.id,
              status: apiResponse.status as any,
              phase: apiResponse.state,
              linkedPortfolio: apiResponse.portfolioId,
              // Map the icon from API response
              icon: apiResponse.icon,
              iconId: apiResponse.iconId || apiResponse.icon?.iconId || null,
              color: apiResponse.icon?.color || project.color || "#3B82F6",
            };
          } catch (error) {
            console.error("Failed to create project on backend:", error);
            throw error;
          }
        }

        // Add to store only after successful API call
        set((state) => ({
          projects: [
            ...state.projects,
            { ...project, customFields: project.customFields ?? [] }
          ],
        }));


        // defaultWorkItemTypes.forEach((type) => {
        //   get().addWorkItemType({
        //     ...type,
        //     projectId: projectId,
        //     isDefault: true,
        //   });
        // });

        defaultFeatures.forEach((feature) => {
          get().addFeature({
            ...feature,
            projectId: projectId,
            isDefault: true,
          });
        });

        defaultRepeatingWorkSections.forEach((section) => {
          const id = `repeat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          set((state) => ({
            repeatingWorkSections: [
              ...state.repeatingWorkSections,
              {
                id,
                ...section,
                projectId: projectId,
                order: state.repeatingWorkSections.filter(s => s.projectId === projectId).length,
              },
            ],
          }));
        });

        // Sidebar update
        try {
          const { useSidebarStore } = require('./sidebar-store');
          const allProjects = get().projects;
          useSidebarStore.getState().updateMenuItemSubmenu(
            'project',
            allProjects.map((p) => ({
              key: `project-${p.id}`,
              label: p.name,
              href: `/project/${p.id}`,
            }))
          );
        } catch (error) {
          console.error('Failed to update sidebar:', error);
        }

        return projectId;
      },

      updateProject: async (id: string, updatedFields: Partial<Project>) => {
        // 1️⃣ Build API payload — only include fields updateProjectApi supports
        const apiPayload: UpdateProjectPayload = {};
        if (updatedFields.name !== undefined)
          apiPayload.name = updatedFields.name;
        if (updatedFields.description !== undefined)
          apiPayload.description = updatedFields.description;
        if (updatedFields.slug !== undefined)
          apiPayload.slug = updatedFields.slug;
        if (updatedFields.priority !== undefined)
          apiPayload.priority = updatedFields.priority;
        if (updatedFields.status !== undefined)
          apiPayload.status = updatedFields.status;
        if (updatedFields.privacy !== undefined)
          apiPayload.privacy = updatedFields.privacy;
        if (updatedFields.startDate !== undefined)
          apiPayload.startDate = updatedFields.startDate;
        if (updatedFields.endDate !== undefined)
          apiPayload.endDate = updatedFields.endDate;
        if (updatedFields.phase !== undefined)
          apiPayload.state = updatedFields.phase;
        if (updatedFields.projectLeader !== undefined)
          apiPayload.leaders = [updatedFields.projectLeader];
        if (updatedFields.linkedPortfolio !== undefined)
          apiPayload.portfolioId = updatedFields.linkedPortfolio;

        // 2️⃣ Only call API if there's something to send
        if (Object.keys(apiPayload).length > 0) {
          try {
            const updated = await updateProjectApi(id, apiPayload);
            // 3️⃣ Update state ONLY after API succeeds, using server response
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === id
                  ? {
                    ...p,
                    ...updatedFields,                          // apply local non-API fields too
                    startDate: updated.startDate ?? p.startDate,
                    endDate: updated.endDate ?? p.endDate,
                    phase: updated.state ?? p.phase,
                    status: updated.status ?? p.status,
                    priority: updated.priority ?? p.priority,
                    name: updated.name ?? p.name,
                    description: updated.description ?? p.description,
                    privacy: updated.privacy ?? p.privacy,
                  }
                  : p
              ),
            }));
          } catch (error: any) {
            console.error('Failed to update project:', error);
            toast("error", {
              title: "Failed to save project changes",
            })
            // No rollback needed — state was never changed
          }
        }

        // 4️⃣ Sidebar sync
        try {
          const { useSidebarStore } = require('./sidebar-store');
          const allProjects = get().projects;
          useSidebarStore.getState().updateMenuItemSubmenu(
            'project',
            allProjects.map((p) => ({
              key: `project-${p.id}`,
              label: p.name,
              href: `/project/${p.id}`,
            }))
          );
        } catch (e) {
          console.error('Failed to update sidebar:', e);
        }
      },

      updateProjectCustomFieldValue: async (
        projectId: string,
        fieldId: string,
        fieldName: string,
        value: any
      ) => {
        try {
          // 1️⃣ Call API first
          const apiValues: Record<string, any> = {
            [fieldName]: value,
          };
          await updateProjectCustomFieldValuesApi(projectId, apiValues);

          // 2️⃣ Update state ONLY after API succeeds
          const currentProject = get().projects.find(p => p.id === projectId);
          const existingValues = currentProject?.customFieldValues || {};
          const mergedLocalValues = {
            ...existingValues,
            [fieldId]: value,
            [fieldName]: value,
          };

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, customFieldValues: mergedLocalValues }
                : p
            ),
          }));
        } catch (error: any) {
          console.error('Failed to update custom field value:', error);
          toast("error", {
            title: "Failed to save custom field",
          })
          // No rollback needed — state was never changed
        }
      },

      // AFTER
      duplicateProject: (id: string, newName?: string, mode?: string, selectedFieldIds?: string[]) => {
        console.log(`Duplicating project ${id} with new name "${newName}", mode: ${mode}, selected fields: ${selectedFieldIds}`);
        const state = get();
        const projectToDuplicate = state.projects.find((p) => p.id === id);
        if (!projectToDuplicate) return null;

        const finalName = newName || `${projectToDuplicate.name} (Copy)`;

        const slug = finalName.slice(0, 3).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        const newProjectId = `project-${Date.now()}`;
        const newProject: Project = {
          ...projectToDuplicate,
          id: newProjectId,
          name: finalName,
          description: `${projectToDuplicate.description || ''} (Duplicated)`,
          slug: slug,  // ← unique slug, not copied from original
        };

        const result = get().addProject(newProject);
        return result;
      },

      updateProjectDates: async (id: string, startDate?: string, endDate?: string) => {
        try {
          const updated = await updateProjectDatesPatchApi(id, startDate, endDate);
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id
                ? {
                  ...p,
                  startDate: updated.startDate ?? startDate,
                  endDate: updated.endDate ?? endDate,
                }
                : p
            ),
          }));
        } catch (error: any) {
          console.error('Failed to update project dates:', error);
          toast("error", {
            title: "Failed to save project dates",
          })
        }
      },

      updateProjectPriority: async (
        id: string,
        priority: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🎯 Updating project priority:', { id, priority });

          const updatedProject = await updateProjectPriorityPatchApi(id, priority);

          console.log('✅ Priority updated:', updatedProject);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id
                ? {
                  ...p,
                  priority: updatedProject.priority || priority,
                  updatedAt: updatedProject.updatedAt || new Date().toISOString(),
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Project priority updated successfully!',
          })

          // Optional: Refresh project to ensure sync
          await get().fetchProjectById(id);
        } catch (error: any) {
          console.error('❌ Update Priority Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to update priority',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to update priority",
          })
          throw error;
        }
      },

      updateProjectLeaders: async (projectId: string, leaderIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🎯 Updating project leaders:', { projectId, leaderIds });

          const updatedProject = await updateProjectLeadersPatchApi(projectId, leaderIds);

          console.log('✅ Leaders updated:', updatedProject);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  leaders: updatedProject.leaders || leaderIds,
                  projectLeader: updatedProject.leaders?.[0] || leaderIds[0],
                  updatedAt: updatedProject.updatedAt || new Date().toISOString(),
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Project leaders updated successfully!',
          })

          // Refresh project to ensure sync
          await get().fetchProjectById(projectId);
        } catch (error: any) {
          console.error('❌ Update Leaders Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to update leaders',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to update leaders",
          })
          throw error;
        }
      },

      getMembersByProject: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        if (!project?.members) return [];

        const { workspaceMembers } = useWorkspaceStore.getState();

        return project.members.map(({ userId, role }) => {
          const profile = workspaceMembers.find(wm => wm.userId === userId);
          return {
            userId,
            role,
            name: profile?.name ?? profile?.email ?? userId,
            email: profile?.email,
            avatar: profile?.profilePicture,
          };
        });
      },

      // 1️⃣ Rename Project (UPDATE existing function)
      renameProject: async (id: string, newName: string) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await renameProjectPatchApi(id, newName);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id ? { ...p, name: updatedProject.name } : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Project renamed successfully!',
          })

        } catch (error: any) {
          console.error('Rename Project Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to rename project',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to rename project",
          })
          throw error;
        }
      },

      // 2️⃣ Update Project Status (UPDATE existing function)
      updateProjectStatus: async (id: string, status: "active" | "planning" | "completed" | "on-hold") => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await updateProjectStatusPatchApi(id, status);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id ? { ...p, status: updatedProject.status } : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Project status updated successfully!',
          })

        } catch (error: any) {
          console.error('Update Status Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to update status',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to update status",
          })
          throw error;
        }
      },

      // 3️⃣ Add Viewers (should already exist)
      addViewersToProject: async (projectId: string, viewerIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await addViewersToProjectPatchApi(projectId, viewerIds);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, viewers: updatedProject.viewers } : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Viewers added successfully!',
          })

        } catch (error: any) {
          console.error('Add Viewers Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to add viewers',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to add viewers",
          })
          throw error;
        }
      },

      // 4️⃣ Remove Viewers (should already exist)
      removeViewersFromProject: async (projectId: string, viewerIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🎯 Removing viewers:', { projectId, viewerIds });
          const updatedProject = await removeViewersFromProjectPatchApi(projectId, viewerIds);
          console.log('✅ Viewers removed:', updatedProject);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  viewers: p.viewers?.filter((v: any) => {
                    const id = typeof v === 'string' ? v : v.userId;
                    return !viewerIds.includes(id);
                  }) || []
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Viewer removed successfully!',
          })
        } catch (error: any) {
          console.error('Remove Viewer Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to remove viewer',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to remove viewer",
          })
          throw error;
        }
      },

      // 5️⃣ Add Members (NEW)
      addMembersToProject: async (projectId: string, members: Array<{ userId: string; role: string }>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await addMembersToProjectPatchApi(projectId, members);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, members: updatedProject.members } : p
            ),
            isLoading: false,
            error: null,
          }));

          const count = members.length;
          toast("success", {
            title: `${count} member${count > 1 ? 's' : ''} added successfully!`,
          })
        } catch (error: any) {
          console.error('Add Members Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to add members',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to add members",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      // Case 2: Add All members from a team
      addMembersToProjectViaTeam: async (
        projectId: string,
        teamId: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await addMembersToProjectViaTeamPatchApi(projectId, teamId);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, members: updatedProject.members } : p
            ),
            isLoading: false,
            error: null,
          }));
          toast("success", {
            title: "Team members added successfully!",
          })

        } catch (error: any) {
          console.error('Add members via Team error:', error);
          set({
            error: error.response?.data?.message || 'Failed to add team members',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to add team members",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      //Case 3: Add specific user from a team
      addUserToProjectFromTeam: async (
        projectId: string,
        members: Array<{ userId: string; role: string; teamId: string }>
      ) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await addUserToProjectFromTeamPatchApi(projectId, members);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, members: updatedProject.members } : p
            ),
            isLoading: false,
            error: null,
          }));

          // const count = members.length;
          // toast("success", {
          //   title: `${count} member${count > 1 ? 's' : ''} added successfully!`,
          // })

        } catch (error: any) {
          console.error('Add User From Team Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to add member',
            isLoading: false,
          });
          // toast("error", {
          //   title: "Failed to add member",
          //   description: error.response?.data?.message || "Something went wrong",
          // })
          throw error;
        }
      },

      // 6️⃣ Remove Members (NEW)
      removeMembersFromProject: async (projectId: string, userIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await removeMembersFromProjectPatchApi(projectId, userIds);
          console.log('Remove Members API response:', updatedProject);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  members: p.members?.filter((m) => !userIds.includes(m.userId)) || []
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          const count = userIds.length;
          toast("success", {
            title: `${count} member${count > 1 ? 's' : ''} removed successfully!`,
          });
        } catch (error: any) {
          console.error('Remove Member Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to remove member',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to remove member",
            description: error.response?.data?.message || "Something went wrong",
          });
          throw error;
        }
      },

      // 7️⃣ Update Project Icon (NEW)
      updateProjectIcon: async (projectId: string, iconId: string) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await updateProjectIconPatchApi(projectId, iconId);

          // ✅ Force refresh by fetching the updated project
          await get().fetchProjectById(projectId);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  iconId: updatedProject.iconId,
                  color: updatedProject.icon?.color || p.color,
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: "Project icon updated successfully!",
          });
        } catch (error: any) {
          console.error('Update Icon Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to update icon',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to update icon",
          });
          throw error;
        }
      },

      // 8️⃣ Attach uploads to project
      attachUploadsToProject: async (projectId: string, uploadIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Attaching uploads to project:', projectId, uploadIds);
          const updatedProject = await attachUploadsToProjectPatchApi(projectId, uploadIds);
          console.log('Attach Uploads API response:', updatedProject);

          console.log('Updated project attachments:', updatedProject.attachments);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  attachments: updatedProject.attachments || []  // Full attachment objects
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: `${uploadIds.length} attachment${uploadIds.length > 1 ? 's' : ''} added successfully!`,
          })

          // Re-fetch project to get full attachment objects (filenames, sizes, etc.)
          await get().fetchProjectById(projectId);
        } catch (error: any) {
          console.error('Attach Uploads Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to attach files',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to attach files",
          })
          throw error;
        }
      },

      // 9️⃣ Remove uploads from project
      removeUploadsFromProject: async (projectId: string, uploadIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Removing uploads from project:', projectId, uploadIds);
          const updatedProject = await removeUploadsFromProjectPatchApi(projectId, uploadIds);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  attachments: updatedProject.attachments || []  // Get updated list from API
                }
                : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Attachment removed successfully!',
          })

          // Re-fetch project to ensure store is in sync
          await get().fetchProjectById(projectId);
        } catch (error: any) {
          console.error('Remove Uploads Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to remove attachment',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to remove attachment",
          })
          throw error;
        }
      },

      // 10 Archive Project (NEW)
      archiveProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const updatedProject = await archiveProjectPatchApi(projectId);

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, status: 'archived' as any } : p
            ),
            isLoading: false,
            error: null,
          }));

          toast("success", {
            title: 'Project archived successfully!',
          })
        } catch (error: any) {
          console.error('Archive Project Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to archive project',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to archive project",
          })
          throw error;
        }
      },

      // 11 Delete Project
      deleteProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🎯 Deleting project:', projectId);
          await deleteProjectApi(projectId);

          // ✅ Remove from local state immediately
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            isLoading: false,
            error: null,
          }));

          // ✅ Update sidebar immediately
          try {
            const { useSidebarStore } = require("./sidebar-store");
            const allProjects = get().projects;
            useSidebarStore.getState().updateMenuItemSubmenu(
              'project',
              allProjects.map((p) => ({
                key: `project-${p.id}`,
                label: p.name,
                href: `/project/${p.id}`,
              }))
            );
            // Re-initialize dynamic data to clean up pinned items and refresh sidebars
            useSidebarStore.getState().initializeDynamicData();
          } catch (error) {
            console.error('Failed to update sidebar immediately on delete:', error);
          }

          toast("success", {
            title: 'Project deleted successfully!',
          })

          // ✅ Optionally refresh all projects to ensure sync
          setTimeout(() => {
            get().fetchProjects();
          }, 500);
        } catch (error: any) {
          console.error('Delete Project Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to delete project',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to delete project",
          })
          throw error;
        }
      },

      restoreProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('🎯 Restoring project:', projectId);
          const restoredProject = await restoreProjectApi(projectId);

          // Map the response to the frontend Project schema
          const mappedProject: Project = {
            id: restoredProject.id,
            name: restoredProject.name,
            description: restoredProject.description,
            slug: restoredProject.slug,
            status: restoredProject.status,
            startDate: restoredProject.startDate,
            endDate: restoredProject.endDate,
            linkedPortfolios: restoredProject.linkedPortfolios || [],
            phase: restoredProject.state,
            leaders: restoredProject.leaders || [],
            viewers: restoredProject.viewers || [],
            members: restoredProject.members || [],
            priority: restoredProject.priority,
            privacy: restoredProject.privacy as any,
            customFieldsConfig: restoredProject.customFieldsConfig ?? [],
            customFieldValues: restoredProject.customFieldValues ?? {},
            customFields: (restoredProject.customFields ?? []).map(f => mapAPIToStore(f, restoredProject.id)),
            projectStatusConfig: restoredProject.projectStatusConfig || [],
            projectPriorityConfig: restoredProject.projectPriorityConfig || [],
            taskTypeConfig: enrichTaskTypeConfigs(restoredProject.taskTypeConfig ?? []),
            taskStatusConfig: restoredProject.taskStatusConfig || [],
            taskPriorityConfig: restoredProject.taskPriorityConfig || [],
            labels: restoredProject.labels || [],
            createdAt: restoredProject.createdAt,
            updatedAt: restoredProject.updatedAt,
            attachments: Array.isArray(restoredProject.attachments)
              ? restoredProject.attachments.map(mapAttachment).filter((att): att is NonNullable<typeof att> => att !== null)
              : [],
            iconId: restoredProject.iconId || restoredProject.icon?.iconId || null,
            icon: restoredProject.icon,
            color: restoredProject.icon?.color || "#3B82F6",
            projectLeader: restoredProject.leaders?.[0],
            linkedPortfolio: restoredProject.portfolioId,
            cycleConfig: restoredProject.cycleConfigs?.find(c => c && c.id !== null),
            parallelCycleConfigs: restoredProject.cycleConfigs || [],
            usesParallelCycleConfigs: restoredProject.usesParallelCycleConfigs,
          };

          set((state) => ({
            projects: [...state.projects, mappedProject],
            isLoading: false,
            error: null,
          }));

          // ✅ Update sidebar immediately
          try {
            const { useSidebarStore } = require("./sidebar-store");
            const allProjects = get().projects;
            useSidebarStore.getState().updateMenuItemSubmenu(
              'project',
              allProjects.map((p) => ({
                key: `project-${p.id}`,
                label: p.name,
                href: `/project/${p.id}`,
              }))
            );
            // Re-initialize dynamic data to clean up pinned items and refresh sidebars
            useSidebarStore.getState().initializeDynamicData();
          } catch (error) {
            console.error('Failed to update sidebar immediately on restore:', error);
          }

          toast("success", {
            title: 'Project restored successfully!',
          })
        } catch (error: any) {
          console.error('Restore Project Error:', error);
          set({
            error: error.response?.data?.message || 'Failed to restore project',
            isLoading: false,
          });
          toast("error", {
            title: "Failed to restore project",
          })
          throw error;
        }
      },

      updateProjectPhase: async (projectId: string, phase: string) => {
        try {
          const response = await changeProjectPhasePatchApi(projectId, phase);
          set(state => ({
            projects: state.projects.map(p => p.id === projectId ? { ...p, phase: response.state } : p)
          }));

          toast("success", {
            title: 'Project phase updated',
          })
        } catch (error: any) {
          console.error('Failed to update project phase:', error);
          toast("error", {
            title: "Failed to save project phase",
          })
          // No rollback needed since we never updated state
        }
      },

      updateProjectLabels: async (projectId: string, labelIds: string[]) => {
        set({ isLoading: true, error: null });
        try {
          // Get all available labels from workspace store to resolve IDs to full objects
          const { currentWorkspace } = useWorkspaceStore.getState();
          const allLabels = currentWorkspace?.labels || [];

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  labelIds: labelIds,
                  // Resolve full label objects so UI can render them correctly
                  labels: allLabels.filter((l) => labelIds.includes(l.id)),
                }
                : p
            ),
            isLoading: false,
          }));
          toast("success", {
            title: 'Labels updated successfully (local)',
          })
        } catch (error: any) {
          console.error("Update Labels Error:", error);
          set({
            error: "Failed to update labels (local)",
            isLoading: false,
          });
          toast("error", {
            title: "Failed to update labels",
          })
        }
      },

      attachPortfoliosToProject: async (projectId, portfolioIds) => {
        try {
          const updated = await attachPortfoliosPatchApi(projectId, portfolioIds);
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? {
              ...p,
              linkedPortfolios: updated.linkedPortfolios || [...(p.linkedPortfolios || []), ...portfolioIds]
            } : p)),
          }));
          toast("success", {
            title: "Portfolio linked!",
          })
        } catch (error: any) {
          toast("error", {
            title: "Failed to link portfolio",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      detachPortfoliosFromProject: async (projectId, portfolioIds) => {
        try {
          const updated = await detachPortfoliosPatchApi(projectId, portfolioIds);
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? {
              ...p,
              linkedPortfolios: updated.linkedPortfolios || (p.linkedPortfolios || []).filter(id => !portfolioIds.includes(id))
            } : p)),
          }));
          toast("success", {
            title: "Portfolio unlinked!",
          })
        } catch (error: any) {
          toast("error", {
            title: "Failed to unlink portfolio",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      fetchViews: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const customViewForProject = get().customViews.find(
            (view) => view.projectId === projectId
          );

          const defaultViewId = 'list';
          const currentActiveView = get().activeViewIds[projectId];
          const activeViewId = currentActiveView ||
            customViewForProject?.id ||
            defaultViewId;

          set((state) => ({
            activeViewIds: {
              ...state.activeViewIds,
              [projectId]: activeViewId,
            },
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
        }
      },

      addView: (view) => {
        set((state) => {
          const otherProjectCustomViews = state.customViews.filter(
            (v) => v.projectId !== view.projectId
          );
          return {
            customViews: [...otherProjectCustomViews, view],
            activeViewIds: {
              ...state.activeViewIds,
              [view.projectId]: view.id,
            },
          };
        });
      },

      updateView: (id, updatedView) => {
        set((state) => {
          const updatedCustomViews = state.customViews.map((view) =>
            view.id === id ? { ...view, ...updatedView } : view
          );
          return {
            customViews: updatedCustomViews,
          };
        });
      },

      deleteView: (viewId: string) => {
        set((state) => {
          const deletedView = state.customViews.find(v => v.id === viewId);
          const updatedCustomViews = state.customViews.filter(
            (view) => view.id !== viewId
          );
          const updatedActiveViewIds = { ...state.activeViewIds };
          if (deletedView) {
            updatedActiveViewIds[deletedView.projectId] = 'list';
          }
          return {
            customViews: updatedCustomViews,
            activeViewIds: updatedActiveViewIds,
          };
        });
      },

      setActiveView: (projectId, viewId) => {
        set((state) => ({
          activeViewIds: {
            ...state.activeViewIds,
            [projectId]: viewId,
          },
        }));
      },

      getActiveViewId: (projectId) => {
        return get().activeViewIds[projectId] || null;
      },

      reorderView: (projectId, viewId, newOrder) => {
        set((state) => {
          const projectViews = state.customViews.filter(
            (v) => v.projectId === projectId
          );
          const viewToMove = projectViews.find((v) => v.id === viewId);
          if (!viewToMove) return state;

          const reorderedViews = projectViews.filter((v) => v.id !== viewId);
          reorderedViews.splice(newOrder, 0, viewToMove);

          const updatedCustomViews = state.customViews.map((view) => {
            if (view.projectId === projectId && view.category === 'custom') {
              const index = reorderedViews.findIndex((v) => v.id === view.id);
              return { ...view, order: index };
            }
            return view;
          });

          return {
            customViews: updatedCustomViews,
          };
        });
      },

      setViewLayout: (layout) => {
        set({ viewLayout: layout });
      },

      addTailoredView: async (view) => {
        const updatedViews = [view, ...get().tailoredViews];
        set({ tailoredViews: updatedViews });
        await get().syncTailoredViewsToBackend(updatedViews);
      },

      updateTailoredView: async (id, updates) => {
        const updatedViews = get().tailoredViews.map((v) =>
          v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
        );
        set({ tailoredViews: updatedViews });
        await get().syncTailoredViewsToBackend(updatedViews);
      },

      deleteTailoredView: async (id) => {
        const updatedViews = get().tailoredViews.filter((v) => v.id !== id);
        set({ tailoredViews: updatedViews });
        await get().syncTailoredViewsToBackend(updatedViews);
      },

      getTailoredViewsByProject: (projectId) => {
        return get().tailoredViews.filter((v) => v.projectId === projectId);
      },

      setTailoredViews: (views) => {
        set({ tailoredViews: views });
      },

      syncTailoredViewsToBackend: async (views) => {
        try {
          const profileStore = useProfileStore.getState();

          // Recursive function to strip null/undefined and convert nested arrays to keyed objects
          const cleanAndSerialize = (obj: any): any => {
            if (obj === null || obj === undefined) {
              return undefined;
            }
            if (Array.isArray(obj)) {
              // Convert nested array to keyed object (e.g. [A, B] -> {"0": A, "1": B}) to bypass validator array restriction
              const keyedObj: Record<string, any> = {};
              let index = 0;
              for (const item of obj) {
                const val = cleanAndSerialize(item);
                if (val !== undefined) {
                  keyedObj[index.toString()] = val;
                  index++;
                }
              }
              return keyedObj;
            }
            if (obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype) {
              const cleaned: Record<string, any> = {};
              for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                  const val = cleanAndSerialize(obj[key]);
                  if (val !== undefined) {
                    cleaned[key] = val;
                  }
                }
              }
              return cleaned;
            }
            return obj;
          };

          // Key tailored views by their view ID at the root level
          const tailoredViewsObject = (views || []).reduce((acc: Record<string, any>, view: any) => {
            if (view && view.id) {
              acc[view.id] = cleanAndSerialize(view);
            }
            return acc;
          }, {});

          await profileStore.updateUserProfile({
            projectSettings: {
              ...profileStore.user?.projectSettings,
              tailoredViews: tailoredViewsObject
            }
          });
        } catch (err) {
          console.error("Failed to sync tailored views to backend profile:", err);
          throw err;
        }
      },

      addFeature: (featureData) => {
        const projectFeatures = get().features.filter(f => f.projectId === featureData.projectId);
        const order = projectFeatures.length;
        const id = `feature-${Date.now()}`;

        const newFeature: Feature = { ...featureData, id, order };
        set((state) => ({
          features: [...state.features, newFeature],
        }));
        return id;
      },

      updateFeature: (id, updates) => {
        set((state) => ({
          features: state.features.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFeature: (id) => {
        set((state) => ({
          features: state.features.filter((f) => f.id !== id),
        }));
      },

      toggleFeature: (id) => {
        set((state) => ({
          features: state.features.map((f) =>
            f.id === id ? { ...f, isEnabled: !f.isEnabled } : f
          ),
        }));
      },

      getFeaturesByProject: (projectId) => {
        return get().features
          .filter((f) => f.projectId === projectId)
          .sort((a, b) => a.order - b.order);
      },
      toggleRepeatingWorkSection: (id) => {
        set((state) => ({
          repeatingWorkSections: state.repeatingWorkSections.map((s) =>
            s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
          ),
        }));
      },

      getRepeatingWorkByProject: (projectId) => {
        return get().repeatingWorkSections
          .filter((s) => s.projectId === projectId)
          .sort((a, b) => a.order - b.order);
      },

      fetchTaskCustomFields: async (projectId: string) => {
        try {
          const response = await getCustomFieldsApi(projectId);
          // console.log("Fetched custom fields for project", projectId, response);
          const mappedFields = response.customFields.map(field =>
            mapAPIToStore(field, projectId)
          ) as TaskCustomField[];
          // console.log("Mapped custom fields for project", projectId, mappedFields);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? { ...p, customFields: mappedFields }
                : p
            ),
          }));
        } catch (error: any) {
          console.error('Failed to fetch task custom fields:', error);
          throw error;
        }
      },

      getTaskCustomFields: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.customFields ?? [];
      },

      getTaskCustomFieldById: (projectId: string, fieldId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.customFields?.find(f => f.id === fieldId);
      },

      addTaskCustomField: async (projectId: string, fieldData: Omit<TaskCustomField, 'id' | 'projectId'>) => {
        try {
          const apiRequest = mapStoreToAPI(fieldData);
          const response = await createCustomFieldApi(projectId, apiRequest);
          const newField = mapAPIToStore(
            response.customFields[response.customFields.length - 1],
            projectId
          ) as TaskCustomField;
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? { ...p, customFields: [...(p.customFields ?? []), newField] }
                : p
            ),
          }));
          return newField.id;
        } catch (error: any) {
          console.error('Failed to create task custom field:', error);
          throw error;
        }
      },

      // updateTaskCustomField: (projectId: string, fieldId: string, updates: Partial<TaskCustomField>) => {
      //   set(state => ({
      //     projects: state.projects.map(p =>
      //       p.id === projectId
      //         ? {
      //           ...p,
      //           customFields: (p.customFields ?? []).map(f =>
      //             f.id === fieldId ? { ...f, ...updates } : f
      //           ),
      //         }
      //         : p
      //     ),
      //   }));
      // },
      // ✅ FIX — async, calls API first, updates state on success, rollback on failure
      // ✅ FIX in updateTaskCustomField
      updateTaskCustomField: async (
        projectId: string,
        fieldId: string,
        updates: Partial<TaskCustomField>
      ): Promise<void> => {
        // Optimistic update
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                customFields: (p.customFields ?? []).map(f =>
                  f.id === fieldId ? { ...f, ...updates } : f
                ),
              }
              : p
          ),
        }));

        try {
          const currentField = get().getTaskCustomFieldById(projectId, fieldId);
          if (!currentField) throw new Error('Field not found');

          const merged = { ...currentField, ...updates };
          const fullPayload = mapStoreToAPI(merged);

          // ❌ Backend rejects name and type — strip them out
          const { name: _name, type: _type, ...apiPayload } = fullPayload as any;

          await updateCustomFieldApi(projectId, fieldId, apiPayload);
        } catch (error: any) {
          console.error('Failed to update task custom field:', error);
          try {
            await get().fetchTaskCustomFields(projectId);
          } catch { }
          toast("error", {
            title: "Failed to update field",
            description: error?.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      updateTaskCustomFieldOptions: (projectId: string, fieldId: string, options: (string | { value: string; color: string })[]) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                customFields: (p.customFields ?? []).map(f =>
                  f.id === fieldId ? { ...f, options } : f
                ),
              }
              : p
          ),
        }));
      },

      deleteTaskCustomField: async (projectId: string, fieldId: string) => {
        try {
          await deleteCustomFieldApi(projectId, fieldId);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? { ...p, customFields: (p.customFields ?? []).filter(f => f.id !== fieldId) }
                : p
            ),
          }));
          // Also clean up stale values from tasks in tasks-store
          useTasksStore.getState().clearCustomFieldFromTasks(fieldId);
        } catch (error: any) {
          console.error('Failed to delete task custom field:', error);
          throw error;
        }
      },

      deleteTaskCustomFieldOption: (projectId: string, fieldId: string, optionToDelete: string) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                customFields: (p.customFields ?? []).map(f =>
                  f.id === fieldId
                    ? {
                      ...f,
                      options: f.options.filter(o =>
                        typeof o === 'string'
                          ? o !== optionToDelete          // string option
                          : o.value !== optionToDelete    // object option — compare .value
                      ),
                    }
                    : f
                ),
              }
              : p
          ),
        }));
        // Also clean stale option values from tasks
        useTasksStore.getState().clearCustomFieldOptionFromTasks(fieldId, optionToDelete);
      },


      // Add implementations at the bottom of useProjectsStore (around line 800)
      addDocumentToProject: (projectId, docId) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                ...project,
                linkedDocuments: [...(project.linkedDocuments || []), docId]
              }
              : project
          ),
        }));
      },

      removeDocumentFromProject: (projectId, docId) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? {
                ...project,
                linkedDocuments: (project.linkedDocuments || []).filter(id => id !== docId)
              }
              : project
          ),
        }));
      },

      getLinkedDocuments: (projectId) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.linkedDocuments || [];
      },

      getTaskTypesByProject: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return (project?.taskTypeConfig || []).filter(
          (t) => t.value !== 'subtask' && t.label.toLowerCase() !== 'subtask'
        );
      },

      // Add custom task type to project
      addTaskTypeToProject: async (projectId: string, taskType: Omit<TaskTypeConfig, '_id'>) => {
        try {
          // ✅ Prepare icon data for API
          const apiPayload: any = {
            value: taskType.value,
            label: taskType.label,
            pluralLabel: taskType.pluralLabel || '',
            description: taskType.description,
            color: taskType.color,
            order: taskType.order,
          };

          // Include icon if present
          if (taskType.iconId) {
            apiPayload.iconId = taskType.iconId;
          }
          console.log("API Payload for creating task type:", apiPayload);

          const response = await createTaskTypeApi(projectId, apiPayload);
          console.log('Create Task Type API response:', response);

          const newType: TaskTypeConfig = enrichTaskTypeConfig({
            _id: response._id,
            value: response.value,
            label: response.label,
            pluralLabel: response.pluralLabel || '',
            description: response.description,
            color: response.color,
            order: response.order,
            // ✅ Handle icon from response
            icon: response.icon || taskType.icon || null,
            iconId: response.iconId || taskType.iconId || null,
          });

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? {
                  ...p,
                  taskTypeConfig: [...(p.taskTypeConfig || []), newType]
                }
                : p
            ),
          }));

          toast("success", {
            title: 'Task type created successfully',
          })
        } catch (error: any) {
          console.error('Failed to add task type:', error);
          toast("error", {
            title: "Failed to create task type",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      // Update custom task type
      updateTaskTypeInProject: async (projectId: string, typeId: string, updates: Partial<TaskTypeConfig>) => {
        try {
          // ✅ Prepare update payload
          const apiPayload: any = {};

          if (updates.label) apiPayload.label = updates.label;
          if (updates.description) apiPayload.description = updates.description;
          if (updates.color) apiPayload.color = updates.color;
          if (updates.order !== undefined) apiPayload.order = updates.order;

          // Include icon updates
          if (updates.iconId !== undefined) {
            apiPayload.iconId = updates.iconId || null;
          }

          const response = await updateTaskTypeApi(projectId, typeId, apiPayload);

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? {
                  ...p,
                  taskTypeConfig: (p.taskTypeConfig || []).map(t =>
                    t._id === typeId
                      ? enrichTaskTypeConfig({
                        ...t,
                        ...updates,
                        // ✅ prefer response icon, fallback to what we passed in updates
                        icon: response.icon || updates.icon || t.icon,
                        iconId: response.iconId || updates.iconId || t.iconId,
                      })
                      : t
                  )
                }
                : p
            ),
          }));

          toast("success", {
            title: 'Task type updated successfully',
          })
        } catch (error: any) {
          console.error('Failed to update task type:', error);
          toast("error", {
            title: "Failed to update task type",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      // Delete custom task type
      deleteTaskTypeFromProject: async (projectId: string, typeId: string) => {
        try {
          await deleteTaskTypeApi(projectId, typeId);

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? {
                  ...p,
                  taskTypeConfig: (p.taskTypeConfig || []).filter(t => t._id !== typeId)
                }
                : p
            ),
          }));

          toast("success", {
            title: 'Task type deleted successfully',
          })

        } catch (error: any) {
          console.error('Failed to delete task type:', error);
          toast("error", {
            title: "Failed to delete task type",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      getProjectStatusConfigs: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.projectStatusConfig || [];
      },

      addProjectStatusConfig: async (projectId: string, data: {
        label: string;
        color: string;
        value: string;
      }) => {
        const project = get().projects.find(p => p.id === projectId);
        const currentConfigs = project?.projectStatusConfig || [];
        const order = currentConfigs.length + 1;

        // ✅ API returns the FULL updated array, not just the new item
        const updatedConfigs = await createProjectStatusConfigApi(projectId, {
          value: data.value,
          label: data.label,
          description: '',
          color: data.color,
          order,
        });

        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, projectStatusConfig: updatedConfigs } // ✅ Replace entire array
              : p
          )
        }));
      },

      updateProjectStatusConfig: async (projectId: string, statusId: string, data: {
        label?: string;
        color?: string;
        value?: string;
      }) => {
        // ✅ API returns full updated array
        const updatedConfigs = await updateProjectStatusConfigApi(projectId, statusId, {
          label: data.label,
          color: data.color,
        });

        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, projectStatusConfig: updatedConfigs } // ✅ Replace entire array
              : p
          )
        }));
      },

      deleteProjectStatusConfig: async (projectId: string, statusId: string) => {
        await deleteProjectStatusConfigApi(projectId, statusId);

        // ✅ DELETE returns no body, so filter locally
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                projectStatusConfig: (p.projectStatusConfig || []).filter(
                  s => s._id !== statusId
                )
              }
              : p
          )
        }));
      },

      fetchProjectStatusHistory: async (projectId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await getProjectStatusHistoryApi(projectId);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? {
                  ...p,
                  statusHistory: data.history || [],
                  currentProjectUpdate: data.currentProjectStatus || ''
                }
                : p
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error("Fetch status history error:", error);
          set({
            error: error.response?.data?.message || 'Failed to fetch project status history',
            isLoading: false
          });
        }
      },

      postProjectStatusHistory: async (projectId: string, status: string, message: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await postProjectStatusHistoryApi(projectId, { status, message });
          set(state => ({
            projects: state.projects.map(p => {
              if (p.id !== projectId) return p;
              const currentHistory = p.statusHistory || [];
              return {
                ...p,
                statusHistory: [data.entry, ...currentHistory],
                currentProjectUpdate: data.currentProjectStatus || ''
              };
            }),
            isLoading: false
          }));
          toast("success", {
            title: 'Project status update posted successfully!',
          });
        } catch (error: any) {
          console.error("Post status history error:", error);
          set({
            error: error.response?.data?.message || 'Failed to post project status update',
            isLoading: false
          });
          toast("error", {
            title: 'Failed to post project status update',
          });
          throw error;
        }
      },

      // Getter
      getProjectPriorityConfigs: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.projectPriorityConfig ?? [];
      },

      // Add
      addProjectPriorityConfig: async (projectId: string, payload: Omit<ProjectPriorityConfig, '_id'>) => {
        const newConfig = await createProjectPriorityConfigApi(projectId, payload);
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, projectPriorityConfig: [...(p.projectPriorityConfig ?? []), newConfig] }
              : p
          )
        }));
      },

      // Update
      updateProjectPriorityConfig: async (
        projectId: string,
        priorityId: string,
        payload: Partial<Omit<ProjectPriorityConfig, '_id'>>
      ) => {
        const updated = await updateProjectPriorityConfigApi(projectId, priorityId, payload);
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                projectPriorityConfig: (p.projectPriorityConfig ?? []).map(c =>
                  c._id === priorityId ? updated : c
                )
              }
              : p
          )
        }));
      },

      // Delete
      deleteProjectPriorityConfig: async (projectId: string, priorityId: string) => {
        await deleteProjectPriorityConfigApi(projectId, priorityId);
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                projectPriorityConfig: (p.projectPriorityConfig ?? []).filter(c => c._id !== priorityId)
              }
              : p
          )
        }));
      },

      getTaskStatusConfigs: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.taskStatusConfig || [];
      },


      addTaskStatusConfig: async (projectId: string, statusData) => {
        try {
          const project = get().projects.find(p => p.id === projectId);
          const existing = project?.taskStatusConfig || [];

          const payload = {
            value: statusData.label.toLowerCase().replace(/\s+/g, '_'),
            label: statusData.label,
            description: statusData.description || '',
            color: statusData.color,
            order: existing.length + 1,
          };

          const response = await createTaskStatusApi(projectId, payload);

          const newStatus: TaskStatusConfig = {
            _id: response._id,
            value: response.value,
            label: response.label,
            description: response.description,
            color: response.color,
            order: response.order,
          };

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? { ...p, taskStatusConfig: [...(p.taskStatusConfig || []), newStatus] }
                : p
            ),
          }));

          toast("success", {
            title: 'Status created successfully',
          })
          return response._id;
        } catch (error: any) {
          toast("error", {
            title: "Failed to create status",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      updateTaskStatusConfig: async (projectId: string, statusId: string, updates) => {
        try {
          const response = await updateTaskStatusApi(projectId, statusId, {
            label: updates.label,
            description: updates.description,
            color: updates.color,
            order: updates.order,
          });

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? {
                  ...p,
                  taskStatusConfig: (p.taskStatusConfig || []).map(s =>
                    s._id === statusId ? { ...s, ...updates } : s
                  ),
                }
                : p
            ),
          }));

          toast("success", {
            title: 'Status updated successfully',
          })
        } catch (error: any) {
          toast("error", {
            title: "Failed to update status",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      deleteTaskStatusConfig: async (projectId: string, statusId: string) => {
        try {
          await deleteTaskStatusApi(projectId, statusId);

          set((state) => ({
            projects: state.projects.map(p =>
              p.id === projectId
                ? { ...p, taskStatusConfig: (p.taskStatusConfig || []).filter(s => s._id !== statusId) }
                : p
            ),
          }));

          toast("success", {
            title: 'Status deleted successfully',
          })
        } catch (error: any) {
          toast("error", {
            title: "Failed to delete status",
            description: error.response?.data?.message || "Something went wrong",
          })
          throw error;
        }
      },

      getTaskPriorityConfigs: (projectId: string) => {
        const project = get().projects.find(p => p.id === projectId);
        return project?.taskPriorityConfig ?? [];
      },

      addTaskPriorityConfig: async (projectId: string, data: Omit<TaskPriorityConfig, '_id'>) => {
        const newConfig = await createTaskPriorityConfigApi(projectId, data);
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? { ...p, taskPriorityConfig: [...(p.taskPriorityConfig ?? []), newConfig] }
              : p
          )
        }));
      },

      updateTaskPriorityConfig: async (
        projectId: string,
        priorityId: string,
        data: Partial<Omit<TaskPriorityConfig, '_id'>>
      ) => {
        const updated = await updateTaskPriorityConfigApi(projectId, priorityId, data);
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                taskPriorityConfig: (p.taskPriorityConfig ?? []).map(c =>
                  c._id === priorityId ? updated : c
                )
              }
              : p
          )
        }));
      },

      deleteTaskPriorityConfig: async (projectId: string, priorityId: string) => {
        await deleteTaskPriorityConfigApi(projectId, priorityId);
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                ...p,
                taskPriorityConfig: (p.taskPriorityConfig ?? []).filter(
                  c => c._id !== priorityId
                )
              }
              : p
          )
        }));
      },

      fetchCycleConfig: async (projectId: string) => {
        try {
          const response = await getCycleConfigApi(projectId);
          const cycleConfig = response.cycleConfigs?.find(c => c && c.id !== null);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? { ...p, cycleConfig, parallelCycleConfigs: response.cycleConfigs } : p
            )
          }));
        } catch (error) {
          console.error("Failed to fetch cycle config", error);
        }
      },

      updateCycleConfig: async (projectId: string, payload: Partial<CycleConfig>) => {
        try {
          const { cycleConfig } = await updateCycleConfigApi(projectId, payload);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? { ...p, cycleConfig } : p
            )
          }));
          toast("success", { title: "Cycle configuration updated" });
        } catch (error) {
          console.error("Failed to update cycle config", error);
          toast("error", { title: "Failed to update cycle configuration" });
        }
      },

      fetchParallelCycleConfigs: async (projectId: string) => {
        try {
          const response = await getParallelCycleConfigsApi(projectId);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? { ...p, parallelCycleConfigs: response.cycleConfigs } : p
            )
          }));
        } catch (error) {
          console.error("Failed to fetch parallel cycle configs", error);
        }
      },

      createParallelCycleConfig: async (
        projectId: string,
        payload: Partial<ParallelCycleConfig> & {
          cycleName?: string;
          description?: string;
          slug?: string;
          cycleNumber?: number;
          sortOrder?: number;
          status?: string;
          endDate?: string;
        }
      ) => {
        try {
          const response = await createParallelCycleConfigApi(projectId, payload);
          const newConfig = response.cycleConfigs?.find(c => c && c.id !== null) || response.cycleConfigs?.[0];
          if (!newConfig) throw new Error("No cycle configuration returned from API");

          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? {
                ...p,
                cycleConfig: newConfig,
                parallelCycleConfigs: response.cycleConfigs || [],
                usesParallelCycleConfigs: response.usesParallelCycleConfigs,
                cycles: response.initialCycle 
                  ? [...(p.cycles || []), response.initialCycle]
                  : p.cycles
              } : p
            )
          }));
          toast("success", { title: "Parallel cycle configuration created" });
          return newConfig.id;
        } catch (error) {
          console.error("Failed to create parallel cycle config", error);
          toast("error", { title: "Failed to create parallel cycle configuration" });
          throw error;
        }
      },

      updateParallelCycleConfig: async (projectId: string, cycleConfigId: string, payload: Partial<ParallelCycleConfig>) => {
        try {
          const response = await updateParallelCycleConfigApi(projectId, cycleConfigId, payload);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? {
                ...p,
                parallelCycleConfigs: (p.parallelCycleConfigs || []).map(c => c.id === cycleConfigId ? response.cycleConfig : c)
              } : p
            )
          }));
          toast("success", { title: "Parallel cycle configuration updated" });
        } catch (error) {
          console.error("Failed to update parallel cycle config", error);
          toast("error", { title: "Failed to update parallel cycle configuration" });
        }
      },

      deleteParallelCycleConfig: async (projectId: string, cycleConfigId: string) => {
        try {
          await deleteParallelCycleConfigApi(projectId, cycleConfigId);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? {
                ...p,
                parallelCycleConfigs: (p.parallelCycleConfigs || []).filter(c => c.id !== cycleConfigId)
              } : p
            )
          }));
          toast("success", { title: "Parallel cycle configuration deleted" });
        } catch (error) {
          console.error("Failed to delete parallel cycle config", error);
          toast("error", { title: "Failed to delete parallel cycle configuration" });
        }
      },

      fetchCycles: async (projectId: string, params?: { status?: string; startAfter?: string; startBefore?: string; cycleConfigId?: string }) => {
        try {
          const response = await getCyclesApi(projectId, params);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? { ...p, cycles: response.cycles } : p
            )
          }));
        } catch (error) {
          console.error("Failed to fetch cycles", error);
        }
      },

      createCycle: async (projectId: string, payload: Partial<Cycle>) => {
        try {
          const response = await createCycleApi(projectId, payload);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? { ...p, cycles: [...(p.cycles || []), response] } : p
            )
          }));
          toast("success", { title: "Cycle created successfully" });
        } catch (error) {
          console.error("Failed to create cycle", error);
          toast("error", { title: "Failed to create cycle" });
        }
      },

      updateCycle: async (projectId: string, cycleId: string, payload: Partial<Cycle>) => {
        try {
          const response = await updateCycleApi(projectId, cycleId, payload);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? {
                ...p,
                cycles: (p.cycles || []).map(c => c.id === cycleId ? response : c)
              } : p
            )
          }));
          toast("success", { title: "Cycle updated successfully" });
        } catch (error) {
          console.error("Failed to update cycle", error);
          toast("error", { title: "Failed to update cycle" });
        }
      },

      deleteCycle: async (projectId: string, cycleId: string) => {
        try {
          await deleteCycleApi(projectId, cycleId);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === projectId ? {
                ...p,
                cycles: (p.cycles || []).filter(c => c.id !== cycleId)
              } : p
            )
          }));
          toast("success", { title: "Cycle deleted successfully" });
        } catch (error) {
          console.error("Failed to delete cycle", error);
          toast("error", { title: "Failed to delete cycle" });
        }
      },

      reset: () => {
        // Clear the persisted localStorage key
        localStorage.removeItem('projects-storage');
      },
    }),
    {
      name: 'projects-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        customViews: state.customViews,
        tailoredViews: state.tailoredViews,
        activeViewIds: state.activeViewIds,
        viewLayout: state.viewLayout,
        // workItemTypes: state.workItemTypes,
        features: state.features,
        repeatingWorkSections: state.repeatingWorkSections,
      }),
    }
  )
);