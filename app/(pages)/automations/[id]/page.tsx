"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    Save,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { templateSets } from "../data";
import WorkflowBuilder from "@/components/automations/WorkflowBuilder";
import { useAutomationStore } from "@/stores/automation-store";
import { useProjectsStore } from "@/stores/projects-store";
import type { Node, Edge } from "@xyflow/react";

const AutomationDetailPage = () => {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { id } = params;
    const searchParams = useSearchParams();
    const projectIdFromUrl = searchParams.get("projectId") || "";
    const { createAutomation, updateAutomation, convertWorkflowToData, automations } = useAutomationStore();
    const { projects, fetchProjects } = useProjectsStore();

    // Ensure projects are loaded
    useEffect(() => {
        if (projects.length === 0) {
            fetchProjects();
        }
    }, [projects.length, fetchProjects]);

    // Determine the working projectId
    const existingAutomation = automations.find(a => a.id === id);
    const projectIdCandidate = existingAutomation?.projectId || projectIdFromUrl;
    const projectId = (projectIdCandidate && projectIdCandidate !== "default-project"
        ? projectIdCandidate
        : (projects.length > 0 ? (projects[0].id ?? "default-project") : "default-project")) as string;
    const allTemplates = Object.values(templateSets).flat();
    const template = allTemplates.find(t => t.id === id);

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [name, setName] = useState("");

    // Initialize workflow
    useEffect(() => {
        if (existingAutomation) {
            // Load existing automation
            setNodes(existingAutomation.workflow?.nodes || []);
            setEdges(existingAutomation.workflow?.edges || []);
            setName(existingAutomation.name);
        } else if (template) {
            // Initialize from template
            const triggerNode: Node = {
                id: 'trigger-1',
                type: 'trigger',
                position: { x: 250, y: 50 },
                data: {
                    label: `${template.text[0]}${template.text[1]}${template.text[2]}`,
                    description: 'Template trigger event',
                    color: template.color,
                },
            };

            const actionNode: Node = {
                id: 'action-1',
                type: 'action',
                position: { x: 250, y: 250 },
                data: {
                    label: template.text[3],
                    description: 'Template action',
                },
            };

            const edge: Edge = {
                id: 'edge-1',
                source: 'trigger-1',
                target: 'action-1',
                type: 'smoothstep',
                animated: true,
            };

            setNodes([triggerNode, actionNode]);
            setEdges([edge]);
            setName(`${template.text[0]}${template.text[1]}${template.text[2]}`);
        }
    }, [existingAutomation, template]);

    const handleWorkflowChange = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
        setNodes(updatedNodes);
        setEdges(updatedEdges);
    }, []);

    const handleSave = async (activate: boolean) => {
        const { trigger, actions, conditions } = convertWorkflowToData(nodes, edges);

        try {
            if (existingAutomation) {
                // Update existing
                await updateAutomation(projectId, existingAutomation.id!, {
                    isActive: activate,
                    trigger,
                    conditions,
                    actions,
                    workflow: {
                        nodes: nodes as any,
                        edges: edges as any,
                    }
                });
            } else if (template) {
                // Create new from template
                await createAutomation(projectId, {
                    name: name || `${template.text[0]}${template.text[1]}${template.text[2]}`,
                    description: template.text[3],
                    trigger,
                    conditions,
                    actions,
                    isActive: activate,
                    workflow: {
                        nodes: nodes as any,
                        edges: edges as any,
                    }
                });
            }
            router.push("/automations");
        } catch (err) {
            console.error("Failed to save automation:", err);
        }
    };

    if (!existingAutomation && !template) {
        return (
            <div className="flex flex-col h-screen bg-white items-center justify-center">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Automation not found</h2>
                <p className="text-gray-500 mb-8">We couldn't find the automation you're looking for.</p>
                <Button
                    onClick={() => router.push("/automations")}
                    className="bg-[#001F3F] hover:bg-[#002F5F] text-white rounded-lg px-8"
                >
                    Back to Hub
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-100 shadow-sm z-20 h-14">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/automations")}
                        className="hover:bg-gray-100 rounded-full w-8 h-8"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-none mb-0.5">
                            {name || "Workflow Editor"}
                        </h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            {existingAutomation ? "Editing Automation" : `Template / ${id}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => handleSave(false)}
                        variant="outline"
                        className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 font-medium text-[11px] rounded-lg"
                    >
                        <Save className="w-3 h-3 mr-1.5" />
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave(true)}
                        className="h-8 px-4 bg-[#001F3F] text-white hover:bg-[#002F5F] font-semibold text-[11px] rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Zap className="w-3 h-3 mr-1.5" />
                        Activate
                    </Button>
                </div>
            </header>

            {/* Workflow Builder */}
            <main className="flex-1 overflow-hidden bg-[#F9FAFB]">
                <WorkflowBuilder
                    projectId={projectId}
                    initialNodes={nodes}
                    initialEdges={edges}
                    onWorkflowChange={handleWorkflowChange}
                />
            </main>
        </div>
    );
};

export default AutomationDetailPage;
