"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    addEdge,
    useNodesState,
    useEdgesState,
    MarkerType,
    ReactFlowProvider,
    Panel,
    type Node,
    type Edge,
    type Connection,
    type NodeTypes,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import PlusNode from './nodes/PlusNode';
import AddNodeMenu, { type NodeTemplate } from './AddNodeMenu';
import NodePanel from './NodePanel';
import LibrarySidebar from './LibrarySidebar';
import InitialTriggerMenu from './InitialTriggerMenu';
import {
    Zap, Maximize2, Trash2, X, Settings, Plus, Edit3, RefreshCw,
    AlertTriangle, Calendar, UserPlus, ListPlus, Eye, CheckCircle2, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutomationStore } from "@/stores/automation-store";
import toast from "react-hot-toast";
import VariablePicker from "./VariablePicker";
import { SYSTEM_FIELDS } from "@/stores/tasks-store";
import { useProjectsStore } from "@/stores/projects-store";
import { TriggerConfig } from './config/TriggerConfig';
// import { ActionConfig } from './config/ActionConfig';
// import { ConditionConfig } from './config/ConditionConfig';
// import { ActionConfig } from './config/ActionConfig';

// ─── Node type registry ───────────────────────────────────────────────────────
const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    plus: PlusNode,
};

interface WorkflowBuilderProps {
    automationId?: string;
    projectId?: string;
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onWorkflowChange?: (nodes: Node[], edges: Edge[]) => void;
    readOnly?: boolean;
}

let nodeIdCounter = 0;
const getNodeId = () => `node_${Date.now()}_${nodeIdCounter++}`;

