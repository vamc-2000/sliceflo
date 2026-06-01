// stores/tasks-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import {
  Subtask, Task, TaskRelationship,
  Checklist, ChecklistItem, SystemFieldConfig, ColumnConfig, TaskResponse,
  CreateTaskRequest,
  UpdateTaskRequest
} from '@/types/task.types';
import { TaskCustomField, useProjectsStore } from "@/stores/projects-store";
import {
  getTasksApi,
  getTaskByIdApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  updateTaskStatusApi,
  assignTaskApi,
} from '@/lib/api/tasks-api';
import { toast } from "@/components/ui/sonner";
import { retryWithBackoff } from '@/utils/retry';

const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const SYSTEM_FIELDS: SystemFieldConfig[] = [
  {
    id: 'id',
    name: 'ID',
    type: 'text',
    description: 'Unique task identifier',
    isSystem: true,
    required: true,
    defaultVisible: true,
    order: 0,
  },
  {
    id: 'task',
    name: 'Task',
    type: 'text',
    description: 'The name/title of the task',
    isSystem: true,
    required: true,
    defaultVisible: true,
    order: 1,
  },
  {
    id: 'taskType',
    name: 'Type',
    type: 'select-one',
    description: 'Type of work item',
    isSystem: true,
    required: false,
    defaultVisible: false,
    order: 2,
  },
  {
    id: 'status',
    name: 'Status',
    type: 'select-one',
    description: 'Current status of the task',
    isSystem: true,
    required: false,
    defaultVisible: true,
    order: 3,
  },
  {
    id: 'cycle',
    name: 'Cycle',
    type: 'select-one',
    description: 'Cycle associated with the task',
    isSystem: true,
    required: false,
    defaultVisible: false,
    order: 4,
  },
  {
    id: 'assignee',
    name: 'Assignee',
    type: 'select-one',
    description: 'Person assigned to the task',
    isSystem: true,
    required: false,
    defaultVisible: true,
    order: 5,
  },
  {
    id: 'startDate',
    name: 'Start Date',
    type: 'date',
    description: 'Task start date',
    isSystem: true,
    required: false,
    defaultVisible: false,
    order: 6,
  },
  {
    id: 'endDate',
    name: 'Due Date',
    type: 'date',
    description: 'Task due/end date',
    isSystem: true,
    required: false,
    defaultVisible: true,
    order: 7,
  },
  {
    id: 'priority',
    name: 'Priority',
    type: 'select-one',
    description: 'Priority level of the task',
    isSystem: true,
    required: false,
    defaultVisible: true,
    order: 8,
  },
] as const;

interface TasksState {
  tasks: Task[];
  subtasks: Subtask[];
  systemFieldVisibility: Record<string, boolean>; // { projectId-fieldId: boolean }
  columnConfigs: ColumnConfig[];
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: (projectId: string, isSilent?: boolean) => Promise<void>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  getTasksByProject: (projectId: string) => Task[];
  addTask: (task: Omit<Task, 'id' | 'order'>, onConfirmed?: (realId: string) => void) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (taskId: string, newName: string, selectedFieldIds: string[]) => Promise<string>;
  convertTaskToSubtask: (
    taskId: string,
    parentTaskId: string,
    updates: {
      name: string;
      priority?: string;
      endDate?: string;
      assignee?: string;
    }
  ) => Promise<void>;

