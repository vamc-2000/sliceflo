// types/task.types.ts
import { TaskCustomField } from "@/stores/projects-store";

// System fields configuration with visibility control
export interface SystemFieldConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  isSystem: true;
  required: boolean;
  defaultVisible: boolean;
  icon?: string;
  order: number;
}

export interface LabelOption {
  id: string;
  name: string;
  color: string;
}

export interface TaskRelationship {
  id: string;
  type: 'relates-to' | 'duplicate-of' | 'blocked-by' | 'blocking' |
  'starts-before' | 'starts-after'; // | 'finishes-before' | 'finishes-after';
  targetTaskId: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  name: string;
  completed: boolean;
  assignees?: string[]; // member IDs
  order: number;
}

export interface Checklist {
  id: string;
  taskId: string;
  name: string;
  items: string[]; // ChecklistItem IDs
  order: number;
}

export interface Subtask {
  id: string;
  taskNumber?: number;
  parentTaskId?: string;
  projectId: string;
  name: string;
  description?: string;
  taskType?: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  priority?: string; // Changed to string for dynamic options
  status?: string;
  customFieldValues?: Record<string, string | string[] | number>;
  completed: boolean;
  order: number;
  createdAt?: string;
  relationships?: TaskRelationship[];
  linkedDocuments?: string[];
  attachments?: TaskAttachment[];
  attachmentIds?: string[];
  labelIds?: string[];
  labels?: string[];
  cycleId?: string | null;
  cycle?: {
    id: string;
    name: string;
    slug: string;
    cycleNumber: number;
    status: string;
    startDate: string;
    endDate: string;
    iconId?: string | null;
    cycleConfigId: string;
  } | null;
}

export interface Task {
  id: string;
  taskNumber?: number;
  projectId: string;
  name: string;
  description?: string;
  taskType?: string;
  assignee?: string;  // ✅ This should store userId, not name
  startDate?: string;
  endDate?: string;
  parentTaskId?: string;
  priority?: string; // Changed to string for dynamic options
  status?: string;
  customFieldValues?: Record<string, string | string[] | number>;
  completed: boolean;
  order: number;
  subtasks?: string[];
  cycleId?: string | null;
  cycle?: {
    id: string;
    name: string;
    slug: string;
    cycleNumber: number;
    status: string;
    startDate: string;
    endDate: string;
    iconId?: string | null;
    cycleConfigId: string;
  } | null;
  relationships?: TaskRelationship[];
  linkedDocuments?: string[];
  createdAt?: string;
  attachments?: TaskAttachment[];
  attachmentIds?: string[];
  labelIds?: string[];
  labels?: string[];
}

export interface Member {
  id: string; // This is the actual userId from API
  name: string;
  email?: string;
  avatar?: string;
  projectId: string;
}

// Add to your store interface
export interface ColumnConfig {
  id: string;
  fieldName: string;
  columnOrder: number;
  columnFreezed: boolean;
  pinned: boolean; // for hide/show
  isSystemColumn?: boolean;
}


export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  taskNumber?: number;
  title: string;
  description?: string;
  projectId: string;
  tenantId?: string;
  assigneeId?: string;
  reporter?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  parentTaskId?: string;
  taskType?: string;
  customFieldValues?: Record<string, any>;
  customFields?: Record<string, any>;
  tags?: string[];
  labels?: string[];
  labelIds?: string[];
  components?: string[];
  comments?: any[];
  attachments?: TaskAttachment[];
  icon?: any;
  iconId?: string;
  cycleId?: string | null;
  cycle?: {
    id: string;
    name: string;
    slug: string;
    cycleNumber: number;
    status: string;
    startDate: string;
    endDate: string;
    iconId?: string | null;
    cycleConfigId: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  relatesTo?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  duplicateOf?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  blockedBy?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  blocking?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  startsBefore?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  startsAfter?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  finishesBefore?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  finishesAfter?: Array<{ id: string; title: string; status?: string; priority?: string; taskType?: string; taskNumber?: number }>;
  linkedDocuments?: string[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  parentTaskId?: string;
  dueDate?: string;
  attachments?: string[];
  iconId?: string;
  cycleId?: string | null;
  customFieldValues?: Record<string, any>;
  taskType?: string;
  // Relationship fields
  relatesTo?: string[];
  duplicateOf?: string[];
  blockedBy?: string[];
  startsBefore?: string[];
  startsAfter?: string[];
  // TODO: add when backend supports
  blocking?: string[];
  finishesBefore?: string[];
  finishesAfter?: string[];
  labelIds?: string[];
  linkedDocuments?: string[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;