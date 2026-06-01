// ─────────────────────────────────────────────
// AUTOMATION TYPES
// types/automation.types.ts
// ─────────────────────────────────────────────

// ── API Metadata Types ──────────────────────
export interface TriggerOption {
  id: string;
  label: string;
  category: string;
}

export interface ActionOption {
  id: string;
  label: string;
  hasValue: boolean;
  hasBranch?: boolean;
}

export interface ConditionOperator {
  id: string;
  label: string;
  needsValue: boolean;
  needsFromTo?: boolean;
 needsField?: boolean; 
}

export interface ConditionType {
  id: string;
  label: string;
  needsValue: boolean;
  needsField?: boolean;
}

// ── Automation Body Types ───────────────────
export interface AutomationCondition {
  field: string;
  operator: string;
  conditionType: string;
  value: string;
  from: string;
  to: string;
}

export interface AutomationAction {
  type: string; // e.g. "CHANGE_STATUS", "NOTIFY_ASSIGNEE", "SEND_EMAIL", "IF_ELSE"
  value?: string;
  condition?: AutomationCondition | null;
  then?: AutomationAction[];
  else?: AutomationAction[];
}

export interface Automation {
  id?: string;
  name: string;
  description: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  projectId?: string;
  project?: string; // Project name for display
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
  lastExecutionStatus?: string | null;
  recentFailures?: any[];
  createdBy?: any;
  actionsCount?: number;
  successRate?: number;
  // UI-only fields (not sent to API)
  owner?: { name: string; avatar: string };
  workflow?: Workflow;
}

export type CreateAutomationPayload = {
  name: string;
  description: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
};

// ── ReactFlow Workflow Types ────────────────
export interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    description?: string;
    icon?: string;
    color?: string;
    actionType?: string; // API id e.g. "CHANGE_STATUS"
    value?: string;
    condition?: AutomationCondition;
    sequence?: number;
    onAdd?: (template: any) => void;
    [key: string]: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  style?: any;
  markerEnd?: any;
}

export interface Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

// ── Run History ─────────────────────────────
export interface AutomationRun {
  id: string;
  automationId: string;
  automationName: string;
  status: "success" | "failed" | "running";
  timestamp: string;
  description: string;
  executionTime?: string;
}