  addSubtask: (subtask: Omit<Subtask, "id" | "order">) => Promise<string>;
  updateSubtask: (id: string, updates: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  getSubtasksByTask: (taskId: string) => Subtask[];

  getSystemFields: () => SystemFieldConfig[];
  getVisibleSystemFields: (projectId: string, viewType?: string) => SystemFieldConfig[];
  toggleSystemFieldVisibility: (projectId: string, fieldId: string, viewType?: string) => void;
  isSystemFieldVisible: (projectId: string, fieldId: string, viewType?: string) => boolean;

  updateTaskCustomField: (taskId: string, fieldId: string, value: string | string[]) => Promise<void>;
  updateSubtaskCustomField: (subtaskId: string, fieldId: string, value: string | string[]) => void;

  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  assignTask: (taskId: string, assigneeId: string) => Promise<void>;

  reorderTasks: (projectId: string, taskIds: string[]) => void;
  reorderSubtasks: (taskId: string, subtaskIds: string[]) => void;

  // Column config actions
  setColumnOrder: (fieldId: string, order: number) => void;
  toggleColumnFreeze: (fieldId: string, freezeState: boolean) => void;
  toggleColumnVisibility: (fieldId: string) => void;
  initializeColumnConfigs: (projectId: string) => void;
  updateColumnWidth: (columnId: string, width: number) => void;

  // In TasksState interface
  addTaskRelationship: (taskId: string, relationship: Omit<TaskRelationship, 'id'>) => Promise<void>;
  removeTaskRelationship: (taskId: string, relationshipId: string) => Promise<void>;
  getTaskRelationships: (taskId: string) => TaskRelationship[];

  // Checklist methods
  addChecklist: (taskId: string, name: string) => string;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  getChecklistsByTask: (taskId: string) => Checklist[];

  // Checklist item methods
  addChecklistItem: (checklistId: string, name: string) => string;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (id: string) => void;
  toggleChecklistItem: (id: string) => void;
  getChecklistItems: (checklistId: string) => ChecklistItem[];
  assignMemberToChecklistItem: (itemId: string, memberId: string) => void;
  unassignMemberFromChecklistItem: (itemId: string, memberId: string) => void;
  // Task document linking
  addTaskDocument: (taskId: string, docId: string) => void;
  removeTaskDocument: (taskId: string, docId: string) => void;

  // Custom field cleanup when fields are deleted
  clearCustomFieldFromTasks: (fieldId: string) => void;
  clearCustomFieldOptionFromTasks: (fieldId: string, option: string) => void;

  clearAllTasks: () => void;
  reset: () => void;
}


// Helper function to generate auto numbers
const generateAutoNumber = (
  customField: TaskCustomField,
  existingTasks: Task[],
  projectId: string
): number => {
  const startFrom = customField.startFrom ?? 1;

  // Filter tasks by project
  let relevantTasks = existingTasks.filter(task => task.projectId === projectId);

  // Get existing auto numbers for this field
  const existingNumbers = relevantTasks
    .map(task => {
      const value = task.customFieldValues?.[customField.id];
      return typeof value === 'number' ? value : 0;
    })
    .filter(num => num > 0);

  if (existingNumbers.length === 0) {
    return startFrom; // ✅ first task starts from startFrom
  }

  // Always increment from max (no more ascending/descending)
  return Math.max(...existingNumbers) + 1;  // ✅ simple increment
};

// Add this helper above mapAPITaskToStore:
const mapCustomFieldValuesFromAPI = (
  customFieldValues: Record<string, any>,
  projectId: string
): Record<string, any> => {
  const { getTaskCustomFields } = useProjectsStore.getState();
  const customFields = getTaskCustomFields(projectId);

  const result: Record<string, any> = {};
  for (const [nameOrId, value] of Object.entries(customFieldValues)) {
    // Try to find by name first (API response uses names)
    const fieldByName = customFields.find(f => f.name === nameOrId);
    if (fieldByName) {
      result[fieldByName.id] = value;  // ← store by id
    } else {
      // fallback: already an id or unknown field, keep as-is
      result[nameOrId] = value;
    }
  }
  return result;
};

// Maps API TaskResponse → store Task shape
const mapAPITaskToStore = (apiTask: TaskResponse, projectId: string): Task => ({
  id: apiTask.id,
  taskNumber: apiTask.taskNumber,
  projectId: apiTask.projectId ?? projectId,
  name: apiTask.title,
  description: apiTask.description,
  taskType: apiTask.taskType,
  assignee: apiTask.assigneeId,
  startDate: apiTask.startDate,
  endDate: apiTask.dueDate,
  priority: apiTask.priority,
  status: apiTask.status,
  parentTaskId: apiTask.parentTaskId,
  // ← Convert name-keyed values from API back to id-keyed for store
  customFieldValues: apiTask.customFieldValues
    ? mapCustomFieldValuesFromAPI(apiTask.customFieldValues, projectId)
    : {},
  attachments: apiTask.attachments || [],
  attachmentIds: apiTask.attachments ? apiTask.attachments.map(a => a.id) : [],
  createdAt: apiTask.createdAt,
  completed: false,
  order: 0,
  relationships: mapRelationshipsFromAPI(apiTask),
  subtasks: [],
  labelIds: apiTask.labelIds || [],
  labels: apiTask.labels || [],
  cycleId: apiTask.cycleId,
  cycle: apiTask.cycle,
});

const mapAPISubtaskToStore = (apiTask: TaskResponse, projectId: string): Subtask => ({
  id: apiTask.id,
  taskNumber: apiTask.taskNumber,
  projectId: apiTask.projectId ?? projectId,
  parentTaskId: apiTask.parentTaskId!,   // guaranteed non-null when calling this
  name: apiTask.title,
  description: apiTask.description,
  taskType: apiTask.taskType,
  assignee: apiTask.assigneeId,
  startDate: apiTask.startDate,
  endDate: apiTask.dueDate,
  priority: apiTask.priority,
  status: apiTask.status,
  customFieldValues: apiTask.customFieldValues
    ? mapCustomFieldValuesFromAPI(apiTask.customFieldValues, projectId)
    : {},
  completed: false,
  order: 0,
  createdAt: apiTask.createdAt,
  relationships: mapRelationshipsFromAPI(apiTask),
  attachments: apiTask.attachments || [],
  attachmentIds: apiTask.attachments ? apiTask.attachments.map(a => a.id) : [],
  labelIds: apiTask.labelIds || [],
  labels: apiTask.labels || [],
  cycleId: apiTask.cycleId,
  cycle: apiTask.cycle,
});


// Converts { [fieldId]: value } → { [fieldName]: value } for API
const mapCustomFieldValuesToAPI = (
  customFieldValues: Record<string, any>,
  projectId: string
): Record<string, any> => {
  const { getTaskCustomFields } = useProjectsStore.getState();
  const customFields = getTaskCustomFields(projectId);

  const result: Record<string, any> = {};
  for (const [fieldId, value] of Object.entries(customFieldValues)) {
    const field = customFields.find(f => f.id === fieldId);
    if (field) {
      result[field.name] = value;  // ← use name as key
    }
    // if field not found, skip it (prevents the 400 error)
  }
  return result;
};

const mapRelationshipsToAPI = (relationships: TaskRelationship[]) => {
  const result: {
    relatesTo: string[];
    duplicateOf: string[];
    blockedBy: string[];
    startsBefore: string[];
    startsAfter: string[];
    blocking: string[];
    finishesBefore: string[];
    finishesAfter: string[];
  } = {
    relatesTo: [],
    duplicateOf: [],
    blockedBy: [],
    startsBefore: [],
    startsAfter: [],
    blocking: [],
    finishesBefore: [],
    finishesAfter: [],
  };

  for (const rel of relationships) {
    switch (rel.type) {
      case 'relates-to': result.relatesTo.push(rel.targetTaskId); break;
      case 'duplicate-of': result.duplicateOf.push(rel.targetTaskId); break;
      case 'blocked-by': result.blockedBy.push(rel.targetTaskId); break;
      case 'starts-before': result.startsBefore.push(rel.targetTaskId); break;
      case 'starts-after': result.startsAfter.push(rel.targetTaskId); break;
      case 'blocking': result.blocking.push(rel.targetTaskId); break;
      // case 'finishes-before': result.finishesBefore.push(rel.targetTaskId); break;
      // case 'finishes-after': result.finishesAfter.push(rel.targetTaskId); break;
    }
  }
  return result;
};

// Maps flat API relationship arrays → store TaskRelationship[]
const mapRelationshipsFromAPI = (apiTask: TaskResponse): TaskRelationship[] => {
  const relationships: TaskRelationship[] = [];

  const mapGroup = (
    items: Array<{ id: string }> | undefined,
    type: TaskRelationship['type']
  ) => {
    (items || []).forEach(item => {
      relationships.push({
        id: `rel-${type}-${item.id}`,  // stable id from type + targetId
        type,
        targetTaskId: item.id,
      });
    });
  };

  mapGroup(apiTask.relatesTo, 'relates-to');
  mapGroup(apiTask.duplicateOf, 'duplicate-of');
  mapGroup(apiTask.blockedBy, 'blocked-by');
  mapGroup(apiTask.startsBefore, 'starts-before');
  mapGroup(apiTask.startsAfter, 'starts-after');
  mapGroup(apiTask.blocking, 'blocking');
  // mapGroup(apiTask.finishesBefore, 'finishes-before');
  // mapGroup(apiTask.finishesAfter, 'finishes-after');

  return relationships;
};

const RELATIONSHIP_TYPE_TO_API_KEY: Record<string, string> = {
  'relates-to': 'relatesTo',
  'duplicate-of': 'duplicateOf',
  'blocked-by': 'blockedBy',
  'starts-before': 'startsBefore',
  'starts-after': 'startsAfter',
  'blocking': 'blocking',
  // 'finishes-before': 'finishesBefore',
  // 'finishes-after': 'finishesAfter',
};


export const useTasksStore = create<TasksState>()(
  devtools(
    persist(
      (set, get) => ({
        tasks: [],
        subtasks: [],
        systemFieldVisibility: {},
        columnConfigs: [],
        checklists: [],
        checklistItems: [],
        isLoading: false,
        error: null,

        clearAllTasks: () => {
          set(
            {
              tasks: [],
              subtasks: [],
            },
            false,
            'tasks/clearAllTasks'
          );
        },

        fetchTasks: async (projectId: string, isSilent: boolean = false) => {
          if (!isSilent) {
            set({ isLoading: true, error: null }, false, 'fetchTasks/start');
          }
          try {
            if (projectId) {
              // ✅ Fetch real tasks from API
              const apiTasks = await getTasksApi(projectId);
              const rootTasks: Task[] = [];
              const subtasks: Subtask[] = [];
              // First pass: split into root tasks and subtasks
              apiTasks.forEach((apiTask, i) => {
                if (apiTask.parentTaskId) {
                  // Subtask order = how many subtasks already exist for THIS parent
                  const siblingCount = subtasks.filter(
                    (st) => st.parentTaskId === apiTask.parentTaskId
                  ).length;
                  subtasks.push({ ...mapAPISubtaskToStore(apiTask, projectId), order: siblingCount });
                } else {
                  rootTasks.push({ ...mapAPITaskToStore(apiTask, projectId), order: 0 });
                }
              });

              // Second pass: attach subtask id references to parent tasks
              rootTasks.forEach((task) => {
                task.subtasks = subtasks
                  .filter((st) => st.parentTaskId === task.id)
                  .map((st) => st.id);
              });

              set(
                (state) => ({
                  tasks: [
                    ...state.tasks.filter((t) => t.projectId !== projectId),
                    ...rootTasks,
                  ],
                  subtasks: [
                    ...state.subtasks.filter((st) => st.projectId !== projectId),
                    ...subtasks,
                  ],
                  isLoading: false,
                }),
                false,
                "fetchTasks/success"
              );

              // set({
              //   tasks: mappedTasks,
              //   isLoading: false,
              // }, false, 'fetchTasks/success');
              // console.log("Updated tasks in store after fetch:", get().tasks);
            } else {
              set({ isLoading: false }, false, 'fetchTasks/noProjectId');
            }
          } catch (error: any) {
            set({
              error: error.message || 'Failed to fetch tasks',
              isLoading: false,
            }, false, 'fetchTasks/error');
          }
        },

        getTasksByProject: (projectId: string) => {
          return get().tasks.filter(task => task.projectId === projectId);
        },

        fetchTaskById: async (id: string) => {
          set({ isLoading: true, error: null }, false, 'fetchTaskById/start');
          try {
            const apiTask = await getTaskByIdApi(id);
            console.log('Fetched taskbyid from API:', apiTask);
            const mapped = mapAPITaskToStore(apiTask, apiTask.projectId);
            console.log('Mapped task for store:', mapped);

            set((state) => ({
              isLoading: false,
              tasks: state.tasks.map((t) => t.id === id ? mapped : t),
            }), false, 'fetchTaskById/success');
            console.log('Updated tasks in store:', get().tasks);

            return mapped;
          } catch (error: any) {
            set({
              error: error.message || 'Failed to fetch task',
              isLoading: false,
            }, false, 'fetchTaskById/error');
            return null;
          }
        },

        addTask: async (taskData: Omit<Task, 'id' | 'order'>, onConfirmed?: (realId: string) => void) => {
          const tempId = generateTempId();

          // 1. Build optimistic task and add to state IMMEDIATELY
          const optimisticTask: Task = {
            ...taskData,
            id: tempId,
            order: get().tasks.filter(t => t.projectId === taskData.projectId).length,
            completed: false,
            subtasks: [],
            createdAt: new Date().toISOString(),
          };

          set(
            (state) => ({ tasks: [...state.tasks, optimisticTask] }),
            false,
            'addTask/optimistic'
          );

          // 2. Build API payload
          const startDate = taskData.startDate ?? new Date().toISOString();
          const apiCustomFieldValues = taskData.customFieldValues
            ? mapCustomFieldValuesToAPI(taskData.customFieldValues, taskData.projectId)
            : undefined;

          const payload: CreateTaskRequest = {
            title: taskData.name,
            description: taskData.description,
            projectId: taskData.projectId,
            assigneeId: taskData.assignee,
            status: taskData.status,
            priority: taskData.priority as any,
            startDate,
            dueDate: taskData.endDate,
            customFieldValues: apiCustomFieldValues,
            taskType: taskData.taskType,
            ...(taskData.relationships?.length
              ? mapRelationshipsToAPI(taskData.relationships)
              : {}),
            attachments: taskData.attachmentIds,
            labelIds: taskData.labelIds,
            cycleId: taskData.cycleId,
          };

          // ✅ Fire and forget — don't await here
          retryWithBackoff(() => createTaskApi(payload))
            .then((created) => {
              const realTask = mapAPITaskToStore(created, taskData.projectId);
              // Update store first
              set(
                (state) => ({ tasks: state.tasks.map((t) => t.id === tempId ? realTask : t) }),
                false, 'addTask/confirmed'
              );
              // Then notify component with real id after a tick,
              // so the store render completes before component state updates
              if (onConfirmed) {
                setTimeout(() => onConfirmed(created.id), 0);
              }

              // 3. Refresh project tasks silently to catch any automation side-effects
              get().fetchTasks(taskData.projectId, true);
            })
            .catch((error) => {
              // All 3 retries failed → rollback
              set(
                (state) => ({
                  tasks: state.tasks.filter((t) => t.id !== tempId),
                  error: error.message || 'Failed to create task',
                }),
                false,
                'addTask/rollback'
              );
              toast('error', {
                title: 'Failed to create task',
                description: 'Changes have been reverted.',
              });
            });
          return tempId;
        },

        updateTask: async (id: string, updates: Partial<Task>) => {
          try {
            // Get the task to know its projectId
            const task = get().tasks.find(t => t.id === id);
            if (!task) return;

            // Convert customFieldValues keys from id → name for API
            const apiCustomFieldValues = updates.customFieldValues
              ? mapCustomFieldValuesToAPI(updates.customFieldValues, task.projectId)
              : undefined;

            const payload: UpdateTaskRequest = {
              title: updates.name,
              description: updates.description,
              assigneeId: updates.assignee,
              status: updates.status,
              priority: updates.priority as any,
              startDate: updates.startDate,
              dueDate: updates.endDate,
              taskType: updates.taskType,
              customFieldValues: apiCustomFieldValues,  // ← mapped names not ids
              attachments: updates.attachmentIds,
              labelIds: updates.labelIds,
              cycleId: updates.cycleId,
            };

            await updateTaskApi(id, payload);

            // Optimistic local update still uses field IDs (store uses IDs internally)
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, ...updates } : t
              ),
            }), false, 'updateTask');

            // --- Simulation Logic ---
            toast('success', { title: 'Task Details Updated!' });
          } catch (error: any) {
            set({ error: error.message || 'Failed to update task' }, false, 'updateTask/error');
            throw error;
          }
        },

