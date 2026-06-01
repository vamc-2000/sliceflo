"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAutomationStore } from "@/stores/automation-store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Users, Lock, Building2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkflowPageProps {
    projectId: string;
    onClose?: () => void;
}

const WorkflowPage = ({ projectId, onClose }: WorkflowPageProps) => {
    const router = useRouter();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [workflowIdentifier, setWorkflowIdentifier] = useState("");
    const [visibility, setVisibility] = useState<"private" | "team" | "workspace">("team");
    // const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    // Use automation store
    const {
        getAutomationsByProject,
        toggleAutomation,
        deleteAutomation,
        createAutomation,
        fetchAutomations,
        automations: allAutomations
    } = useAutomationStore();

    // Workspace store
    const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();

    useEffect(() => {
        console.log('workspace:', currentWorkspace?.id, '| members:', workspaceMembers);
        if (currentWorkspace?.id) {

            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [currentWorkspace?.id, fetchWorkspaceMembers]);

    // Get workflows for this project
    const rawWorkflows = getAutomationsByProject(projectId);

    // Filter workflows based on search
    const workflows = rawWorkflows.filter((w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto-generate identifier from name
    useEffect(() => {
        if (workflowName) {
            const words = workflowName.trim().split(/\s+/);
            let identifier = "";

            if (words.length >= 3) {
                // Take first letter of first 3 words
                identifier = words.slice(0, 3).map(word => word[0]).join("");
            } else if (words.length > 0) {
                // Take first 3 letters of first word
                identifier = words[0].slice(0, 3);
            }

            setWorkflowIdentifier(identifier.toUpperCase());
        } else {
            setWorkflowIdentifier("");
        }
    }, [workflowName]);
    useEffect(() => {
        if (projectId) {
            fetchAutomations(projectId);
        }
    }, [projectId]);

    const toggleItem = (value: string) => {
        setExpandedItems((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    const handleGetStarted = () => {
        setIsGetStartedOpen(true);
    };

    const handleStartFromScratch = () => {
        setIsGetStartedOpen(false);
        setIsCreateDialogOpen(true);
    };

    const handleCreateWorkflow = () => {
        if (!workflowName.trim() || !workflowIdentifier.trim()) return;

        // Save name/projectId for builder to use later
        localStorage.setItem("pending_automation", JSON.stringify({
            name: workflowName,
            description: workflowIdentifier,
            projectId: projectId,
        }));

        setWorkflowName("");
        setWorkflowIdentifier("");
        setVisibility("team");
        setIsCreateDialogOpen(false);
        onClose?.();

        // Go to builder — no API call yet
        const tempId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        router.push(`/workflows/${tempId}?projectId=${projectId}`);
    };

    const isLoading = useAutomationStore(s => s.isLoading);


    // Show empty state if no workflows
    if (workflows.length === 0) {
        return (
            <>
                <div className="w-full h-full bg-white p-2">
                    <div className="mb-2">
                        <h2 className="text-[20px] font-bold text-[#001F3F]">Workflows</h2>
                        <p className="text-gray-500 text-[14px] mt-1">
                            Design intelligent workflows that reason, decide, and automate how work moves across your projects.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex items-stretch">
                        <div className="flex-1 p-12 flex flex-col justify-center">
                            <h3 className="text-[28px] font-bold text-gray-900 leading-tight mb-4">
                                Automate your team's<br />work with powerful<br />workflows
                            </h3>
                            <p className="text-gray-500 text-[14px] mb-8 max-w-sm">
                                Create intelligent workflows to streamline processes, set automated actions, and supercharge productivity.
                            </p>
                            <Button
                                onClick={handleGetStarted}
                                className="bg-[#001F3F] text-white hover:bg-[#002F5F] px-6 py-2 h-11 text-[14px] font-semibold rounded-lg shadow-sm w-fit"
                            >
                                Get started
                            </Button>
                        </div>

                        <div className="flex-1 relative   border-gray-100 flex items-center justify-center p-3">
                            <div className="relative w-full aspect-[4/3]">
                                <Image
                                    src="/images/workflow.svg"
                                    alt="Workflow illustration"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Get Started Dialog */}
                <Dialog open={isGetStartedOpen} onOpenChange={setIsGetStartedOpen}>
                    <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-0 shadow-2xl rounded-lg">
                        <DialogHeader className="px-8 pt-12 pb-2 bg-white flex flex-col items-center">
                            <DialogTitle className="text-[26px] font-bold text-gray-900">
                                Creating a new Workflow!
                            </DialogTitle>
                            <p className="text-[15px] font-medium text-gray-500 mt-2">
                                How would you like to start?
                            </p>
                        </DialogHeader>

                        <div className="px-10 py-10 pb-16">
                            <div className="grid grid-cols-2 gap-8">
                                {/* Use Templates Card */}
                                <div className="border border-gray-100 rounded-[28px] p-1.5 bg-white hover:shadow-xl transition-all group cursor-pointer">
                                    <div className="bg-[#E9F2FF] rounded-[24px] aspect-[4/3] flex flex-col items-center justify-center p-6 gap-6">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <div className="w-14 h-14 relative">
                                                <Image
                                                    src="/images/usetemplate.svg"
                                                    alt="Use templates"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                        <h3 className="text-[17px] font-bold text-[#001F3F]">Use templates</h3>
                                    </div>
                                </div>

                                {/* Start from Scratch Card */}
                                <div
                                    onClick={handleStartFromScratch}
                                    className="border border-gray-100 rounded-[28px] p-1.5 bg-white hover:shadow-xl transition-all group cursor-pointer"
                                >
                                    <div className="bg-white rounded-[24px] aspect-[4/3] flex flex-col items-center justify-center p-6 gap-6">
                                        <div className="w-24 h-24 bg-[#F2F5F9] rounded-full flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                            <div className="w-10 h-10 text-[#94A3B8]">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 20L7 20C4.23858 20 2 17.7614 2 15C2 12.2386 4.23858 10 7 10L9 10" />
                                                    <path d="M13 4L17 4C19.7614 4 22 6.23858 22 9C22 11.7614 19.7614 14 17 14L15 14" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </div>
                                            <div className="absolute top-0 right-0 w-9 h-9 bg-[#E9F2FF] rounded-full flex items-center justify-center border-4 border-white translate-x-1 -translate-y-1">
                                                <Plus className="w-5 h-5 text-[#001F3F] stroke-[3px]" />
                                            </div>
                                        </div>
                                        <h3 className="text-[17px] font-bold text-[#001F3F]">Start from scratch</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Create Workflow Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl rounded-xl">
                        <DialogHeader className="px-8 pt-6 pb-4 bg-white">
                            <DialogTitle className="text-[15px] font-normal text-gray-500">Workflow questions</DialogTitle>
                        </DialogHeader>

                        <div className="px-8 py-6 bg-white space-y-6">
                            {/* Workflow Name and Identifier */}
                            <div className="bg-[#F5F5F7] rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="workflow-name" className="text-[13px] font-normal text-[#8E8E93]">
                                            Workflow name
                                        </Label>
                                        <Input
                                            id="workflow-name"
                                            placeholder="e.g. Workflow name 1"
                                            value={workflowName}
                                            onChange={(e) => setWorkflowName(e.target.value)}
                                            className="h-9 px-3 bg-white border-[#8E8E93] rounded-md text-[13px] placeholder:text-gray-400"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="workflow-identifier" className="text-[13px] font-normal text-[#8E8E93]">
                                            Workflow identifier
                                        </Label>
                                        <Input
                                            id="workflow-identifier"
                                            placeholder="e.g. WF1"
                                            value={workflowIdentifier}
                                            onChange={(e) => setWorkflowIdentifier(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && workflowName.trim() && workflowIdentifier.trim()) {
                                                    handleCreateWorkflow();
                                                }
                                            }}
                                            className="h-9 px-3 bg-white border-[#8E8E93] rounded-md text-[13px] placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Workflow Visibility */}
                            <div className="bg-white rounded-lg border border-[#E5E5EA]">
                                <div className="border-b border-[#001F3F] rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-[14px] text-gray-900">Workflow visibility</p>
                                        <p className="text-[13px] text-gray-500 mt-1">Choose who can see and access this Workflow.</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setVisibility("private")}
                                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border-b-3 transition-all ${visibility === "private"
                                                ? "border-[#001F3F] bg-[#001F3F]/5 text-[#001F3F]"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                }`}
                                        >
                                            <Lock className="w-3.5 h-3.5" />
                                            <span className="text-[12px] font-medium">Private</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVisibility("team")}
                                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border-b-3 transition-all ${visibility === "team"
                                                ? "border-[#001F3F] bg-[#001F3F]/5 text-[#001F3F]"
                                                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                                                }`}
                                        >
                                            <Users className="w-3 h-3" />
                                            <span className="text-[12px] font-medium">Teams</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVisibility("workspace")}
                                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border-b-3 transition-all ${visibility === "workspace"
                                                ? "border-[#001F3F] bg-[#001F3F]/5 text-[#001F3F]"
                                                : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                                                }`}
                                        >
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span className="text-[12px] font-medium">Everyone from Workspace</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-8 py-4 bg-white flex items-center justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsCreateDialogOpen(false);
                                    setWorkflowName("");
                                    setWorkflowIdentifier("");
                                    setVisibility("team");
                                }}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-normal text-[13px] h-9"
                            >
                                Cancel
                            </Button>
                            {/* // Change button to: */}
                            <Button
                                onClick={handleCreateWorkflow}
                                disabled={!workflowName.trim() || !workflowIdentifier.trim()}
                                className="bg-[#001F3F] text-white hover:bg-[#003366] px-6 h-10 rounded-lg"
                            >
                                Create Workflow
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
    // Regular view
    return (
        <>
            <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header Section */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[16px] font-bold text-[#001F3F]">
                                Create and manage workflows
                            </h2>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                                <span className="text-[11px] font-medium text-gray-500">4/5</span>
                                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors cursor-help">
                                    <span className="text-[9px] font-bold">i</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[13px] text-gray-400 mt-0.5 font-normal">
                            Build, customize, and maintain workflows.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-md"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {isExpanded && (
                    <div className="p-6 space-y-5">
                        {/* Controls Row */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Search Workflow"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-4 h-10 border-gray-200 rounded-lg text-[13px] bg-white w-full max-w-[320px] focus:ring-0 focus:border-gray-300"
                                />
                            </div>
                            <Button
                                onClick={handleGetStarted}
                                className="bg-[#001F3F] hover:bg-[#002F5F] text-white px-5 h-10 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm ml-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Add Workflow
                            </Button>
                        </div>

                        {/* Workflow List */}
                        <div className="space-y-3">
                            {workflows.length > 0 ? (
                                workflows.map((workflow) => {
                                    // Mock some values for demo if they don't exist
                                    const successRate = workflow.successRate ?? 100;
                                    const actionsCount = workflow.actionsCount ?? 2;
                                    const workspaceName = currentWorkspace?.name || workflow.project || "Workspace A";
                                    const lastUpdatedStr = workflow.updatedAt ? "2m ago" : "2s ago"; // Just for demo as per image

                                    const rawWorkflow = workflow as any;

                                    // createdBy ఇప్పుడు userId string గా వస్తుంది
                                    const createdById =
                                        typeof rawWorkflow.createdBy === 'string'
                                            ? rawWorkflow.createdBy
                                            : rawWorkflow.createdBy?.id || rawWorkflow.createdBy?._id || rawWorkflow.createdBy?.userId;

                                    const workflowOwner = workspaceMembers.find((m: any) => m.userId === createdById);

                                    const ownerName = workflowOwner?.name || "U";
                                    const ownerAvatar = workflowOwner?.profilePicture || undefined;
                                    return (
                                        <div
                                            key={workflow.id}
                                            className="relative group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex items-center p-4 min-h-[85px]"
                                        >
                                            {/* Colored Accent */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${workflow.isActive ? 'bg-[#001F3F]' : 'bg-gray-300'}`} />

                                            {/* Toggle and Name */}
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <Switch
                                                    checked={workflow.isActive}
                                                    onCheckedChange={() => toggleAutomation(projectId, workflow.id!)}
                                                    className="data-[state=checked]:bg-[#001F3F] scale-90"
                                                />

                                                <div className="min-w-0">
                                                    <h4 className="text-[14px] font-semibold text-[#001F3F] truncate">
                                                        {workflow.name}
                                                    </h4>
                                                    <p className="text-[12px] text-gray-400 font-medium">{workspaceName}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Actions: {actionsCount}</p>
                                                </div>
                                            </div>

                                            {/* Columns */}
                                            <div className="flex items-center gap-10 pr-2">
                                                {/* Last Updated */}
                                                <div className="text-left w-24">
                                                    <p className="text-[11px] text-gray-400 font-medium mb-1">Last updated</p>
                                                    <p className="text-[13px] text-gray-700 font-semibold">{lastUpdatedStr}</p>
                                                </div>

                                                {/* Success Rate */}
                                                <div className="text-center w-24">
                                                    <p className="text-[11px] text-gray-400 font-medium mb-1">Success rate</p>
                                                    <div className={`inline-flex px-4 py-1 rounded-lg text-[12px] font-semibold ${successRate === 100
                                                        ? "bg-green-50 text-green-500"
                                                        : successRate >= 80
                                                            ? "bg-yellow-50 text-yellow-500"
                                                            : "bg-gray-50 text-gray-400"
                                                        }`}>
                                                        {successRate === 0 ? "-" : `${successRate}%`}
                                                    </div>
                                                </div>

                                                {/* Owner */}
                                                <div className="text-center w-20">
                                                    <p className="text-[11px] text-gray-400 font-medium mb-1">Owner</p>
                                                    <Avatar className="w-8 h-8 mx-auto border-2 border-white shadow-sm hover:scale-105 transition-transform">
                                                        <AvatarImage src={ownerAvatar} />
                                                        <AvatarFallback className="bg-[#E9F2FF] text-[#001F3F] text-[10px] font-bold">
                                                            {(ownerName[0]).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                {/* More Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#001F3F] hover:bg-gray-50 rounded-full h-8 w-8">
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border border-gray-100 p-1.5">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                router.push(`/workflows/${workflow.id}?projectId=${projectId}`);
                                                                onClose?.();
                                                            }}
                                                            className="text-[13px] py-2.5 cursor-pointer rounded-lg focus:bg-gray-50 font-medium text-gray-700"
                                                        >
                                                            Edit Workflow
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => deleteAutomation(projectId, workflow.id!)}
                                                            className="text-[13px] py-2.5 cursor-pointer rounded-lg focus:bg-red-50 text-red-600 font-medium"
                                                        >
                                                            Delete Workflow
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                    <p className="text-gray-400 text-sm">
                                        {searchQuery ? "No workflows match your search." : "No workflows yet. Create one to get started."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs for creating workflow */}
            <Dialog open={isGetStartedOpen} onOpenChange={setIsGetStartedOpen}>
                <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-0 shadow-2xl rounded-[32px]">
                    <DialogHeader className="px-8 pt-12 pb-2 bg-white flex flex-col items-center">
                        <DialogTitle className="text-[26px] font-bold text-gray-900">
                            Creating a new Workflow!
                        </DialogTitle>
                        <p className="text-[15px] font-medium text-gray-500 mt-2">
                            How would you like to start?
                        </p>
                    </DialogHeader>

                    <div className="px-10 py-10 pb-16">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Use Templates Card */}
                            <div className="border border-gray-100 rounded-[28px] p-1.5 bg-white hover:shadow-xl transition-all group cursor-pointer">
                                <div className="bg-[#E9F2FF] rounded-[24px] aspect-[4/3] flex flex-col items-center justify-center p-6 gap-6">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <div className="w-14 h-14 relative">
                                            <Image
                                                src="/images/usetemplate.svg"
                                                alt="Use templates"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                    <h3 className="text-[17px] font-bold text-[#001F3F]">Use templates</h3>
                                </div>
                            </div>

                            {/* Start from Scratch Card */}
                            <div
                                onClick={handleStartFromScratch}
                                className="border border-gray-100 rounded-[28px] p-1.5 bg-white hover:shadow-xl transition-all group cursor-pointer"
                            >
                                <div className="bg-white rounded-[24px] aspect-[4/3] flex flex-col items-center justify-center p-6 gap-6">
                                    <div className="w-24 h-24 bg-[#F2F5F9] rounded-full flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                        <div className="w-10 h-10 text-[#94A3B8]">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 20L7 20C4.23858 20 2 17.7614 2 15C2 12.2386 4.23858 10 7 10L9 10" />
                                                <path d="M13 4L17 4C19.7614 4 22 6.23858 22 9C22 11.7614 19.7614 14 17 14L15 14" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </div>
                                        <div className="absolute top-0 right-0 w-9 h-9 bg-[#E9F2FF] rounded-full flex items-center justify-center border-4 border-white translate-x-1 -translate-y-1">
                                            <Plus className="w-5 h-5 text-[#001F3F] stroke-[3px]" />
                                        </div>
                                    </div>
                                    <h3 className="text-[17px] font-bold text-[#001F3F]">Start from scratch</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl rounded-xl">
                    <DialogHeader className="px-8 pt-6 pb-4 bg-white">
                        <DialogTitle className="text-[15px] font-normal text-gray-500">Workflow questions</DialogTitle>
                    </DialogHeader>

                    <div className="px-8 py-6 bg-white space-y-6">
                        {/* Workflow Name and Identifier */}
                        <div className="bg-[#F5F5F7] rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="workflow-name" className="text-[13px] font-normal text-[#8E8E93]">
                                        Workflow name
                                    </Label>
                                    <Input
                                        id="workflow-name"
                                        placeholder="e.g. Workflow name 1"
                                        value={workflowName}
                                        onChange={(e) => setWorkflowName(e.target.value)}
                                        className="h-9 px-3 bg-white border-[#8E8E93]/30 rounded-md text-[13px] placeholder:text-gray-400 focus:border-[#001F3F] focus:ring-0 transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="workflow-identifier" className="text-[13px] font-normal text-[#8E8E93]">
                                        Workflow identifier
                                    </Label>
                                    <Input
                                        id="workflow-identifier"
                                        placeholder="e.g. WF1"
                                        value={workflowIdentifier}
                                        onChange={(e) => setWorkflowIdentifier(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && workflowName.trim() && workflowIdentifier.trim()) {
                                                handleCreateWorkflow();
                                            }
                                        }}
                                        className="h-9 px-3 bg-white border-[#8E8E93]/30 rounded-md text-[13px] placeholder:text-gray-400 focus:border-[#001F3F] focus:ring-0 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Workflow Visibility */}
                        <div className="bg-white rounded-lg border border-[#E5E5EA]">
                            <div className="border-b border-[#001F3F] rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-[14px] text-gray-900">Workflow visibility</p>
                                    <p className="text-[13px] text-gray-500 mt-1">Choose who can see and access this Workflow.</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setVisibility("private")}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all border-b-3 ${visibility === "private"
                                            ? "border-[#001F3F] bg-[#001F3F]/5 text-[#001F3F]"
                                            : "border-transparent bg-white text-gray-600 hover:border-gray-200"
                                            }`}
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="text-[12px] font-medium">Private</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVisibility("team")}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all border-b-3 ${visibility === "team"
                                            ? "border-[#001F3F] bg-[#001F3F]/5 text-[#001F3F]"
                                            : "border-transparent bg-white text-gray-600 hover:border-gray-200"
                                            }`}
                                    >
                                        <Users className="w-3 h-3" />
                                        <span className="text-[12px] font-medium">Teams</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVisibility("workspace")}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all border-b-3 ${visibility === "workspace"
                                            ? "border-[#001F3F] bg-[#001F3F]/5 text-[#001F3F]"
                                            : "border-transparent bg-white text-gray-600 hover:border-gray-200"
                                            }`}
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span className="text-[12px] font-medium">Everyone from Workspace</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-4 bg-white flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsCreateDialogOpen(false);
                                setWorkflowName("");
                                setWorkflowIdentifier("");
                                setVisibility("team");
                            }}
                            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-normal text-[13px] h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateWorkflow}
                            disabled={!workflowName.trim() || !workflowIdentifier.trim()}
                            className="bg-[#001F3F] text-white hover:bg-[#003366] font-normal text-[13px] px-6 h-9 rounded-md"
                        >
                            Create Workflow
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );

};

export default WorkflowPage;
