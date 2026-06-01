// ─────────────────────────────────────────────
// AUTOMATION STORE
// stores/automation-store.ts
// ─────────────────────────────────────────────

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import toast from "react-hot-toast";
import type {
    Automation,
    AutomationRun,
    Workflow,
    TriggerOption,
    ActionOption,
    ConditionOperator,
    ConditionType,
    CreateAutomationPayload,
} from "@/types/automation.types";
import {
    getAutomationsApi,
    createAutomationApi,
    updateAutomationApi,
    deleteAutomationApi,
    getTriggersApi,
    getActionsApi,
    getConditionsApi,
    getConditionTypesApi,
} from "@/lib/api/automations-api";

// ── Trigger Variables Mapping ────────────────
export const triggerVariables: Record<string, { label: string; value: string }[]> = {
    "TASK_CREATED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "Assignee", value: "{Assignee}" },
        { label: "Project Name", value: "{Project Name}" },
        { label: "Creator", value: "{Creator}" },
    ],
    "TASK_UPDATED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "Updated Field", value: "{Updated Field}" },
        { label: "Previous Value", value: "{Previous Value}" },
        { label: "New Value", value: "{New Value}" },
    ],
    "STATUS_CHANGED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "Old Status", value: "{Old Status}" },
        { label: "New Status", value: "{New Status}" },
        { label: "Assignee", value: "{Assignee}" },
    ],
    "STATUS_CHANGED_TO": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "New Status", value: "{New Status}" },
    ],
    "PRIORITY_CHANGED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "Old Priority", value: "{Old Priority}" },
        { label: "New Priority", value: "{New Priority}" },
    ],
    "DUE_DATE_CHANGED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "New Due Date", value: "{New Due Date}" },
    ],
    "ASSIGNEE_CHANGED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "Previous Assignee", value: "{Previous Assignee}" },
        { label: "New Assignee", value: "{New Assignee}" },
    ],
    "SUBTASK_CREATED": [
        { label: "Parent Task", value: "{Parent Task}" },
        { label: "Subtask Name", value: "{Subtask Name}" },
    ],
    "WATCHER_ADDED": [
        { label: "Task Name", value: "{Task Name}" },
        { label: "New Watcher", value: "{New Watcher}" },
    ],
};
interface AutomationState {
    // Data
    automations: Automation[];
    runs: AutomationRun[];
    isLoading: boolean;
    error: string | null;

    // API Metadata (fetched once, cached)
    triggerOptions: TriggerOption[];
    actionOptions: ActionOption[];
    conditionOperators: ConditionOperator[];
    conditionTypes: ConditionType[];

    // ── Automation Actions ───────────────────
    fetchAutomations: (projectId: string) => Promise<void>;
    fetchMetadata: () => Promise<void>;
    createAutomation: (projectId: string, data: Omit<Automation, "id" | "createdAt" | "updatedAt">) => Promise<string>;
    updateAutomation: (projectId: string, automationId: string, data: Partial<Automation>) => Promise<void>;
    toggleAutomation: (projectId: string, id: string) => Promise<void>;
    duplicateAutomation: (projectId: string, id: string) => Promise<void>;
    deleteAutomation: (projectId: string, id: string) => Promise<void>;
    getAutomationsByProject: (projectId: string) => Automation[];

    // ── Workflow (ReactFlow) ─────────────────
    updateWorkflow: (automationId: string, workflow: Workflow) => void;
    getWorkflow: (automationId: string) => Workflow | undefined;

    // ── Run History ──────────────────────────
    addRun: (run: Omit<AutomationRun, "id">) => void;
    getRunsByAutomation: (automationId: string) => AutomationRun[];
    deleteRun: (id: string) => void;

    // ── Payload Builder ──────────────────────
    buildApiPayload: (automation: Automation) => CreateAutomationPayload;
    convertWorkflowToData: (nodes: any[], edges: any[]) => {
        trigger: string;
        actions: any[];
        conditions: any[];
    };

    // ── Template Generators ──────────────────
    createFollowUpTemplate: (projectId: string) => Promise<string>;
    reset: () => void;
}