        deleteTask: async (id: string) => {
          // 1. Snapshot for rollback
          const taskSnapshot = get().tasks.find((t) => t.id === id);
          const subtaskSnapshot = get().subtasks.filter((st) => st.parentTaskId === id);

          if (!taskSnapshot) return;

          // 2. Remove from state IMMEDIATELY (optimistic)
          set(
            (state) => ({
              tasks: state.tasks.filter((t) => t.id !== id),
              subtasks: state.subtasks.filter((st) => st.parentTaskId !== id),
            }),
            false,
            'deleteTask/optimistic'
          );

          // 3. Retry up to 3 times in background
          try {
            await retryWithBackoff(() => deleteTaskApi(id));
          } catch (error: any) {
            // 4. All retries failed → restore snapshot + toast
            set(
              (state) => ({
                tasks: [...state.tasks, taskSnapshot],
                subtasks: [...state.subtasks, ...subtaskSnapshot],
                error: error.message || 'Failed to delete task',
              }),
              false,
              'deleteTask/rollback'
            );

            toast('error', {
              title: 'Failed to delete task',
              description: 'The task has been restored.',
            });

            throw error;
          }
        },

        duplicateTask: async (taskId, newName, selectedFieldIds) => {
          const state = get();
          const original =
            state.tasks.find((t) => t.id === taskId) ??
            (state.subtasks.find((st) => st.id === taskId) as unknown as Task | undefined);

          if (!original) throw new Error("Task not found");

          const isSubtask = !state.tasks.find((t) => t.id === taskId);

          const include = (fieldId: string) => selectedFieldIds.includes(fieldId);

          // Build relationships array — only include if "relationships" is checked
          // All 8 relationship types are included under one checkbox
          const relationships = include("relationships")
            ? original.relationships ?? []
            : [];

          const payload: Omit<Task, "id"> = {
            name: newName,
            projectId: original.projectId,
            parentTaskId: isSubtask ? (original as any).parentTaskId : undefined,
            status: original.status,
            priority: include("priority") ? original.priority : undefined,
            taskType: include("task_type") ? original.taskType : undefined,
            assignee: include("assignee") ? original.assignee : undefined,
            endDate: include("due_date") ? original.endDate : undefined,
            startDate: original.startDate,
            customFieldValues: include("custom_field_values")
              ? original.customFieldValues
              : undefined,
            description: original.description,
            // Attachments — pass attachment IDs only
            attachmentIds: include("attachments")
              ? (original.attachmentIds ?? [])
              : [],
            // Relationships — all types under one flag
            relationships,
            completed: false,
            order: 0,
            subtasks: [],
          };

          // ✅ Route to correct store method based on type
          const newId = isSubtask
            ? await get().addSubtask({ ...payload, parentTaskId: (original as any).parentTaskId })
            : await get().addTask(payload);
          toast('success', { title: "Task duplicated successfully" });
          return newId;
        },

