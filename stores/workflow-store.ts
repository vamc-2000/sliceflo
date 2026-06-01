// stores/workflow-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WorkflowOwner {
    id?: string;
    name: string;
    avatar: string;
}

export interface WorkflowNode {
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'plus';
    position: { x: number; y: number };
    data: {
        label?: string;
        description?: string;
        icon?: string;
        color?: string;
        [key: string]: any;
    };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    animated?: boolean;
    style?: any;
    markerEnd?: any;
}

export interface WorkflowData {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    viewport?: { x: number; y: number; zoom: number };
}

export interface Workflow {
    id: string;
    name: string;
    projectId?: string;
    description: string;
    lastUpdated: string;
    owner: WorkflowOwner;
    isActive: boolean;
    createdAt?: string;
    visibility?: 'private' | 'team' | 'workspace';
    workflowData?: WorkflowData;
}

export type TriggerType = 'TASK_CREATED' | 'STATUS_CHANGED' | 'PROJECT_CREATED';
export type ActionType = 'SEND_NOTIFICATION' | 'UPDATE_TASK' | 'CREATE_TASK';

export interface AutomationRun {
    id: string;
    workflowId: string;
    workflowName: string;
    status: 'success' | 'failed' | 'running';
    timestamp: string;
    description: string;
    triggerPayload?: any;
}

interface WorkflowState {
    workflows: Workflow[];
    runs: AutomationRun[];
    isLoading: boolean;
    error: string | null;

    // Workflow Actions
    fetchWorkflows: (projectId?: string) => Promise<void>;
    createWorkflow: (workflow: Omit<Workflow, 'id' | 'lastUpdated' | 'createdAt'>) => string;
    updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
    duplicateWorkflow: (id: string) => string;
    deleteWorkflow: (id: string) => void;
    toggleWorkflow: (id: string) => void;
    getWorkflowsByProject: (projectId: string) => Workflow[];
    getAllWorkflows: () => Workflow[];
    getWorkflowById: (id: string) => Workflow | undefined;

    // Execution Logic
    runWorkflows: (triggerType: TriggerType, payload: any) => Promise<void>;
    addRun: (run: Omit<AutomationRun, 'id'>) => void;
    getRunsByWorkflow: (workflowId: string) => AutomationRun[];

    // Workflow Data Actions
    updateWorkflowData: (workflowId: string, workflowData: WorkflowData) => void;
    getWorkflowData: (workflowId: string) => WorkflowData | undefined;
}

