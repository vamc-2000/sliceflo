import { Node, Edge } from "@xyflow/react";

let nodeCounter = 0;
const getId = () => `restored_${Date.now()}_${nodeCounter++}`;

const ACTION_META: Record<string, { label: string; color: string }> = {
    CHANGE_STATUS:  { label: "Change Status",  color: "#0073EA" },
    UPDATE_FIELD:   { label: "Update Field",   color: "#0073EA" },
    ADD_COMMENT:    { label: "Add Comment",    color: "#00C875" },
    NOTIFY:         { label: "Notify Someone", color: "#FDAB3D" },
    CREATE_ITEM:    { label: "Create Task",    color: "#A25DDC" },
    IF_ELSE:        { label: "If / Else",      color: "#FF7575" },
};

const TRIGGER_META: Record<string, { label: string; color: string }> = {
    TASK_CREATED:     { label: "Task Created",     color: "#00CA72" },
    TASK_UPDATED:     { label: "Task Updated",     color: "#00CA72" },
    STATUS_CHANGED:   { label: "Status Changed",   color: "#00CA72" },
    PRIORITY_CHANGED: { label: "Priority Changed", color: "#00CA72" },
    ASSIGNEE_CHANGED: { label: "Assignee Changed", color: "#00CA72" },
    DUE_DATE_CHANGED: { label: "Due Date Changed", color: "#00CA72" },
    SUBTASK_CREATED:  { label: "Subtask Created",  color: "#00CA72" },
};

//  Standard edge style — matches your WorkflowBuilder edge style
const edgeStyle = {
    type: "straight" as const,
    animated: false,
    style: { stroke: "#E2E8F0", strokeWidth: 2, strokeDasharray: "4,4" },
};

export function buildNodesFromAutomation(
    trigger: string,
    actions: any[]
): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // ── Trigger node ──────────────────────────────────────
    const triggerId = "trigger_restored";
    const triggerMeta = TRIGGER_META[trigger] ?? { label: trigger, color: "#00CA72" };

    nodes.push({
        id: triggerId,
        type: "trigger",
        position: { x: 0, y: 0 },
        data: {
            label: triggerMeta.label,
            color: triggerMeta.color,
            triggerId: trigger,
            apiId: trigger,
            isPlaceholder: false,
            sequence: 1,
        },
    });

    // ── Recursively build action nodes ────────────────────
    function buildActions(
        actionList: any[],
        parentId: string,
        sourceHandle: string,  // "output" for trigger/action, "yes"/"no" for condition
        x: number,
        y: number
    ): number {
        if (!actionList?.length) return y;

        let currentY = y;
        let prevId = parentId;
        let prevHandle = sourceHandle;

        for (const action of actionList) {
            const nodeId = getId();
            const isCondition = action.type === "IF_ELSE";
            const meta = ACTION_META[action.type] ?? { label: action.type, color: "#0073EA" };

            if (isCondition) {
                // ── Condition node ────────────────────────
                nodes.push({
                    id: nodeId,
                    type: "condition",
                    position: { x, y: currentY },
                    data: {
                        label: meta.label,
                        color: meta.color,
                        apiId: action.type,
                        actionType: action.type,
                        conditionField: action.condition?.field ?? "status",
                        conditionOperator: action.condition?.operator ?? "EQUALS",
                        conditionValue: action.condition?.value ?? "",
                        conditionFrom: action.condition?.from ?? "",
                        conditionTo: action.condition?.to ?? "",
                        sequence: nodes.length + 1,
                    },
                });

          
             edges.push({
    id: `edge_${prevId}_to_${nodeId}`,
    source: prevId,
    target: nodeId,
    sourceHandle: prevHandle,
    targetHandle: "input",   //  "input"
    ...edgeStyle,
});

                const branchY = currentY + 180;

             
                const thenEndY = buildActions(
                    action.then ?? [],
                    nodeId,
                    "yes",          // ← matches ConditionNode yes handle
                    x - 200,
                    branchY
                );

                //  NO branch — right side
                const elseEndY = buildActions(
                    action.else ?? [],
                    nodeId,
                    "no",           // ← matches ConditionNode no handle
                    x + 200,
                    branchY
                );

                currentY = Math.max(thenEndY, elseEndY) + 80;
                prevId = nodeId;
                prevHandle = "output";

            } else {
                // ── Action node ───────────────────────────
                nodes.push({
                    id: nodeId,
                    type: "action",
                    position: { x, y: currentY },
                    data: {
                        label: meta.label,
                        color: meta.color,
                        apiId: action.type,
                        actionType: action.type,
                        value: action.value ?? "",
                        selectedField: action.condition?.field ?? "status",
                        sequence: nodes.length + 1,
                    },
                });

          edges.push({
    id: `edge_${prevId}_to_${nodeId}`,
    source: prevId,
    target: nodeId,
    sourceHandle: prevHandle,
    targetHandle: "input",   //  FIXED — was "target", now "input"
    ...edgeStyle,
});

                // recurse into then[] if nested
                if (action.then?.length > 0) {
                    currentY = buildActions(action.then, nodeId, "output", x, currentY + 160);
                } else {
                    currentY += 160;
                }

                prevId = nodeId;
                prevHandle = "output";
            }
        }

        return currentY;
    }

    buildActions(actions, triggerId, "output", 0, 160);

    return { nodes, edges };
}