        convertTaskToSubtask: async (taskId, parentTaskId, updates) => {
          const task = get().tasks.find((t) => t.id === taskId);
          if (!task) return;

          try {
            // 1. Call API — send parentTaskId + all updated fields
            await updateTaskApi(taskId, {
              parentTaskId,
              title: updates.name,
              assigneeId: updates.assignee,
              priority: updates.priority as any,
              dueDate: updates.endDate,
            });

            // 2. Build the subtask object from the existing task
            const subtask: Subtask = {
              id: task.id,
              taskNumber: task.taskNumber,
              projectId: task.projectId,
              parentTaskId,
              name: updates.name,
              description: task.description,
              taskType: task.taskType,
              assignee: updates.assignee,
              startDate: task.startDate,
              endDate: updates.endDate,
              priority: task.priority,
              status: task.status,
              customFieldValues: task.customFieldValues || {},
              completed: task.completed,
              order: get().subtasks.filter(s => s.parentTaskId === parentTaskId).length,
              createdAt: task.createdAt,
              relationships: task.relationships,
              attachments: task.attachments,
              attachmentIds: task.attachmentIds,
              cycleId: task.cycleId,
              cycle: task.cycle,
            };

            set((state) => ({
              // 3. Remove from tasks[]
              tasks: state.tasks.filter((t) => t.id !== taskId),

              // 4. Add to subtasks[]
              subtasks: [...state.subtasks, subtask],

              // 5. Attach subtask id reference to parent task's subtasks array
              // tasks already filtered above, use a second map pass
            }), false, 'convertTaskToSubtask');

            // 6. Update parent task's subtasks[] reference
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === parentTaskId
                  ? { ...t, subtasks: [...(t.subtasks || []), taskId] }
                  : t
              ),
            }), false, 'convertTaskToSubtask/attachToParent');

          } catch (error: any) {
            console.error('Failed to convert task to subtask:', error);
            toast('error', { title: 'Failed to convert task to subtask' });
            throw error;
          }
        },

        updateTaskStatus: async (taskId: string, status: string) => {
          try {
            await updateTaskStatusApi(taskId, status);
            set((state) => ({
              tasks: state.tasks.map((task) =>
                task.id === taskId ? { ...task, status } : task
              ),
            }), false, 'updateTaskStatus');

            // --- Simulation Logic ---
            toast('success', { title: `Status changed to ${status}` });
          } catch (error: any) {
            set({ error: error.message || 'Failed to update status' }, false, 'updateTaskStatus/error');
            throw error;
          }
        },

        assignTask: async (taskId: string, assigneeId: string) => {
          try {
            await assignTaskApi(taskId, assigneeId);
            set((state) => ({
              tasks: state.tasks.map((task) =>
                task.id === taskId ? { ...task, assignee: assigneeId } : task
              ),
            }), false, 'assignTask');

            // --- Simulation Logic ---
            toast('success', { title: 'Assignee Notified!' });
          } catch (error: any) {
            set({ error: error.message || 'Failed to assign task' }, false, 'assignTask/error');
            throw error;
          }
        },

        addSubtask: async (subtaskData: Omit<Subtask, "id" | "order">) => {
          const parentTask = get().tasks.find((t) => t.id === subtaskData.parentTaskId);
          if (!parentTask) throw new Error("Parent task not found");

          // Auto-generate auto-number fields
          let customFieldValues = subtaskData.customFieldValues || {};
          const { getTaskCustomFields } = useProjectsStore.getState();
          const projectCustomFields = getTaskCustomFields(parentTask.projectId);
          projectCustomFields.forEach((field) => {
            if (field.type === "auto-number") {
              const autoNum = generateAutoNumber(field as TaskCustomField, get().tasks, parentTask.projectId);
              customFieldValues = { ...customFieldValues, [field.id]: autoNum };
            }
          });

          // 1. Generate temp ID and add to state IMMEDIATELY
          const tempId = generateTempId();
          const order = get().subtasks.filter((st) => st.parentTaskId === parentTask.id).length;

          const optimisticSubtask: Subtask = {
            ...subtaskData,
            id: tempId,
            order,
            customFieldValues,
            parentTaskId: parentTask.id,
            createdAt: new Date().toISOString(),
            completed: false,
          };

          set(
            (state) => ({
              subtasks: [...state.subtasks, optimisticSubtask],
              tasks: state.tasks.map((task) =>
                task.id === parentTask.id
                  ? { ...task, subtasks: [...(task.subtasks || []), tempId] }
                  : task
              ),
            }),
            false,
            "addSubtask/optimistic"
          );

          // 2. Build API payload
          const apiCustomFieldValues = mapCustomFieldValuesToAPI(customFieldValues, parentTask.projectId);
          const startDate = subtaskData.startDate ?? new Date().toISOString();

          const payload: CreateTaskRequest = {
            title: subtaskData.name,
            description: subtaskData.description,
            projectId: parentTask.projectId,
            parentTaskId: parentTask.id,
            assigneeId: subtaskData.assignee,
            status: subtaskData.status,
            priority: subtaskData.priority as any,
            startDate,
            dueDate: subtaskData.endDate,
            customFieldValues: apiCustomFieldValues,
            taskType: subtaskData.taskType || "task",
            ...(subtaskData.relationships?.length
              ? mapRelationshipsToAPI(subtaskData.relationships)
              : {}),
            attachments: subtaskData.attachmentIds,
            labelIds: subtaskData.labelIds,
            cycleId: subtaskData.cycleId,
          };

          // 3. Fire API in background — don't await, return tempId immediately
          retryWithBackoff(() => createTaskApi(payload))
            .then((created) => {
              const mapped = mapAPISubtaskToStore(created, parentTask.projectId);
              const realSubtask: Subtask = {
                ...mapped,
                order,
                customFieldValues, // keep store's id-keyed values
              };

              // Replace temp subtask + temp id reference in parent task
              set(
                (state) => ({
                  subtasks: state.subtasks.map((st) =>
                    st.id === tempId ? realSubtask : st
                  ),
                  tasks: state.tasks.map((task) =>
                    task.id === parentTask.id
                      ? {
                        ...task,
                        subtasks: (task.subtasks || []).map((id) =>
                          id === tempId ? mapped.id : id
                        ),
                      }
                      : task
                  ),
                }),
                false,
                "addSubtask/confirmed"
              );

              // 4. Refresh project tasks silently to catch any automation side-effects
              get().fetchTasks(parentTask.projectId, true);
            })
            .catch((error) => {
              // All 3 retries failed → rollback subtask and parent reference
              set(
                (state) => ({
                  subtasks: state.subtasks.filter((st) => st.id !== tempId),
                  tasks: state.tasks.map((task) =>
                    task.id === parentTask.id
                      ? {
                        ...task,
                        subtasks: (task.subtasks || []).filter((id) => id !== tempId),
                      }
                      : task
                  ),
                  error: error.message ?? "Failed to create subtask",
                }),
                false,
                "addSubtask/rollback"
              );

              toast('error', {
                title: "Failed to create subtask",
                description: "Changes have been reverted.",
              });
            });

          return tempId; // ← returns instantly, input row can close NOW
        },

        updateSubtask: async (id: string, updates: Partial<Subtask>) => {
          const state = get();
          const subtask = state.subtasks.find((st) => st.id === id);
          if (!subtask) return;

          // Resolve the parent task (new or existing) for projectId
          const parentId = updates.parentTaskId ?? subtask.parentTaskId;
          const parentTask = state.tasks.find((t) => t.id === parentId);
          if (!parentTask) return;

          // Map customFieldValues ids → names for API (only if being updated)
          const apiCustomFieldValues = updates.customFieldValues
            ? mapCustomFieldValuesToAPI(updates.customFieldValues, parentTask.projectId)
            : undefined;

          try {
            const payload: UpdateTaskRequest = {
              title: updates.name,
              description: updates.description,
              assigneeId: updates.assignee,
              status: updates.status,
              priority: updates.priority as any,
              startDate: updates.startDate,
              dueDate: updates.endDate,
              taskType: updates.taskType ?? subtask.taskType ?? "task",
              parentTaskId: parentId,                        // keep or change parent
              customFieldValues: apiCustomFieldValues,
              labelIds: updates.labelIds,
              cycleId: updates.cycleId,
            };

            await updateTaskApi(id, payload);

            // Local state update + re-parenting if parentTaskId changed
            set(
              (state) => {
                const oldParentId = subtask.parentTaskId;
                const newParentId = updates.parentTaskId ?? oldParentId;

                const updatedSubtasks = state.subtasks.map((st) =>
                  st.id === id ? { ...st, ...updates, parentTaskId: newParentId } : st
                );

                let updatedTasks = state.tasks;
                if (newParentId && oldParentId !== newParentId) {
                  updatedTasks = state.tasks.map((task) => {
                    if (task.id === oldParentId) {
                      return {
                        ...task,
                        subtasks: (task.subtasks || []).filter((stId) => stId !== id),
                      };
                    }
                    if (task.id === newParentId) {
                      return {
                        ...task,
                        subtasks: [...(task.subtasks || []), id],
                      };
                    }
                    return task;
                  });
                }

                return { subtasks: updatedSubtasks, tasks: updatedTasks };
              },
              false,
              "updateSubtask"
            );
          } catch (error: any) {
            set({ error: error.message ?? "Failed to update subtask" }, false, "updateSubtask:error");
            throw error;
          }
        },

        deleteSubtask: async (id: string) => {
          // 1. Snapshot for rollback
          const subtaskSnapshot = get().subtasks.find(st => st.id === id);
          if (!subtaskSnapshot) return;

          const parentId = subtaskSnapshot.parentTaskId;

          // 2. Remove from state IMMEDIATELY — optimistic
          set(
            state => ({
              subtasks: state.subtasks.filter(st => st.id !== id),
              tasks: state.tasks.map(task =>
                task.id === parentId
                  ? { ...task, subtasks: task.subtasks?.filter(stId => stId !== id) }
                  : task
              ),
            }),
            false,
            'deleteSubtask/optimistic'
          );

          // 3. Fire API with retryWithBackoff — 3 retries before rollback
          try {
            await retryWithBackoff(() => deleteTaskApi(id));
          } catch (error: any) {
            // 4. All retries failed — restore snapshot and notify user
            set(
              state => ({
                subtasks: [...state.subtasks, subtaskSnapshot],
                tasks: state.tasks.map(task =>
                  task.id === parentId
                    ? { ...task, subtasks: [...(task.subtasks ?? []), id] }
                    : task
                ),
                error: error.message ?? 'Failed to delete subtask',
              }),
              false,
              'deleteSubtask/rollback'
            );
            toast('error', {
              title: 'Failed to delete subtask',
              description: 'The subtask has been restored.',
            });
          }
        },

        getSubtasksByTask: (parentTaskId: string) => {
          return get()
            .subtasks.filter((subtask) => subtask.parentTaskId === parentTaskId)
            .sort((a, b) => a.order - b.order);
        },

        // ========== SYSTEM FIELD METHODS ==========
        getSystemFields: () => {
          return SYSTEM_FIELDS;
        },

        getVisibleSystemFields: (projectId: string, viewType: string = "list") => {
          const visibility = get().systemFieldVisibility;
          return SYSTEM_FIELDS.filter(field => {
            const key = `${projectId}-${viewType}-${field.id}`;
            if (visibility[key] !== undefined) return visibility[key];

            if (viewType === "gantt") {
              const ganttDefaults = ["id", "task", "endDate"];
              return ganttDefaults.includes(field.id);
            }
            return field.defaultVisible;
          }).sort((a, b) => a.order - b.order);
        },

        isSystemFieldVisible: (projectId: string, fieldId: string, viewType: string = "list") => {
          const visibility = get().systemFieldVisibility;
          const key = `${projectId}-${viewType}-${fieldId}`;
          const field = SYSTEM_FIELDS.find(f => f.id === fieldId);

          // If no visibility setting, use defaultVisible
          if (visibility[key] === undefined) {
            // Check legacy key for backward compatibility
            const legacyKey = `${projectId}-${fieldId}`;
            if (visibility[legacyKey] !== undefined) {
              return visibility[legacyKey];
            }

            if (viewType === "gantt") {
              const ganttDefaults = ["id", "task", "endDate"];
              return ganttDefaults.includes(fieldId);
            }
            return field?.defaultVisible ?? true;
          }

          return visibility[key];
        },


        toggleSystemFieldVisibility: (projectId: string, fieldId: string, viewType: string = "list") => {
          const field = SYSTEM_FIELDS.find(f => f.id === fieldId);

          // Don't allow hiding required fields
          if (field?.required) {
            console.warn(`Cannot hide required field: ${fieldId}`);
            return;
          }

          set((state) => {
            const key = `${projectId}-${viewType}-${fieldId}`;
            const legacyKey = `${projectId}-${fieldId}`;

            // Determine current visibility using the same logic as the UI
            let currentVisibility = state.systemFieldVisibility[key];

            if (currentVisibility === undefined) {
              if (state.systemFieldVisibility[legacyKey] !== undefined) {
                currentVisibility = state.systemFieldVisibility[legacyKey];
              } else if (field) {
                if (viewType === "gantt") {
                  // Gantt Default: ID, Task Name, and Due Date only
                  const ganttDefaults = ["id", "task", "endDate"];
                  currentVisibility = ganttDefaults.includes(fieldId);
                } else {
                  currentVisibility = field.defaultVisible;
                }
              } else {
                // Custom fields default: visible in list, hidden in gantt
                currentVisibility = viewType === "list";
              }
            }

            return {
              systemFieldVisibility: {
                ...state.systemFieldVisibility,
                [key]: !currentVisibility,
              },
            };
          }, false, 'toggleSystemFieldVisibility');
        },

        updateTaskCustomField: async (taskId: string, fieldId: string, value: string | string[]) => {
          // 1. Optimistic local update (store keeps field IDs internally)
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                  ...task,
                  customFieldValues: {
                    ...(task.customFieldValues || {}),
                    [fieldId]: value,
                  },
                }
                : task
            ),
          }));

          // 2. Persist to API with field names as keys
          try {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            // // Build the full updated customFieldValues with field IDs
            // const updatedByIds = {
            //   ...(task.customFieldValues || {}),
            //   [fieldId]: value,
            // };

            // // Convert ALL field id keys → field name keys for API
            // const apiCustomFieldValues = mapCustomFieldValuesToAPI(
            //   updatedByIds,
            //   task.projectId
            // );
            // AFTER — sends ONLY the changed field:
            // Only send the single field being updated
            const changedField = { [fieldId]: value };

            const apiCustomFieldValues = mapCustomFieldValuesToAPI(
              changedField,        // ← only the one field
              task.projectId
            );

            await updateTaskApi(taskId, {
              customFieldValues: apiCustomFieldValues,
            });
          } catch (error: any) {
            console.error('Failed to update custom field:', error);
          }
        },

        updateSubtaskCustomField: async (subtaskId: string, fieldId: string, value: string | string[]) => {
          // Optimistic local update first
          set((state) => ({
            subtasks: state.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, customFieldValues: { ...subtask.customFieldValues, [fieldId]: value } }
                : subtask
            ),
          }));

          // Persist to API via updateSubtask (which handles field name mapping)
          const subtask = get().subtasks.find((st) => st.id === subtaskId);
          if (!subtask) return;

          // const updatedValues = { ...subtask.customFieldValues, [fieldId]: value };
          // await get().updateSubtask(subtaskId, { customFieldValues: updatedValues });
          const changedField = { [fieldId]: value };  // ← only changed field
          await get().updateSubtask(subtaskId, { customFieldValues: changedField });
        },

        reorderTasks: (projectId: string, taskIds: string[]) => {
          set((state) => {
            const updatedTasks = state.tasks.map((task) => {
              if (task.projectId === projectId) {
                const newOrder = taskIds.indexOf(task.id);
                return newOrder >= 0 ? { ...task, order: newOrder } : task;
              }
              return task;
            });
            return { tasks: updatedTasks.sort((a, b) => a.order - b.order) };
          }, false, 'reorderTasks');
        },

        addTaskDocument: (taskId: string, docId: string) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                  ...task,
                  linkedDocuments: Array.from(new Set([...(task.linkedDocuments || []), docId])),
                }
                : task
            ),
          }), false, 'addTaskDocument');
        },

        removeTaskDocument: (taskId: string, docId: string) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                  ...task,
                  linkedDocuments: (task.linkedDocuments || []).filter(id => id !== docId),
                }
                : task
            ),
          }), false, 'removeTaskDocument');
        },

        reorderSubtasks: (parentTaskId: string, subtaskIds: string[]) => {
          set((state) => {
            const updatedSubtasks = state.subtasks.map((subtask) => {
              if (subtask.parentTaskId === parentTaskId) {
                const newOrder = subtaskIds.indexOf(subtask.id);
                return newOrder >= 0 ? { ...subtask, order: newOrder } : subtask;
              }
              return subtask;
            });
            return { subtasks: updatedSubtasks };
          }, false, 'reorderSubtasks');
        },
        // Add actions
        setColumnOrder: (fieldId: string, order: number) => {
          set((state) => ({
            columnConfigs: state.columnConfigs.map(col =>
              col.id === fieldId ? { ...col, columnOrder: order } : col
            ),
          }));
        },

        toggleColumnFreeze: (fieldId: string, freezeState: boolean) => {
          set((state) => ({
            columnConfigs: state.columnConfigs.map(col => {
              // ✅ Prevent toggling freeze state for system columns
              if (col.id === fieldId && !col.isSystemColumn) {
                return { ...col, columnFreezed: freezeState };
              }
              return col;
            }),
          }));
        },


        toggleColumnVisibility: (fieldId: string) => {
          set((state) => ({
            columnConfigs: state.columnConfigs.map(col =>
              col.id === fieldId ? { ...col, pinned: !col.pinned } : col
            ),
          }));
        },

        initializeColumnConfigs: (projectId: string) => {
          const { getTaskCustomFields } = useProjectsStore.getState();
          const customFields = getTaskCustomFields(projectId);

          // UI Control columns (always at the start)
          const uiColumns = [
            { id: 'drag', fieldName: 'Drag', columnOrder: -2, columnFreezed: true, pinned: true, isSystemColumn: true },
            { id: 'checkbox', fieldName: 'Checkbox', columnOrder: -1, columnFreezed: true, pinned: true, isSystemColumn: true },
          ];

          // Default data columns
          const defaultColumns: ColumnConfig[] = [
            { id: 'id', fieldName: 'ID', columnOrder: 0, columnFreezed: true, pinned: true, isSystemColumn: true },
            { id: 'task', fieldName: 'Task', columnOrder: 1, columnFreezed: true, pinned: true, isSystemColumn: true },
            { id: 'taskType', fieldName: 'Type', columnOrder: 2, columnFreezed: false, pinned: false },  // ✅ ADD + hidden
            { id: 'status', fieldName: 'Status', columnOrder: 3, columnFreezed: false, pinned: true },
            { id: 'cycle', fieldName: 'Cycle', columnOrder: 4, columnFreezed: false, pinned: false },
            { id: 'assignee', fieldName: 'Assignee', columnOrder: 5, columnFreezed: false, pinned: true },
            { id: 'startDate', fieldName: 'Start Date', columnOrder: 6, columnFreezed: false, pinned: false },  // ✅ hidden
            { id: 'endDate', fieldName: 'Due Date', columnOrder: 7, columnFreezed: false, pinned: true },
            { id: 'priority', fieldName: 'Priority', columnOrder: 8, columnFreezed: false, pinned: true },
          ];

          // Custom field columns
          const customColumns = customFields.map((field, index) => ({
            id: field.id,
            fieldName: field.name,
            columnOrder: defaultColumns.length + index,
            columnFreezed: false,
            pinned: true,
          }));

          const allColumns = [...uiColumns, ...defaultColumns, ...customColumns];

          set({ columnConfigs: allColumns });
        },

        updateColumnWidth: (columnId: string, width: number) =>
          set(state => ({
            columnConfigs: state.columnConfigs.map(c =>
              c.id === columnId ? { ...c, width } : c
            ),
          })),

        // In store implementation
        addTaskRelationship: async (taskId, relationshipData) => {
          const id = `rel-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          const newRelationship: TaskRelationship = { ...relationshipData, id };

          const isSubtask = !!get().subtasks.find(st => st.id === taskId);
          const task = isSubtask
            ? get().subtasks.find(st => st.id === taskId) as unknown as Task
            : get().tasks.find(t => t.id === taskId);
          if (!task) return;

          if (isSubtask) {
            set((state) => ({
              subtasks: state.subtasks.map((st) =>
                st.id === taskId
                  ? { ...st, relationships: [...((st as any).relationships || []), newRelationship] }
                  : st
              ),
            }), false, 'addTaskRelationship/subtask');
          } else {
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, relationships: [...(t.relationships || []), newRelationship] }
                  : t
              ),
            }), false, 'addTaskRelationship');
          }

          try {
            const existingRels = (task.relationships || []) as TaskRelationship[];
            const sameType = [...existingRels, newRelationship]
              .filter(rel => rel.type === newRelationship.type)
              .map(rel => rel.targetTaskId);
            const apiKey = RELATIONSHIP_TYPE_TO_API_KEY[newRelationship.type];
            await updateTaskApi(taskId, { [apiKey]: sameType });
          } catch (error) {
            console.error('Failed to save relationship:', error);
          }
        },

        removeTaskRelationship: async (taskId, relationshipId) => {
          const isSubtask = !!get().subtasks.find(st => st.id === taskId);
          const task = isSubtask
            ? get().subtasks.find(st => st.id === taskId) as unknown as Task
            : get().tasks.find(t => t.id === taskId);
          if (!task) return;

          const removedRel = ((task as any).relationships || [] as TaskRelationship[])
            .find((rel: TaskRelationship) => rel.id === relationshipId);
          if (!removedRel) return;

          if (isSubtask) {
            set((state) => ({
              subtasks: state.subtasks.map((st) =>
                st.id === taskId
                  ? { ...st, relationships: ((st as any).relationships || []).filter((r: any) => r.id !== relationshipId) }
                  : st
              ),
            }), false, 'removeTaskRelationship/subtask');
          } else {
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, relationships: (t.relationships || []).filter(r => r.id !== relationshipId) }
                  : t
              ),
            }), false, 'removeTaskRelationship');
          }

          try {
            const remaining = ((task as any).relationships || [] as TaskRelationship[])
              .filter((r: TaskRelationship) => r.id !== relationshipId && r.type === removedRel.type)
              .map((r: TaskRelationship) => r.targetTaskId);
            const apiKey = RELATIONSHIP_TYPE_TO_API_KEY[removedRel.type];
            await updateTaskApi(taskId, { [apiKey]: remaining });
          } catch (error) {
            console.error('Failed to remove relationship:', error);
          }
        },

        getTaskRelationships: (taskId: string) => {
          const task = get().tasks.find((t) => t.id === taskId)
            ?? get().subtasks.find((st) => st.id === taskId) as unknown as Task | undefined;
          return task?.relationships || [];
        },

        // Checklist methods
        addChecklist: (taskId: string, name: string) => {
          const taskChecklists = get().checklists.filter(c => c.taskId === taskId);
          const order = taskChecklists.length;
          const id = `checklist-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          const newChecklist: Checklist = { id, taskId, name, items: [], order };

          set((state) => ({
            checklists: [...state.checklists, newChecklist],
          }), false, 'addChecklist');
          return id;
        },

        updateChecklist: (id: string, updates: Partial<Checklist>) => {
          set((state) => ({
            checklists: state.checklists.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }), false, 'updateChecklist');
        },

        deleteChecklist: (id: string) => {
          const checklist = get().checklists.find(c => c.id === id);
          set((state) => ({
            checklists: state.checklists.filter((c) => c.id !== id),
            checklistItems: state.checklistItems.filter((item) =>
              !checklist?.items.includes(item.id)
            ),
          }), false, 'deleteChecklist');
        },

        getChecklistsByTask: (taskId: string) => {
          return get().checklists
            .filter((c) => c.taskId === taskId)
            .sort((a, b) => a.order - b.order);
        },

        // Checklist item methods
        addChecklistItem: (checklistId: string, name: string) => {
          const checklistItems = get().checklistItems.filter(
            item => item.checklistId === checklistId
          );
          const order = checklistItems.length;
          const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          const newItem: ChecklistItem = {
            id,
            checklistId,
            name,
            completed: false,
            assignees: [],
            order,
          };

          set((state) => ({
            checklistItems: [...state.checklistItems, newItem],
            checklists: state.checklists.map((c) =>
              c.id === checklistId
                ? { ...c, items: [...c.items, id] }
                : c
            ),
          }), false, 'addChecklistItem');
          return id;
        },

        updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => {
          set((state) => ({
            checklistItems: state.checklistItems.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          }), false, 'updateChecklistItem');
        },

        deleteChecklistItem: (id: string) => {
          const item = get().checklistItems.find(i => i.id === id);
          set((state) => ({
            checklistItems: state.checklistItems.filter((i) => i.id !== id),
            checklists: state.checklists.map((c) =>
              c.id === item?.checklistId
                ? { ...c, items: c.items.filter(itemId => itemId !== id) }
                : c
            ),
          }), false, 'deleteChecklistItem');
        },

        toggleChecklistItem: (id: string) => {
          set((state) => ({
            checklistItems: state.checklistItems.map((item) =>
              item.id === id ? { ...item, completed: !item.completed } : item
            ),
          }), false, 'toggleChecklistItem');
        },

        getChecklistItems: (checklistId: string) => {
          return get().checklistItems
            .filter((item) => item.checklistId === checklistId)
            .sort((a, b) => a.order - b.order);
        },

        assignMemberToChecklistItem: (itemId: string, memberId: string) => {
          set((state) => ({
            checklistItems: state.checklistItems.map((item) =>
              item.id === itemId
                ? {
                  ...item,
                  assignees: [...(item.assignees || []), memberId],
                }
                : item
            ),
          }), false, 'assignMemberToChecklistItem');
        },

        unassignMemberFromChecklistItem: (itemId: string, memberId: string) => {
          set((state) => ({
            checklistItems: state.checklistItems.map((item) =>
              item.id === itemId
                ? {
                  ...item,
                  assignees: (item.assignees || []).filter(id => id !== memberId),
                }
                : item
            ),
          }), false, 'unassignMemberFromChecklistItem');
        },

        clearCustomFieldFromTasks: (fieldId: string) => {
          set(state => ({
            tasks: state.tasks.map(task => {
              const { [fieldId]: _, ...rest } = task.customFieldValues || {};
              return { ...task, customFieldValues: rest };
            }),
            subtasks: state.subtasks.map(subtask => {
              const { [fieldId]: _, ...rest } = subtask.customFieldValues || {};
              return { ...subtask, customFieldValues: rest };
            }),
          }));
        },

        clearCustomFieldOptionFromTasks: (fieldId: string, option: string) => {
          set(state => ({
            tasks: state.tasks.map(task => {
              const val = task.customFieldValues?.[fieldId];
              if (!val) return task;
              const newVal = Array.isArray(val)
                ? val.filter(v => v !== option)
                : val === option ? undefined : val;
              return {
                ...task,
                customFieldValues: newVal !== undefined
                  ? { ...task.customFieldValues, [fieldId]: newVal }
                  : (() => { const { [fieldId]: _, ...rest } = task.customFieldValues || {}; return rest; })(),
              };
            }),
          }));
        },

        reset: () => {
          set({
            tasks: [],
            subtasks: [],
            systemFieldVisibility: {},
            columnConfigs: [],
            checklists: [],
            checklistItems: [],
            isLoading: false,
            error: null,
          });
          localStorage.removeItem('tasks-storage');
        },

      }),
      {
        name: 'tasks-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tasks: state.tasks,
          subtasks: state.subtasks,
          columnConfigs: state.columnConfigs,
          checklists: state.checklists,
          checklistItems: state.checklistItems,
          systemFieldVisibility: state.systemFieldVisibility,
        }),
      }
    )
  )
);