// ── Store Implementation ─────────────────────
export const useAutomationStore = create<AutomationState>()(
    persist(
        (set, get) => ({
            automations: [],
            runs: [],
            isLoading: false,
            error: null,
            triggerOptions: [],
            actionOptions: [],
            conditionOperators: [],
            conditionTypes: [],

            // ── Fetch automations for a project ──
            fetchAutomations: async (projectId: string) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await getAutomationsApi(projectId);
                    console.log('🔍 RAW API automation[0]:', JSON.stringify(data[0], null, 2));
                    set((state) => ({
                        automations: [
                            ...state.automations.filter(a => a.projectId !== projectId),
                            ...data.map((a: any) => ({
                                ...a,
                                projectId,
                                createdBy: a.createdBy || a.createdById || a.owner?.id || a.owner || a.userId || undefined,
                            })),
                        ],
                        isLoading: false,
                    }));
                } catch (error: any) {
                    set({ error: error.message ?? "Failed to fetch automations", isLoading: false });
                }
            },

            // ── Fetch triggers/actions/conditions once ──
            fetchMetadata: async () => {
                try {
                    const [triggers, actions, conditions, condTypes] = await Promise.all([
                        getTriggersApi(),
                        getActionsApi(),
                        getConditionsApi(),
                        getConditionTypesApi(),
                    ]);
                    set({
                        triggerOptions: triggers || [],
                        actionOptions: actions || [],
                        conditionOperators: conditions || [],
                        conditionTypes: condTypes || [],
                    });
                } catch (error: any) {
                    console.error("Failed to fetch automation metadata", error);
                    toast.error("Failed to load automation metadata");
                }
            },

            // ── Build clean API payload (shared) ──
            buildApiPayload: (automation: Automation): CreateAutomationPayload => {
                const sanitizeActions = (actions: any[]): any[] => {
                    return (actions || []).map(action => {
                        const clean: any = { type: action.type };

                        // Only include value if it's NOT an IF_ELSE branch
                        if (action.type !== 'IF_ELSE' && action.value !== undefined) {
                            clean.value = String(action.value).trim();
                        }

                        // Condition handling
                        if (action.condition) {
                            clean.condition = {
                                conditionType: (action.condition.conditionType || "FIELD_VALUE").trim(),
                                operator: (action.condition.operator || "EQUALS").trim(),
                                value: String(action.condition.value || "").trim(),
                                field: String(action.condition.field || "status").trim(),
                                from: String(action.condition.from || "").trim(),
                                to: String(action.condition.to || "").trim(),
                            };
                        }

                        if (action.type === 'IF_ELSE') {
                            clean.then = sanitizeActions(action.then || []);
                            clean.else = sanitizeActions(action.else || []);
                        } else if (action.then && action.then.length > 0) {
                            clean.then = sanitizeActions(action.then);
                        }

                        return clean;
                    });
                };

                return {
                    name: automation.name,
                    description: automation.description || "",
                    trigger: automation.trigger,
                    conditions: automation.conditions ?? [],
                    actions: sanitizeActions(automation.actions ?? []),
                    isActive: automation.isActive ?? true,
                };
            },

            // ── Convert ReactFlow graph to structured API data ──
            convertWorkflowToData: (nodes: any[], edges: any[]) => {
                console.log("CONVERTING WORKFLOW. Nodes:", nodes.length, "Edges:", edges.length);

                const triggerNode = nodes.find((n) => n.type === "trigger");
                if (!triggerNode) {
                    console.error("CONVERSION ERROR: No trigger node found!");
                    return { trigger: "TASK_CREATED", actions: [], conditions: [] };
                }

                const triggerId =
                    (triggerNode?.data?.triggerId as string) ||
                    (triggerNode?.data?.apiId as string) ||
                    "TASK_CREATED";

                const buildNodeActions = (nodeId: string, visited = new Set()): any[] => {
                    if (visited.has(nodeId)) return [];
                    visited.add(nodeId);

                    const node = nodes.find(n => n.id === nodeId);
                    if (!node) return [];

                    // If we hit a plus node, recurse through IT to find what's connected to it
                    if (node.type === "plus") {
                        const outgoing = edges.filter(e => e.source === nodeId);
                        return outgoing.flatMap(e => buildNodeActions(e.target, visited));
                    }

                    const branchAction = get().actionOptions.find(a => a.hasBranch);
                    const officialBranchId = branchAction?.id || "IF_ELSE";

                    const action: any = {
                        type: (node.data?.actionType as string) || (node.data?.apiId as string) || "UNKNOWN",
                    };

                    if (node.type === "condition") {
                        action.type = node.data?.apiId as string === "IF_ELSE" ? officialBranchId : node.data?.apiId as string;
                        const conditionType = (node.data?.apiId as string) || "FIELD_VALUE";
                        action.condition = {
                            conditionType: conditionType === "IF_ELSE" ? "FIELD_VALUE" : conditionType,
                            operator: (node.data?.conditionOperator as string || "EQUALS").toUpperCase(),
                            value: String(node.data?.conditionValue ?? ""),         // ✅ safe fallback
                            field: String(node.data?.conditionField ?? node.data?.field ?? "status"), // ✅ fixed order
                            from: String(node.data?.conditionFrom ?? ""),
                            to: String(node.data?.conditionTo ?? ""),
                        };
                        const yesEdges = edges.filter(e => e.source === node.id && e.sourceHandle === "yes");
                        const noEdges = edges.filter(e => e.source === node.id && e.sourceHandle === "no");
                        action.then = yesEdges.flatMap(e => buildNodeActions(e.target, visited));
                        action.else = noEdges.flatMap(e => buildNodeActions(e.target, visited));
                    } else if (node.type === "action") {
                        action.value = String(node.data?.value ?? "");

                        // ✅ ADD THIS BLOCK — send field info for actions like CHANGE_STATUS, UPDATE_FIELD
                        action.condition = {
                            field: String(node.data?.selectedField ?? "status"),
                            operator: "EQUALS",
                            conditionType: "FIELD_VALUE",
                            value: String(node.data?.value ?? ""),
                            from: "",
                            to: "",
                        };

                        const nextEdges = edges.filter(e => e.source === node.id);
                        action.then = nextEdges.flatMap(e => buildNodeActions(e.target, visited));
                    }

                    return action;


                    return [action];
                };

                const triggerOutgoing = edges.filter(e => e.source === triggerNode.id);
                const actions = triggerOutgoing.flatMap(e => buildNodeActions(e.target));

                console.log("CONVERSION RESULT - Actions found:", actions.length);
                return {
                    trigger: triggerId,
                    actions: actions,
                    conditions: [],
                };
            },

            // // ── Create automation via API ──
            // createAutomation: async (projectId: string, automationData) => {
            //     set({ isLoading: true });
            //     try {
            //         const payload = get().buildApiPayload({ ...automationData, projectId });
            //         const response = await createAutomationApi(projectId, payload);
            //         const newAutomation: Automation = {
            //             ...automationData,
            //             ...response,
            //             projectId,
            //         };
            //         set((state) => ({
            //             automations: [...state.automations, newAutomation],
            //             isLoading: false,
            //         }));
            //         toast.success("Automation created successfully!");
            //         return response.id!;
            //     } catch (error: any) {
            //         set({ isLoading: false });
            //         toast.error(error.response?.data?.message ?? "Failed to create automation");
            //         throw error;
            //     }
            // },
            createAutomation: async (projectId: string, automationData: any) => {
                if (!projectId || projectId === "none" || projectId === "default-project") {
                    const errorMsg = `Invalid Project ID: "${projectId}". Please ensure this workflow is assigned to a valid project.`;
                    toast.error(errorMsg);
                    throw new Error(errorMsg);
                }

                set({ isLoading: true });
                try {
                    const payload = get().buildApiPayload(automationData);
                    console.warn("API CALL: createAutomation", payload);

                    // LOUD DEBUGGING
                    if (typeof window !== 'undefined') {
                        (window as any).LAST_PAYLOAD = payload;
                    }

                    const response = await createAutomationApi(projectId, payload);
                    console.log("CREATE SUCCESS:", response);

                    const newAutomation = {
                        ...automationData,
                        ...response,
                        projectId,
                        workflow: automationData.workflow, // Local UI only
                    };

                    set((state) => ({
                        automations: [...state.automations, newAutomation],
                        isLoading: false,
                    }));

                    return response.id ?? "";

                } catch (error: any) {
                    set({ isLoading: false });
                    const errorDetails = error.response?.data;
                    console.error("CREATE FAILED:", errorDetails);

                    // Aggressive notification
                    if (typeof window !== 'undefined') {
                        alert("SAVE FAILED!\n\nReason: " + JSON.stringify(errorDetails || error.message));
                    }

                    const apiMessage = errorDetails?.message || errorDetails?.error;
                    toast.error(apiMessage || "Failed to create automation");
                    throw error;
                }
            },


            // ── Update automation via API ──
            updateAutomation: async (projectId: string, automationId: string, automationData: Partial<Automation>) => {
                if (!projectId || projectId === "none" || projectId === "default-project") {
                    const errorMsg = `Invalid Project ID for update: "${projectId}".`;
                    toast.error(errorMsg);
                    throw new Error(errorMsg);
                }

                set({ isLoading: true });
                try {
                    const payload = get().buildApiPayload({ ...automationData } as Automation);
                    console.log("SENDING UPDATE PAYLOAD:", JSON.stringify(payload, null, 2));

                    const response = await updateAutomationApi(projectId, automationId, payload);
                    console.log("UPDATE SUCCESS:", response);

                    set((state) => ({
                        automations: state.automations.map((a) =>
                            a.id === automationId
                                ? { ...a, ...response, workflow: automationData.workflow || a.workflow }
                                : a
                        ),
                        isLoading: false,
                    }));
                } catch (error: any) {
                    set({ isLoading: false });
                    console.error("UPDATE FAILED. Status:", error.response?.status);
                    console.error("ERROR DATA:", JSON.stringify(error.response?.data, null, 2));

                    toast.error(error.response?.data?.message || "Failed to update automation");
                    throw error;
                }
            },

            // ── Toggle active/inactive ──
            toggleAutomation: async (projectId: string, id: string) => {
                const automation = get().automations.find(a => a.id === id);
                if (!automation) return;

                const newStatus = !automation.isActive;
                try {
                    await updateAutomationApi(projectId, id, { isActive: newStatus });
                    set((state) => ({
                        automations: state.automations.map((a) =>
                            a.id === id ? { ...a, isActive: newStatus } : a
                        ),
                    }));
                    toast.success(`Automation ${newStatus ? 'enabled' : 'disabled'}`);
                } catch (error: any) {
                    toast.error("Failed to toggle automation status");
                }
            },

            // ── Duplicate automation ──
            duplicateAutomation: async (projectId: string, id: string) => {
                const automation = get().automations.find(a => a.id === id);
                if (!automation) return;

                const duplicatedData = {
                    ...automation,
                    name: `${automation.name} (Copy)`,
                    isActive: false,
                };

                // id, createdAt, updatedAt are stripped or handled by the API
                set({ isLoading: true });
                try {
                    const payload = get().buildApiPayload(duplicatedData);
                    const response = await createAutomationApi(projectId, payload);

                    const newAutomation = {
                        ...duplicatedData,
                        ...response,
                        projectId,
                    };

                    set((state) => ({
                        automations: [...state.automations, newAutomation],
                        isLoading: false,
                    }));
                    toast.success("Automation duplicated!");
                } catch (error: any) {
                    set({ isLoading: false });
                    toast.error("Failed to duplicate automation");
                }
            },

            // ── Delete automation via API ──
            deleteAutomation: async (projectId: string, id: string) => {
                try {
                    await deleteAutomationApi(projectId, id);
                    set((state) => ({
                        automations: state.automations.filter((a) => a.id !== id),
                        runs: state.runs.filter((r) => r.automationId !== id),
                    }));
                    toast.success("Automation deleted successfully!");
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to delete automation");
                }
            },

            // ── Get automations by project ──
            getAutomationsByProject: (projectId: string) =>
                get().automations.filter((a) => a.projectId === projectId),

            // ── Update ReactFlow workflow on automation ──
            updateWorkflow: (automationId: string, workflow: Workflow) =>
                set((state) => ({
                    automations: state.automations.map((a) =>
                        a.id === automationId
                            ? { ...a, workflow, lastUpdated: new Date().toISOString() }
                            : a
                    ),
                })),

            // ── Get ReactFlow workflow for automation ──
            getWorkflow: (automationId: string) =>
                get().automations.find((a) => a.id === automationId)?.workflow,

            // ── Run history ──
            addRun: (run) => {
                const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                set((state) => ({
                    runs: [{ ...run, id }, ...state.runs],
                }));
            },

            getRunsByAutomation: (automationId: string) =>
                get().runs.filter((r) => r.automationId === automationId),

            deleteRun: (id: string) =>
                set((state) => ({
                    runs: state.runs.filter((r) => r.id !== id),
                })),

            // ── Generated Templates ────────────────
            createFollowUpTemplate: async (projectId: string) => {
                const templateData: Omit<Automation, "id" | "createdAt" | "updatedAt"> = {
                    name: "Follow-up Review Generator",
                    description: "When a task is marked as Done, add a completion comment and create a follow-up review task.",
                    trigger: "TASK_UPDATED",
                    isActive: true,
                    conditions: [],
                    actions: [
                        {
                            type: "IF_ELSE",
                            condition: {
                                field: "status",
                                operator: "EQUALS",
                                conditionType: "FIELD_VALUE",
                                value: "Done",
                                from: "",
                                to: ""
                            },
                            then: [
                                {
                                    type: "ADD_COMMENT",
                                    value: "Task completed successfully. A follow-up task has been created.",
                                },
                                {
                                    type: "CREATE_ITEM",
                                    value: "Follow-up Review Task",
                                },
                            ],
                            else: [],
                        },
                    ],
                };

                return await get().createAutomation(projectId, templateData);
            },

            reset: () => {
                localStorage.removeItem('automation-storage');
            },
        }),
        {
            name: "automation-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                automations: state.automations,
                runs: state.runs,
                // metadata is re-fetched from API, no need to persist
            }),
        }
    )
);