export const useWorkflowStore = create<WorkflowState>()(
    persist(
        (set, get) => ({
            workflows: [],
            runs: [],
            isLoading: false,
            error: null,

            fetchWorkflows: async (projectId?: string) => {
                set({ isLoading: true, error: null });
                try {
                    // TODO: API call when backend is ready
                    // const response = await fetch(`/api/workflows${projectId ? `?projectId=${projectId}` : ''}`);
                    // const data = await response.json();
                    // set({ workflows: data, isLoading: false });

                    // For now, use persisted data
                    set({ isLoading: false });
                } catch (error: any) {
                    set({
                        error: error.message || 'Failed to fetch workflows',
                        isLoading: false,
                    });
                }
            },

            createWorkflow: (workflow) => {
                const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const now = new Date().toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                const newWorkflow: Workflow = {
                    ...workflow,
                    id,
                    lastUpdated: now,
                    createdAt: now,
                    isActive: workflow.isActive ?? true,
                };

                set((state) => ({
                    workflows: [...state.workflows, newWorkflow],
                }));

                return id;
            },

            updateWorkflow: (id, updates) => {
                set((state) => ({
                    workflows: state.workflows.map((workflow) =>
                        workflow.id === id
                            ? {
                                ...workflow,
                                ...updates,
                                lastUpdated: new Date().toLocaleString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }),
                            }
                            : workflow
                    ),
                }));
            },

            deleteWorkflow: (id) => {
                set((state) => ({
                    workflows: state.workflows.filter((workflow) => workflow.id !== id),
                    runs: state.runs.filter((run) => run.workflowId !== id),
                }));
            },

            toggleWorkflow: (id) => {
                set((state) => ({
                    workflows: state.workflows.map((workflow) =>
                        workflow.id === id
                            ? { ...workflow, isActive: !workflow.isActive }
                            : workflow
                    ),
                }));
            },

            duplicateWorkflow: (id) => {
                const state = get();
                const original = state.workflows.find((workflow) => workflow.id === id);

                if (!original) return '';

                const newId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const now = new Date().toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                const duplicated: Workflow = {
                    ...original,
                    id: newId,
                    name: `${original.name} (Copy)`,
                    lastUpdated: now,
                    createdAt: now,
                };

                set((state) => ({
                    workflows: [...state.workflows, duplicated],
                }));

                return newId;
            },

            getWorkflowsByProject: (projectId) => {
                const state = get();
                return state.workflows.filter(
                    (workflow) => workflow.projectId === projectId
                );
            },

            getAllWorkflows: () => {
                return get().workflows;
            },

            getWorkflowById: (id) => {
                const state = get();
                return state.workflows.find((workflow) => workflow.id === id);
            },

            // Execution Logic
            runWorkflows: async (triggerType, payload) => {
                const { workflows, addRun } = get();
                const activeWorkflows = workflows.filter(w => w.isActive);

                for (const workflow of activeWorkflows) {
                    if (!workflow.workflowData) continue;

                    const triggerNode = workflow.workflowData.nodes.find(n => n.type === 'trigger');
                    if (!triggerNode) continue;

                    const nodeLabel = String(triggerNode.data.label || '').toUpperCase();
                    let shouldTrigger = false;

                    // Match trigger types
                    if (triggerType === 'TASK_CREATED' && nodeLabel.includes('CREATED')) shouldTrigger = true;
                    if (triggerType === 'STATUS_CHANGED' && nodeLabel.includes('STATUS')) {
                        // Check if specific status matches
                        const targetStatus = triggerNode.data.targetStatus;
                        if (!targetStatus || payload.status === targetStatus) {
                            shouldTrigger = true;
                        }
                    }
                    if (triggerType === 'PROJECT_CREATED' && nodeLabel.includes('PROJECT')) shouldTrigger = true;

                    // Project scoping
                    if (shouldTrigger && workflow.projectId && payload.projectId !== workflow.projectId) {
                        shouldTrigger = false;
                    }

                    if (shouldTrigger) {
                        console.log(`[Workflow] Triggering workflow: ${workflow.name}`);

                        // Add a run entry
                        addRun({
                            workflowId: workflow.id,
                            workflowName: workflow.name,
                            status: 'success',
                            timestamp: new Date().toLocaleString(),
                            description: `Triggered by ${triggerType}`,
                            triggerPayload: payload
                        });

                        // Plan for action execution:
                        // Find connected action nodes and execute them
                        // For this prototype, we'll just log the "execution"
                    }
                }
            },

            addRun: (run) => {
                const id = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                set((state) => ({
                    runs: [{ ...run, id }, ...state.runs].slice(0, 100) // Keep last 100 runs
                }));
            },

            getRunsByWorkflow: (workflowId) => {
                return get().runs.filter(r => r.workflowId === workflowId);
            },

            // Workflow Data Actions
            updateWorkflowData: (workflowId, workflowData) => {
                set((state) => ({
                    workflows: state.workflows.map((workflow) =>
                        workflow.id === workflowId
                            ? {
                                ...workflow,
                                workflowData,
                                lastUpdated: new Date().toLocaleString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }),
                            }
                            : workflow
                    ),
                }));
            },

            getWorkflowData: (workflowId) => {
                const state = get();
                const workflow = state.workflows.find((w) => w.id === workflowId);
                return workflow?.workflowData;
            },
        }),
        {
            name: 'workflow-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
