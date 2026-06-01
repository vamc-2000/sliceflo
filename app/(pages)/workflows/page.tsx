"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAutomationStore } from "@/stores/automation-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Users, Lock, Building2, Plus, Search,
    MoreHorizontal, LayoutGrid, List as ListIcon,
    Trash2, Copy, Edit, Loader2, Zap
} from "lucide-react";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

const WorkflowsPage = () => {
    const router = useRouter();

    // ── Automation Store ──────────────────────────────────
    const {
        automations,
        isLoading,
        fetchAutomations,
        fetchMetadata,
        deleteAutomation,
        toggleAutomation,
    } = useAutomationStore();

    // ── Projects Store ────────────────────────────────────
    const { projects, fetchProjects } = useProjectsStore();

    // ── Local UI state ────────────────────────────────────
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [workflowDescription, setWorkflowDescription] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
    const [visibility, setVisibility] = useState<"private" | "team" | "workspace">("team");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isCreating, setIsCreating] = useState(false);

    // ── Load projects on mount ────────────────────────────
    useEffect(() => {
        fetchProjects();
        fetchMetadata();
    }, [fetchProjects, fetchMetadata]);

    // ── Load automations for all projects ─────────────────
    useEffect(() => {
        if (projects.length > 0) {
            projects.forEach((p) => {
                if (p.id) fetchAutomations(p.id);
            });
        }
    }, [projects, fetchAutomations]);

    // ── Create new automation → navigate to builder ───────
  const handleCreateWorkflow = () => {
  if (!workflowName.trim()) return;
  if (selectedProjectId === "none" || !selectedProjectId) {
    toast.error("Please select a project.");
    return;
  }

  // Save pending data for builder to use on Save & Publish
  localStorage.setItem("pending_automation", JSON.stringify({
    name: workflowName,
    description: workflowDescription,
    projectId: selectedProjectId,
  }));

  setWorkflowName("");
  setWorkflowDescription("");
  setSelectedProjectId("none");
  setVisibility("team");
  setShowCreateForm(false);

  // Navigate to builder — API called only on Save & Publish
  const tempId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  router.push(`/workflows/${tempId}?projectId=${selectedProjectId}`);
};


    const handleCancel = () => {
        setShowCreateForm(false);
        setWorkflowName("");
        setWorkflowDescription("");
        setSelectedProjectId("none");
        setVisibility("team");
    };

    const handleDelete = (e: React.MouseEvent, automationId: string, projectId: string | undefined) => {
        e.stopPropagation();
        if (!projectId) {
            toast.error("Cannot delete: no project assigned.");
            return;
        }
        deleteAutomation(projectId, automationId);
        toast.success("Workflow deleted.");
    };

    const handleDuplicate = async (e: React.MouseEvent, automationId: string, projectId: string | undefined) => {
        e.stopPropagation();
        if (!projectId) {
            toast.error("Cannot duplicate: no project assigned.");
            return;
        }
        const original = automations.find((a) => a.id === automationId);
        if (!original) return;

        try {
            const { createAutomation } = useAutomationStore.getState();
            await createAutomation(projectId, {
                ...original,
                name: `${original.name} (Copy)`,
                isActive: false,
            });
            toast.success("Workflow duplicated.");
        } catch {
            // handled by store
        }
    };

    // ── Derived ───────────────────────────────────────────
    const filteredAutomations = automations.filter(
        (a) =>
            a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Empty State ───────────────────────────────────────
    if (!isLoading && automations.length === 0 && !showCreateForm) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <div className="text-center max-w-2xl px-8">
                    <h1 className="text-[32px] font-bold text-gray-900 mb-3">Workflows</h1>
                    <p className="text-gray-500 text-[16px] mb-12">
                        Design intelligent workflows that reason, decide, and automate how work moves across your projects.
                    </p>
                    <div className="mb-12 relative w-[500px] h-[300px] mx-auto">
                        <Image
                            src="/images/workflow.svg"
                            alt="Workflow illustration"
                            width={500}
                            height={300}
                            className="object-contain"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                            <h2 className="text-[24px] font-semibold text-gray-900 mb-2">
                                Automate your team's work with powerful workflows
                            </h2>
                            <p className="text-gray-600 text-[15px] mb-6">
                                Create intelligent workflows to streamline processes, set automated actions, and supercharge productivity.
                            </p>
                            <Button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-[#001F3F] text-white hover:bg-[#002F5F] px-8 py-6 text-[15px] font-semibold rounded-lg shadow-md"
                            >
                                Get started
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main View ─────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-[#F8F9FB]">
            {/* Header */}
            <header className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage and automate your team&apos;s processes</p>
                </div>
                {!showCreateForm && (
                    <Button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-[#001F3F] text-white hover:bg-[#002F5F] px-5 h-10 rounded-lg shadow-sm font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-4.5 h-4.5" />
                        Create new
                    </Button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {showCreateForm ? (
                    /* ── Create Form ── */
                    <div className="w-full max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">New Workflow</h2>
                            </div>
                            <div className="px-8 py-6 space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="workflow-name" className="text-sm font-medium text-gray-700">
                                        Workflow name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="workflow-name"
                                        placeholder="e.g. Auto-assign on task creation"
                                        value={workflowName}
                                        onChange={(e) => setWorkflowName(e.target.value)}
                                        className="w-full h-11 px-4 bg-white border-gray-200 rounded-lg focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        autoFocus
                                    />
                                </div>

                                {/* Description + Project */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="workflow-desc" className="text-sm font-medium text-gray-700">
                                            Description
                                        </Label>
                                        <Input
                                            id="workflow-desc"
                                            placeholder="Brief description"
                                            value={workflowDescription}
                                            onChange={(e) => setWorkflowDescription(e.target.value)}
                                            className="w-full h-11 px-4 bg-white border-gray-200 rounded-lg focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-id" className="text-sm font-medium text-gray-700">
                                            Assign to Project <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                            <SelectTrigger id="project-id" className="w-full h-11 px-4 bg-white border-gray-200 rounded-lg focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all">
                                                <SelectValue placeholder="Select Project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">— Select a project —</SelectItem>
                                                {projects.map((p) => (
                                                    <SelectItem key={p.id} value={p.id!}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Visibility (local only, for UI purposes) */}
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <Label className="text-sm font-medium text-gray-700">Visibility</Label>
                                    <RadioGroup
                                        value={visibility}
                                        onValueChange={(v) => setVisibility(v as any)}
                                        className="space-y-3 mt-3"
                                    >
                                        {[
                                            { value: "private", icon: <Lock className="w-4 h-4 text-gray-400" />, label: "Private" },
                                            { value: "team", icon: <Users className="w-4 h-4 text-gray-400" />, label: "Teams" },
                                            { value: "workspace", icon: <Building2 className="w-4 h-4 text-gray-400" />, label: "Everyone from Workspace" },
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-3">
                                                <RadioGroupItem value={opt.value} id={opt.value} />
                                                <Label htmlFor={opt.value} className="flex items-center gap-2 text-sm font-normal text-gray-700 cursor-pointer">
                                                    {opt.icon} {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                                <Button variant="ghost" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 font-medium">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateWorkflow}
                                    disabled={!workflowName.trim() || selectedProjectId === "none" || isCreating}
                                    className="bg-[#001F3F] text-white hover:bg-[#003366] shadow-lg shadow-blue-900/10 px-6 h-10 rounded-lg transition-all"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Workflow"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Search + View Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="relative w-[320px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search workflows..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 bg-white border-gray-200 rounded-lg focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                                {(["grid", "list"] as const).map((mode) => (
                                    <Button
                                        key={mode}
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewMode(mode)}
                                        className={`h-8 w-8 rounded-md transition-all ${viewMode === mode ? "bg-gray-100 text-[#001F3F]" : "text-gray-400 hover:text-gray-600"}`}
                                    >
                                        {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        )}

                        {/* Grid / List */}
                        {!isLoading && filteredAutomations.length > 0 && (
                            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                                {filteredAutomations.map((automation) => {
                                    const project = projects.find((p) => p.id === automation.projectId);
                                    const updatedAt = automation.updatedAt
                                        ? new Date(automation.updatedAt).toLocaleDateString("en-US", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })
                                        : "—";

                                    return (
                                        <div
                                            key={automation.id}
                                            className={`bg-white border border-gray-200 rounded-2xl p-6 transition-all hover:shadow-md hover:border-blue-100 group cursor-pointer ${viewMode === "list" ? "flex items-center justify-between py-4" : ""}`}
                                            onClick={() =>
                                                automation.id &&
                                                router.push(`/workflows/${automation.id}?projectId=${automation.projectId}`)
                                            }
                                        >
                                            <div className={viewMode === "list" ? "flex items-center gap-6 flex-1" : "space-y-4"}>
                                                {/* Icon + Menu */}
                                                <div className="flex items-center justify-between">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-colors group-hover:bg-blue-100">
                                                        <Zap className="w-6 h-6 text-[#001F3F]" />
                                                    </div>
                                                    {viewMode === "grid" && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full h-8 w-8">
                                                                    <MoreHorizontal className="w-5 h-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-100">
                                                                <DropdownMenuItem
                                                                    onClick={(e) => { e.stopPropagation(); router.push(`/workflows/${automation.id}?projectId=${automation.projectId}`); }}
                                                                    className="cursor-pointer py-2.5"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-2.5 text-gray-500" /> Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => handleDuplicate(e, automation.id!, automation.projectId)}
                                                                    className="cursor-pointer py-2.5"
                                                                >
                                                                    <Copy className="w-4 h-4 mr-2.5 text-gray-500" /> Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => handleDelete(e, automation.id!, automation.projectId)}
                                                                    className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2.5" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>

                                                {/* Name + Project badge */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-[#001F3F] transition-colors">
                                                            {automation.name}
                                                        </h3>
                                                        {project && (
                                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                                                {project.name}
                                                            </span>
                                                        )}
                                                        {/* Active badge */}
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${automation.isActive
                                                                ? "bg-green-50 text-green-600"
                                                                : "bg-gray-100 text-gray-500"
                                                                }`}
                                                        >
                                                            {automation.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-2">
                                                        {automation.description || `Trigger: ${automation.trigger}`}
                                                    </p>
                                                </div>

                                                {/* Footer */}
                                                <div className={`flex items-center justify-between pt-4 ${viewMode === "list" ? "pt-0 border-0" : "border-t border-gray-50"}`}>
                                                    <span className="text-xs text-gray-400 capitalize">
                                                        {automation.trigger?.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-medium">{updatedAt}</span>
                                                </div>
                                            </div>

                                            {/* List: right-side menu */}
                                            {viewMode === "list" && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full h-8 w-8 ml-4">
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-100">
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/workflows/${automation.id}?projectId=${automation.projectId}`); }}
                                                            className="cursor-pointer py-2.5"
                                                        >
                                                            <Edit className="w-4 h-4 mr-2.5 text-gray-500" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleDuplicate(e, automation.id!, automation.projectId)}
                                                            className="cursor-pointer py-2.5"
                                                        >
                                                            <Copy className="w-4 h-4 mr-2.5 text-gray-500" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleDelete(e, automation.id!, automation.projectId)}
                                                            className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2.5" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty search */}
                        {!isLoading && filteredAutomations.length === 0 && automations.length > 0 && (
                            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No workflows found</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your search or create a new workflow.</p>
                                <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-6 h-9 rounded-lg">
                                    Clear search
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowsPage;