// ─── Inner component (needs ReactFlowProvider wrapper) ────────────────────────
const WorkflowBuilderInner = ({
    automationId = "",
    projectId = "",
    initialNodes = [],
    initialEdges = [],
    onWorkflowChange,
    readOnly = false,
}: WorkflowBuilderProps & { automationId?: string; projectId?: string }) => {

    const triggerOptions = useAutomationStore((s) => s.triggerOptions);
    const actionOptions = useAutomationStore((s) => s.actionOptions);
    const fetchMetadata = useAutomationStore((s) => s.fetchMetadata);
    const createAutomation = useAutomationStore((s) => s.createAutomation);
    const updateAutomation = useAutomationStore((s) => s.updateAutomation);

    // ── State ──────────────────────────────────────────────────────────────────
    const [automationName, setAutomationName] = useState("New Automation");
    const [configValue, setConfigValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const getTaskCustomFields = useProjectsStore(s => s.getTaskCustomFields);
    const customFields = getTaskCustomFields(projectId ?? "");
    const allTaskFields = [
        ...SYSTEM_FIELDS.map(f => ({ value: f.id, label: f.name, type: f.type })),
        ...customFields.map(f => ({
            value: f.id,
            label: f.name,
            type: f.type,
            options: f.options?.map(o =>
                typeof o === "string"
                    ? { label: o, value: o }
                    : { label: o.value, value: o.value } // handle { value, color } shape
            ) ?? [],
        })),
    ];
    const project = useProjectsStore(s => s.projects.find(p => p.id === projectId));

    // Fetch metadata on mount
    useEffect(() => {
        if (!triggerOptions?.length || !actionOptions?.length) fetchMetadata();
    }, []);

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const { fitView } = useReactFlow();

    // Config panel
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [configNode, setConfigNode] = useState<Node | null>(null);

    // Library sidebar
    const [isLibrarySidebarOpen, setIsLibrarySidebarOpen] = useState(false);
    const [nodeToUpdateTrigger, setNodeToUpdateTrigger] = useState<string | null>(null);
    const [libraryTypeFilter, setLibraryTypeFilter] = useState<'all' | 'trigger' | 'action' | 'condition' | 'delay' | 'wait'>('all');
    const [plusNodeContext, setPlusNodeContext] = useState<{ id: string; handle?: string } | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    // ── Sync config panel value back into node data ────────────────────────────
    useEffect(() => {
        if (configNode && isConfigOpen) {
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === configNode.id
                        ? { ...node, data: { ...node.data, value: configValue } }
                        : node
                )
            );
        }
    }, [configValue, configNode?.id, isConfigOpen, setNodes]);

    // ── Prevent infinite parent-sync loops ────────────────────────────────────
    const lastSentRef = useRef("");
    const lastReceivedRef = useRef("");

    useEffect(() => {
        const currentState = JSON.stringify({ nodes, edges });
        if (
            onWorkflowChange &&
            currentState !== lastSentRef.current &&
            currentState !== lastReceivedRef.current
        ) {
            lastSentRef.current = currentState;
            onWorkflowChange(nodes, edges);
        }
    }, [nodes, edges, onWorkflowChange]);

    // ── Node / edge change handlers ────────────────────────────────────────────
    const handleNodesChange = useCallback((changes: any) => onNodesChange(changes), [onNodesChange]);
    const handleEdgesChange = useCallback((changes: any) => onEdgesChange(changes), [onEdgesChange]);

    // ── Open library sidebar ───────────────────────────────────────────────────
    const handleOpenLibraryContext = useCallback((
        type: 'trigger' | 'action' | 'condition' | 'delay' | 'wait',
        plusNodeId?: string,
        sourceHandle?: string
    ) => {
        setLibraryTypeFilter(type);
        setPlusNodeContext(plusNodeId ? { id: plusNodeId, handle: sourceHandle } : null);
        setIsLibrarySidebarOpen(true);
        setIsConfigOpen(false);
    }, []);
    const getOptionsForField = (fieldValue: string) => {
        switch (fieldValue) {
            case "status":
                return (project?.taskStatusConfig ?? []).map(s => ({
                    label: s.label,
                    value: s.value,
                }));
            case "priority":
                return (project?.taskPriorityConfig ?? []).map(p => ({
                    label: p.label,
                    value: p.value,
                }));
            case "taskType":
                return (project?.taskTypeConfig ?? []).map(t => ({
                    label: t.label,
                    value: t.value,
                }));
            default:
                const customField = customFields.find(f => f.id === fieldValue);
                return customField?.options?.map(o =>
                    typeof o === "string"
                        ? { label: o, value: o }
                        : { label: o.value, value: o.value } // ✅ unwrap object option
                ) ?? [];
        }
    };
    // Edges style — changes when running
    const animatedEdges = edges.map(edge => ({
        ...edge,
        animated: isRunning,
        style: {
            stroke: isRunning ? "#0073EA" : "#E2E8F0",
            strokeWidth: isRunning ? 2.5 : 2,
            strokeDasharray: isRunning ? undefined : "4,4",
        },
    }));



    // ── Add a new node ─────────────────────────────────────────────────────────
    const handleAddNode = useCallback((
        template: NodeTemplate,
        plusNodeId?: string,
        sourceHandle?: string,
        customPosition?: { x: number; y: number }
    ) => {
        setIsLibrarySidebarOpen(false);
        const newNodeId = getNodeId();
        const timestamp = Date.now();

        setNodes((currentNodes) => {
            const plusNode = currentNodes.find(n => n.id === plusNodeId);
            const position = customPosition || (plusNode ? plusNode.position : { x: 0, y: 0 });

            const newNode: Node = {
                id: newNodeId,
                type: template.type,
                position: { x: position.x, y: position.y },
                data: {
                    label: template.label,
                    description: template.description,
                    color: template.color,
                    apiId: template.apiId,
                    actionType: template.apiId,
                    triggerId: template.type === 'trigger' ? template.apiId : undefined,
                    actionId: template.type === "action" ? template.apiId : undefined,  // 
                    sequence: currentNodes.filter(n => (n.type as string) !== 'plus').length + 1,
                    onConfigClick: (node: any) => {
                        const noConfigTriggers = ["TASK_CREATED", "SUBTASK_CREATED", "WATCHER_ADDED"];
                        if (node.type === "trigger" && noConfigTriggers.includes(node.data?.triggerId)) {
                            return;
                        }
                        setConfigNode(node);
                        setConfigValue(node.data?.value || "");
                        setIsConfigOpen(true);
                        setIsLibrarySidebarOpen(false);
                    },
                    onChangeTriggerType: () => {
                        setNodeToUpdateTrigger(newNodeId);
                        setLibraryTypeFilter('trigger');
                        setIsLibrarySidebarOpen(true);
                        setIsConfigOpen(false);
                    },
                },
            };

            // setTimeout(() => {
            //     setConfigNode(newNode);
            //     setConfigValue("");
            //     setIsConfigOpen(true);
            // }, 50);
            setTimeout(() => {
                const noConfigTriggers = ["TASK_CREATED", "SUBTASK_CREATED", "WATCHER_ADDED"];
                if (template.type === "trigger" && noConfigTriggers.includes(template.apiId ?? "")) {
                    return; // ❌ Don't open config for these triggers
                }
                setConfigNode(newNode);
                setConfigValue('');
                setIsConfigOpen(true);
            }, 50);

            let nextNodes = plusNodeId
                ? currentNodes.filter(n => n.id !== plusNodeId)
                : [...currentNodes];
            nextNodes.push(newNode);

            if (template.type === 'condition') {
                const yesPlusId = `plus_${newNodeId}_yes_${timestamp}`;
                const noPlusId = `plus_${newNodeId}_no_${timestamp}`;
                nextNodes.push({
                    id: yesPlusId, type: 'plus',
                    position: { x: position.x - 150, y: position.y + 160 },
                    data: {
                        parentId: newNodeId, sourceHandle: 'yes',
                        onAdd: (t: NodeTemplate, pid: string, sh?: string) => handleAddNode(t, pid, sh),
                        onOpenLibrary: (type: any, pid: string, sh?: string) => handleOpenLibraryContext(type, pid, sh),
                    },
                });
                nextNodes.push({
                    id: noPlusId, type: 'plus',
                    position: { x: position.x + 150, y: position.y + 160 },
                    data: {
                        parentId: newNodeId, sourceHandle: 'no',
                        onAdd: (t: NodeTemplate, pid: string, sh?: string) => handleAddNode(t, pid, sh),
                        onOpenLibrary: (type: any, pid: string, sh?: string) => handleOpenLibraryContext(type, pid, sh),
                    },
                });
            } else if ((template.type as string) !== 'plus') {
                const nextPlusId = `plus_${newNodeId}_${timestamp}`;
                nextNodes.push({
                    id: nextPlusId, type: 'plus',
                    position: { x: position.x, y: position.y + 120 },
                    data: {
                        parentId: newNodeId, sourceHandle: 'output',
                        onAdd: (t: NodeTemplate, pid: string, sh?: string) => handleAddNode(t, pid, sh),
                        onOpenLibrary: (type: any, pid: string, sh?: string) => handleOpenLibraryContext(type, pid, sh),
                    },
                });
            }

            if (currentNodes.length === 0) {
                setTimeout(() => fitView({ duration: 600, padding: 0.2 }), 100);
            }
            return nextNodes;
        });

        setEdges((currentEdges) => {
            const ts = Date.now();
            let nextEdges = [...currentEdges];

            if (plusNodeId) {
                nextEdges = nextEdges.map(e =>
                    e.target === plusNodeId ? { ...e, target: newNodeId, targetHandle: 'input' } : e
                );
            }

            if (template.type === 'condition') {
                nextEdges.push({
                    id: `edge_${newNodeId}_yes_${ts}`, source: newNodeId, target: `plus_${newNodeId}_yes_${timestamp}`,
                    sourceHandle: 'yes', targetHandle: 'target', type: 'straight', animated: false,
                    style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
                });
                nextEdges.push({
                    id: `edge_${newNodeId}_no_${ts}`, source: newNodeId, target: `plus_${newNodeId}_no_${timestamp}`,
                    sourceHandle: 'no', targetHandle: 'target', type: 'straight', animated: false,
                    style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
                });
            } else if ((template.type as string) !== 'plus') {
                nextEdges.push({
                    id: `edge_${newNodeId}_plus_${ts}`, source: newNodeId, target: `plus_${newNodeId}_${timestamp}`,
                    sourceHandle: 'output', targetHandle: 'target', type: 'straight', animated: false,
                    style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
                });
            }
            return nextEdges;
        });
    }, [handleOpenLibraryContext, fitView]);

    // ── Top-down sync (parent → this component) ────────────────────────────────
    useEffect(() => {
        const incomingState = JSON.stringify({ nodes: initialNodes, edges: initialEdges });
        if (incomingState !== lastReceivedRef.current && incomingState !== lastSentRef.current) {
            lastReceivedRef.current = incomingState;
            if (initialNodes && initialNodes.length > 0) {
                const nodesWithCallbacks = initialNodes.map(node => {
                    if (node.type === 'plus') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                onAdd: (t: NodeTemplate) => handleAddNode(t, node.id, node.data?.sourceHandle as string),
                                onOpenLibrary: (type: 'action' | 'condition' | 'delay' | 'wait') =>
                                    handleOpenLibraryContext(type, node.id, node.data?.sourceHandle as string),
                            },
                        };
                    }
                    if (node.type === 'trigger') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                onConfigClick: (n: any) => {
                                    const noConfigTriggers = ["TASK_CREATED", "SUBTASK_CREATED", "WATCHER_ADDED"];
                                    if (n.type === "trigger" && noConfigTriggers.includes(n.data?.triggerId)) {
                                        return;
                                    }
                                    setConfigNode(n);
                                    setConfigValue(n.data?.value || "");
                                    setIsConfigOpen(true);
                                    setIsLibrarySidebarOpen(false);
                                },
                                onChangeTriggerType: () => {
                                    setNodeToUpdateTrigger(node.id);
                                    setLibraryTypeFilter('trigger');
                                    setIsLibrarySidebarOpen(true); setIsConfigOpen(false);
                                },
                            },
                        };
                    }
                    if (node.type === 'action' || node.type === 'condition') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                onConfigClick: (n: any) => {
                                    setConfigNode(n);
                                    setConfigValue(n.data?.value || "");
                                    setIsConfigOpen(true);
                                    setIsLibrarySidebarOpen(false);
                                },
                            },
                        };
                    }
                    return node;
                });
                setNodes(nodesWithCallbacks);
            }
            if (initialEdges) setEdges(initialEdges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges, handleAddNode]);

    const handleTriggerSelect = useCallback((template: NodeTemplate, triggerNodeId: string) => {
        const plusId = `plus_${triggerNodeId}_${Date.now()}`;

        setNodes((nds) => {
            const updated = nds.map((n) =>
                n.id === triggerNodeId
                    ? {
                        ...n,
                        data: {
                            ...n.data,
                            label: template.label,
                            description: template.description,
                            color: template.color,
                            apiId: template.apiId,
                            triggerId: template.apiId,
                            isPlaceholder: false,
                            onConfigClick: (node: any) => {
                                const noConfigTriggers = ["TASK_CREATED", "SUBTASK_CREATED", "WATCHER_ADDED"];
                                if (node.type === "trigger" && noConfigTriggers.includes(node.data?.triggerId)) {
                                    return;
                                }
                                setConfigNode(node);
                                setConfigValue(node.data?.value || "");
                                setIsConfigOpen(true);
                                setIsLibrarySidebarOpen(false);
                            },
                            onChangeTriggerType: () => {
                                setNodeToUpdateTrigger(triggerNodeId);
                                setLibraryTypeFilter('trigger');
                                setIsLibrarySidebarOpen(true);
                                setIsConfigOpen(false);
                            },
                        },
                    }
                    : n
            );

            // Add plus node below
            const plusNode: Node = {
                id: plusId,
                type: 'plus',
                position: { x: 0, y: 120 }, // Center-aligned for 220px width nodes
                data: {
                    parentId: triggerNodeId,
                    sourceHandle: 'output',
                    onAdd: (t: NodeTemplate, pid: string, sh?: string) => handleAddNode(t, pid, sh),
                    onOpenLibrary: (type: any, pid: string, sh?: string) => handleOpenLibraryContext(type, pid, sh),
                },
            };
            return [...updated, plusNode];
        });

        // Add edge from trigger → plus
        setEdges((eds) => [
            ...eds,
            {
                id: `edge_${triggerNodeId}_${plusId}`,
                source: triggerNodeId,
                target: plusId,
                sourceHandle: 'output',
                targetHandle: 'target',
                type: 'straight',
                animated: false,
                style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
            },
        ]);
        setIsLibrarySidebarOpen(false);
        setIsConfigOpen(false);

        const noConfigTriggers = ['TASK_CREATED', 'SUBTASK_CREATED', 'WATCHER_ADDED'];
        if (!noConfigTriggers.includes(template.apiId ?? '')) {
            setTimeout(() => {
                setConfigNode({ id: triggerNodeId, type: 'trigger', position: { x: 0, y: 0 }, data: { triggerId: template.apiId, label: template.label, color: template.color } } as any);
                setConfigValue('');
                setIsConfigOpen(true);
            }, 100);
        }

        setTimeout(() => fitView({ duration: 600, padding: 0.2 }), 100);
    }, [setNodes, setEdges, handleAddNode, handleOpenLibraryContext, fitView]);

    useEffect(() => {
        if ((initialNodes ?? []).filter(n => n.type !== 'plus').length === 0 && !readOnly) {
            const placeholderNodeId = getNodeId();

            const placeholderNode: Node = {
                id: placeholderNodeId,
                type: 'trigger',
                position: { x: 0, y: 0 },
                data: {
                    label: 'Choose a trigger',
                    isPlaceholder: true,
                    color: '#00CA72',
                    sequence: 1,
                    onTriggerSelect: (template: NodeTemplate) => handleTriggerSelect(template, placeholderNodeId),
                    onChangeTriggerType: () => {
                        setNodeToUpdateTrigger(placeholderNodeId);
                        setLibraryTypeFilter('trigger');
                        setIsLibrarySidebarOpen(true);
                        setIsConfigOpen(false);
                    },
                },
            };

            setNodes([placeholderNode]);
            setTimeout(() => fitView({ duration: 600, padding: 0.2 }), 200);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const spawnPlaceholderTrigger = useCallback(() => {
        const placeholderNodeId = getNodeId();
        const placeholderNode: Node = {
            id: placeholderNodeId,
            type: 'trigger',
            position: { x: 0, y: 0 },
            data: {
                label: 'Choose a trigger',
                isPlaceholder: true,
                color: '#00CA72',
                sequence: 1,
                onTriggerSelect: (template: NodeTemplate) => handleTriggerSelect(template, placeholderNodeId),
                onChangeTriggerType: () => {
                    // setNodeToUpdateTrigger(placeholderNodeId);
                    setLibraryTypeFilter('trigger');
                    setIsLibrarySidebarOpen(true);
                    setIsConfigOpen(false);
                },
            },
        };
        setNodes([placeholderNode]);
        setEdges([]);
        setTimeout(() => fitView({ duration: 600, padding: 0.2 }), 200);
    }, [handleTriggerSelect, fitView, setNodes, setEdges]);

    // ✅ NEW: Watch nodes — if canvas empties, restore placeholder
    useEffect(() => {
        if (!readOnly && nodes.length === 0) {
            spawnPlaceholderTrigger();
        }
    }, [nodes.length, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const handler = () => {
            setIsRunning(true);
            setTimeout(() => setIsRunning(false), 3000);
        };

        window.addEventListener("automation:running", handler);
        return () => window.removeEventListener("automation:running", handler);
    }, []);

    // ── Library sidebar select handler ─────────────────────────────────────────
    const handleLibrarySelect = useCallback((template: NodeTemplate) => {
        if (template.type === 'trigger') {
            if (nodeToUpdateTrigger) {
                // Update existing trigger node
                setNodes((nds) =>
                    nds.map((node) =>
                        node.id === nodeToUpdateTrigger
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    label: template.label,
                                    description: template.description,
                                    color: template.color,
                                    apiId: template.apiId,
                                    triggerId: template.apiId,
                                    isPlaceholder: false,
                                },
                            }
                            : node
                    )
                );
                setNodeToUpdateTrigger(null);
                // ✅ CLOSE sidebar first
                setIsLibrarySidebarOpen(false);
                const noConfigTriggers = ['TASK_CREATED', 'SUBTASK_CREATED', 'WATCHER_ADDED'];
                if (noConfigTriggers.includes(template.apiId ?? '')) {
                    setIsConfigOpen(false); // force close config for no-config triggers
                }
            } else {
                handleAddNode(template, undefined, undefined, { x: 0, y: 0 });
                setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 200);
            }
        } else if (plusNodeContext) {
            handleAddNode(template, plusNodeContext.id, plusNodeContext.handle);
            setPlusNodeContext(null);
        }
        setIsLibrarySidebarOpen(false);
    }, [nodeToUpdateTrigger, plusNodeContext, handleAddNode, setNodes, fitView]);

    // ── Connect handler ────────────────────────────────────────────────────────
    const onConnect = useCallback((connection: Connection) => {
        const edge = {
            ...connection,
            type: 'straight',
            animated: false,
            style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
        };
        setEdges((eds) => addEdge(edge, eds));
    }, [setEdges]);

    const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
        setSelectedNodes(nodes.map(n => n.id));
    }, []);

    // const deleteSelectedNodes = useCallback(() => {
    //     if (selectedNodes.length === 0) return;
    //     setNodes((nds) => nds.filter(node => !selectedNodes.includes(node.id)));
    //     setEdges((eds) => eds.filter(
    //         edge => !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
    //     ));
    //     setSelectedNodes([]);
    // }, [selectedNodes]);

    const deleteSelectedNodes = useCallback(() => {
        if (selectedNodes.length === 0) return;

        const idsToDelete = new Set(selectedNodes);
        const parentsToReplenish: Array<{ parentId: string, handle: string, position: { x: number, y: number } }> = [];

        // 1. Identify parents that will lose a child and need a PlusNode
        edges.forEach(edge => {
            if (idsToDelete.has(edge.target) && !idsToDelete.has(edge.source)) {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);

                if (sourceNode && sourceNode.type !== 'plus') {
                    parentsToReplenish.push({
                        parentId: edge.source,
                        handle: edge.sourceHandle || 'output',
                        position: targetNode ? targetNode.position : { x: sourceNode.position.x, y: sourceNode.position.y + 120 }
                    });
                }
            }
        });

        // 2. Identify 'plus' nodes that are children of deleted nodes (to avoid orphans)
        nodes.forEach(node => {
            if (node.type === 'plus' && idsToDelete.has(node.data?.parentId as string)) {
                idsToDelete.add(node.id);
            }
        });

        // 3. Generate Replenishment Nodes and Edges properly with generated IDs
        const replenishedNodes: any[] = [];
        const replenishedEdges: any[] = [];

        parentsToReplenish.forEach(p => {
            const newPlusId = `plus_${p.parentId}_${p.handle}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            replenishedNodes.push({
                id: newPlusId,
                type: 'plus',
                position: p.position,
                data: {
                    parentId: p.parentId,
                    sourceHandle: p.handle,
                    onAdd: (t: NodeTemplate, pid: string, sh?: string) => handleAddNode(t, pid, sh),
                    onOpenLibrary: (type: any, pid: string, sh?: string) => handleOpenLibraryContext(type, pid, sh),
                }
            });
            replenishedEdges.push({
                id: `edge_${p.parentId}_${newPlusId}`,
                source: p.parentId,
                target: newPlusId,
                sourceHandle: p.handle,
                targetHandle: 'target',
                type: 'straight',
                animated: false,
                style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
            });
        });

        // 4. Apply state updates
        setNodes((nds) => {
            const filtered = nds.filter(n => !idsToDelete.has(n.id));
            return [...filtered, ...replenishedNodes];
        });
        setEdges((eds) => {
            const filtered = eds.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target));
            return [...filtered, ...replenishedEdges];
        });

        setSelectedNodes([]);
        setIsConfigOpen(false); // ✅ close config panel on delete
    }, [selectedNodes, nodes, edges, handleAddNode, handleOpenLibraryContext, setNodes, setEdges]);

    // ── Save automation ────────────────────────────────────────────────────────
    //  const handleSaveAutomation = async () => {
    //     if (!projectId || projectId === "none" || projectId === "default-project") {
    //         toast.error("Please assign this workflow to a valid project before publishing.");
    //         return;
    //     }

    //     console.log("📦 All nodes data before save:", 
    //   nodes.map(n => ({ id: n.id, type: n.type, data: n.data }))
    // );

    //     const { trigger, actions, conditions } = useAutomationStore.getState().convertWorkflowToData(nodes, edges);

    //     // ✅ ADD THIS — check payload before sending
    //     console.log("🚀 PAYLOAD TO API:", JSON.stringify({ trigger, actions, conditions }, null, 2));

    //     const pending = JSON.parse(localStorage.getItem("pending_automation") || "{}");
    //     const finalName = pending.name || automationName;
    //     const finalDesc = pending.description || "";
    //     const finalProject = pending.projectId || projectId;
    //     localStorage.removeItem("pending_automation");

    //     setIsSaving(true);
    //     try {
    //         const automationData = {
    //             name: finalName,
    //             description: finalDesc,
    //             trigger,
    //             conditions,
    //             actions,
    //             isActive: true,
    //             workflow: { nodes: nodes as any, edges: edges as any },
    //         };

    //         const isExisting = automationId && !automationId.startsWith("node_") && !automationId.startsWith("workflow-");
    //         if (isExisting) {
    //             await updateAutomation(projectId, automationId, automationData);
    //             toast.success(`Automation "${finalName}" updated and published!`);
    //         } else {
    //             await createAutomation(projectId, automationData);
    //             toast.success(`Automation "${finalName}" created and published!`);
    //         }
    //          await createAutomation(projectId, automationData);
    //         toast.success(`Automation "${finalName}" created!`);

    //         // ✅ Stop animation after 3 seconds
    //         setTimeout(() => setIsRunning(false), 3000);
    //     } catch (error: any) {
    //         toast.error(error.response?.data?.message || "Failed to save automation. Please try again.");
    //     } finally {
    //         setIsSaving(false);
    //     }
    // };

    const handleSaveAutomation = async () => {
        if (!projectId || projectId === "none" || projectId === "default-project") {
            toast.error("Please assign this workflow to a valid project before publishing.");
            return;
        }

        const { trigger, actions, conditions } = useAutomationStore.getState().convertWorkflowToData(nodes, edges);
        const pending = JSON.parse(localStorage.getItem("pending_automation") || "{}");
        const finalName = pending.name || automationName;        // ← declared here
        const finalDesc = pending.description || "";
        const finalProject = pending.projectId || projectId;
        localStorage.removeItem("pending_automation");

        setIsSaving(true);
        setIsRunning(true); // ✅ START animation HERE — after finalName is declared

        try {
            const automationData = {          // ← declared here
                name: finalName,
                description: finalDesc,
                trigger,
                conditions,
                actions,
                isActive: true,
                workflow: { nodes: nodes as any, edges: edges as any },
            };

            const isExisting = automationId && !automationId.startsWith("node_") && !automationId.startsWith("workflow-");
            if (isExisting) {
                await updateAutomation(projectId, automationId, automationData);
                toast.success(`Automation "${finalName}" updated and published!`);
            } else {
                await createAutomation(projectId, automationData);
                toast.success(`Automation "${finalName}" created and published!`);
            }

            // ✅ Stop animation after 3 seconds
            setTimeout(() => setIsRunning(false), 3000);

        } catch (error: any) {
            setIsRunning(false); // ✅ Stop on error too
            toast.error(error.response?.data?.message || "Failed to save automation.");
        } finally {
            setIsSaving(false);
        }
    };


    // ── Drag & Drop ────────────────────────────────────────────────────────────
    const onDragStart = (event: React.DragEvent, nodeType: string, template: NodeTemplate) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, template }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        if (!reactFlowInstance) return;
        const dataStr = event.dataTransfer.getData('application/reactflow');
        if (!dataStr) return;
        const { type, template } = JSON.parse(dataStr);
        if (!type) return;

        const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

        // Use handleAddNode for consistency — it handles PlusNode creation and config panel
        handleAddNode(template, undefined, undefined, position);
    }, [reactFlowInstance, handleAddNode]);

    // ── Render ─────────────────────────────────────────────────────────────────
    const nodeLabel = String(configNode?.data?.label || '').toLowerCase();

    return (
        <div className="flex h-full w-full relative overflow-hidden">

            {/* Left Sidebar */}
            {!readOnly && (
                <div className="w-72 border-r border-gray-100 bg-white flex-shrink-0 z-10 overflow-hidden flex flex-col">
                    <NodePanel
                        onDragStart={onDragStart}
                        onAddItem={(template) => handleAddNode(template)}
                    />
                </div>
            )}

            {/* ReactFlow Canvas */}
            <div ref={reactFlowWrapper} className="flex-1 bg-[#FDFDFF] relative">
                <ReactFlow
                    nodes={nodes}
                    edges={animatedEdges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onSelectionChange={onSelectionChange}
                    onPaneClick={() => { setIsConfigOpen(false); setIsLibrarySidebarOpen(false); }}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    // defaultEdgeOptions={{
                    //     type: 'straight', animated: false,
                    //     style: { stroke: '#E2E8F0', strokeWidth: 2, strokeDasharray: '4,4' },
                    // }}
                    defaultEdgeOptions={{
                        type: "straight",
                        animated: true,   // ✅ always flowing
                        style: { stroke: "#0073EA", strokeWidth: 2 },
                    }}

                    minZoom={0.2}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}

                    onNodeClick={(_, node) => {
                        if (node.type === 'plus') return;

                        // ✅ Triggers that need NO config panel:
                        const noConfigTriggers = [
                            "TASK_CREATED",
                            "SUBTASK_CREATED",
                            "WATCHER_ADDED",
                        ];

                        if (
                            node.type === "trigger" &&
                            noConfigTriggers.includes(node.data?.triggerId as string)
                        ) {
                            return; // ❌ No config panel for these triggers
                        }

                        setConfigNode(node);
                        setConfigValue(node.data?.value as string);
                        setIsConfigOpen(true);
                        setIsLibrarySidebarOpen(false);
                    }}
                >
                    <Background variant={BackgroundVariant.Lines} gap={40} size={1} color="#f1f5f9" />
                    <Controls className="!bg-white !border !border-gray-200 !shadow-sm rounded-lg overflow-hidden [&_button]:!border-gray-100" />

                    {/* ── Right-side overlay: buttons + sidebars ── */}
                    <Panel position="top-right" className="!m-0 h-full p-4 flex flex-col items-end gap-3 pointer-events-none">

                        {/* 1. Action Buttons */}
                        {!readOnly && (
                            <div className="flex items-center gap-2 pointer-events-auto">
                                <Input
                                    value={automationName}
                                    onChange={(e) => setAutomationName(e.target.value)}
                                    className="h-8 w-48 text-[11px] font-semibold bg-white border-gray-200 rounded-lg shadow-sm"
                                    placeholder="Automation name..."
                                />
                                <Button
                                    onClick={() => fitView({ padding: 0.2 })}
                                    variant="outline" size="sm"
                                    className="bg-white border-gray-200 hover:bg-gray-50 h-8 text-[11px] font-semibold shadow-sm"
                                >
                                    <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Fit View
                                </Button>
                                {selectedNodes.length > 0 && (
                                    <Button
                                        onClick={deleteSelectedNodes}
                                        variant="outline" size="sm"
                                        className="bg-white border-red-100 text-red-600 hover:bg-red-50 h-8 text-[11px] font-semibold shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSaveAutomation}
                                    disabled={isSaving} size="sm"
                                    className="bg-[#001F3F] hover:bg-[#002b5a] text-white h-8 text-[11px] font-semibold px-4 rounded-lg shadow-lg"
                                >
                                    {isSaving ? "Saving..." : "Save & Publish"}
                                </Button>
                            </div>
                        )}

                        {/* 2. Library Sidebar */}
                        {isLibrarySidebarOpen && (
                            <div className="flex-1 pointer-events-auto">
                                <LibrarySidebar
                                    isOpen={isLibrarySidebarOpen}
                                    onClose={() => setIsLibrarySidebarOpen(false)}
                                    onSelect={handleLibrarySelect}
                                    typeFilter={libraryTypeFilter}
                                />
                            </div>
                        )}

                        {/* 3. Config Panel */}
                        {(() => {
                            const activeNode = nodes.find(n => n.id === configNode?.id) || configNode;
                            if (!isConfigOpen || !activeNode) return null;

                            const activeLabel = (activeNode?.data?.label as string || "").toLowerCase();

                            return (
                                <div className="flex-1 pointer-events-auto">
                                    <div className="w-[450px] h-full rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden flex flex-col shrink-0">

                                        {/* Header */}
                                        <header className="px-6 py-2 flex items-start justify-between bg-white shrink-0 border-b border-gray-50/50">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100/50"
                                                    style={{ backgroundColor: (activeNode?.data?.color as string) || '#001F3F' }}
                                                >
                                                    {(() => {
                                                        const id = (activeNode?.data?.triggerId as string) || (activeNode?.data?.apiId as string) || "";
                                                        const type = activeNode?.type;
                                                        const ip = { className: "w-5 h-5 text-white" };
                                                        if (type === 'trigger') {
                                                            switch (id) {
                                                                case 'TASK_CREATED': return <Plus {...ip} />;
                                                                case 'TASK_UPDATED': return <Edit3 {...ip} />;
                                                                case 'STATUS_CHANGED': return <RefreshCw {...ip} />;
                                                                case 'STATUS_CHANGED_TO': return <CheckCircle2 {...ip} />;
                                                                case 'PRIORITY_CHANGED': return <AlertTriangle {...ip} />;
                                                                case 'DUE_DATE_CHANGED': return <Calendar {...ip} />;
                                                                case 'ASSIGNEE_CHANGED': return <UserPlus {...ip} />;
                                                                case 'SUBTASK_CREATED': return <ListPlus {...ip} />;
                                                                case 'WATCHER_ADDED': return <Eye {...ip} />;
                                                                default: return <Zap {...ip} />;
                                                            }
                                                        }
                                                        if (type === 'condition') return <GitBranch {...ip} />;
                                                        return <CheckCircle2 {...ip} />;
                                                    })()}
                                                </div>
                                                <div className="pt-0.5">
                                                    <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                                                        {activeNode?.data?.label as string} — Configure Step
                                                    </h2>
                                                    <p className="text-sm text-gray-400 font-medium mt-0.5">
                                                        {activeNode?.type} · Step {(activeNode?.data?.sequence as number) + 1}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => setIsConfigOpen(false)}
                                                className="rounded-full w-8 h-8 hover:bg-gray-50 -mt-1 -mr-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-5 h-5" />
                                            </Button>
                                        </header>

                                        {/* Body */}
                                        <div className="flex-1 min-h-0">
                                            <ScrollArea className="h-full">
                                                <div className="p-6 space-y-8 bg-white">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest">
                                                                {activeNode?.type === 'trigger' ? 'When this happens...' : 'Then do this...'}
                                                            </label>
                                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                                                {activeNode?.data?.label as React.ReactNode}
                                                            </h3>
                                                        </div>
                                                        <div className="grid gap-6">

                                                            {activeNode?.type === "trigger" && (
                                                                <TriggerConfig
                                                                    activeNode={activeNode}
                                                                    configValue={configValue}
                                                                    setConfigValue={setConfigValue}
                                                                    setNodes={setNodes}
                                                                    allTaskFields={allTaskFields}
                                                                    project={project}
                                                                />
                                                            )}
                                                            {/* {activeNode?.type === "action" && (
                                                                <ActionConfig
                                                                    activeNode={activeNode}
                                                                    configValue={configValue}
                                                                    setConfigValue={setConfigValue}
                                                                    setNodes={setNodes}
                                                                    nodes={nodes}
                                                                    getOptionsForField={getOptionsForField}
                                                                />
                                                            )} */}

                                                            {/* {activeNode?.type === "condition" && (
                                                                <ConditionConfig
                                                                    activeNode={activeNode}
                                                                    configValue={configValue}
                                                                    setConfigValue={setConfigValue}
                                                                    setNodes={setNodes}
                                                                    nodes={nodes}
                                                                    allTaskFields={allTaskFields}
                                                                    project={project}
                                                                />
                                                            )} */}

                                                        </div>

                                                    </div>

                                                    {/* Pro Tip */}
                                                    {/* <div className="pt-12 border-t border-gray-50">
                                                        <div className="p-4 bg-gray-50/50 rounded-xl flex items-start gap-3 border border-blue-50">
                                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-sm">
                                                                <Settings className="w-4 h-4 text-gray-600" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Pro Tip</h4>
                                                                <p className="text-[12px] text-gray-500 leading-relaxed font-semibold">
                                                                    Make sure your column names match the criteria to trigger this automation accurately.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                </div>
                                            </ScrollArea>
                                        </div>

                                        {/* Footer */}
                                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 shrink-0">
                                            <Button
                                                onClick={() => setIsConfigOpen(false)}
                                                className="w-full h-11 bg-[#0073EA] hover:bg-[#005fb8] text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all"
                                            >
                                                Done
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};

// ─── Wrapper with ReactFlowProvider ───────────────────────────────────────────
const WorkflowBuilder = (props: WorkflowBuilderProps) => {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderInner {...props} />
        </ReactFlowProvider>
    );
};

export default WorkflowBuilder;
