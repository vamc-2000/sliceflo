"use client";

import React, { useState, useCallback } from "react";
import { ChevronLeft, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import WorkflowBuilder from "@/components/automations/WorkflowBuilder";
import { useAutomationStore } from "@/stores/automation-store";
import { useProjectsStore } from "@/stores/projects-store";
import type { Node, Edge } from "@xyflow/react";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const AutomationCreatePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdFromUrl = searchParams.get("projectId");

    const { projects, fetchProjects } = useProjectsStore();

    // Determine the working projectId
    const projectId = projectIdFromUrl && projectIdFromUrl !== "default-project"
        ? projectIdFromUrl
        : (projects.length > 0 ? (projects[0].id ?? "default-project") : "default-project");

    // Ensure projects are loaded
    useEffect(() => {
        if (projects.length === 0) {
            fetchProjects();
        }
    }, [projects.length, fetchProjects]);

    const { createAutomation, convertWorkflowToData } = useAutomationStore();
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [automationName, setAutomationName] = useState("");

    const handleWorkflowChange = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
        setNodes(updatedNodes);
        setEdges(updatedEdges);
    }, []);

    const handleSaveDraft = () => {
        setShowSaveDialog(true);
    };

    const handleSaveConfirm = async () => {
        if (!automationName.trim()) return;

        const { trigger, actions, conditions } = convertWorkflowToData(nodes, edges);

        try {
            await createAutomation(projectId, {
                name: automationName,
                description: "Custom workflow automation",
                trigger,
                conditions,
                actions,
                isActive: false,
                workflow: {
                    nodes: nodes as any,
                    edges: edges as any,
                }
            });
            setShowSaveDialog(false);
            router.push("/automations");
        } catch (err) {
            console.error("Failed to save automation:", err);
        }
    };

    const handleActivate = async () => {
        if (!automationName.trim()) {
            setShowSaveDialog(true);
            return;
        }

        const { trigger, actions, conditions } = convertWorkflowToData(nodes, edges);

        try {
            await createAutomation(projectId, {
                name: automationName,
                description: "Custom workflow automation",
                trigger,
                conditions,
                actions,
                isActive: true,
                workflow: {
                    nodes: nodes as any,
                    edges: edges as any,
                }
            });
            router.push("/automations");
        } catch (err) {
            console.error("Failed to activate automation:", err);
        }
    };

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
                            Create Automation
                        </h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            Workflow Builder
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSaveDraft}
                        variant="outline"
                        className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 font-medium text-[11px] rounded-lg"
                    >
                        <Save className="w-3 h-3 mr-1.5" />
                        Save Draft
                    </Button>
                    <Button
                        onClick={handleActivate}
                        className="h-8 px-4 bg-[#001F3F] text-white hover:bg-[#002F5F] font-semibold text-[11px] rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Zap className="w-3 h-3 mr-1.5" />
                        Activate
                    </Button>
                </div>
            </header>

            {/* Workflow Builder */}
            <main className="flex-1 overflow-hidden">
                <WorkflowBuilder
                    projectId={projectId}
                    initialNodes={nodes}
                    initialEdges={edges}
                    onWorkflowChange={handleWorkflowChange}
                />
            </main>

            {/* Save Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Save Automation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <label htmlFor="automation-name" className="text-sm font-medium text-gray-700 mb-2 block">
                            Automation Name
                        </label>
                        <Input
                            id="automation-name"
                            placeholder="Enter automation name"
                            value={automationName}
                            onChange={(e) => setAutomationName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && automationName.trim()) {
                                    handleSaveConfirm();
                                }
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-100"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowSaveDialog(false);
                            }}
                            className="mr-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveConfirm}
                            disabled={!automationName.trim()}
                            className="bg-[#001F3F] text-white hover:bg-[#002F5F]"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AutomationCreatePage;
