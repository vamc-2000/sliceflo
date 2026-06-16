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
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
                <div className="text-center max-w-2xl px-8">
                    <h1 className="text-[32px] font-bold text-foreground mb-3">Workflows</h1>
                    <p className="text-muted-foreground text-[16px] mb-12">
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
                        <div className="bg-card rounded-2xl p-8 border border-border">
                            <h2 className="text-[24px] font-semibold text-foreground mb-2">
                                Automate your team's work with powerful workflows
                            </h2>
                            <p className="text-muted-foreground text-[15px] mb-6">
                                Create intelligent workflows to streamline processes, set automated actions, and supercharge productivity.
                            </p>
                            <Button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-[15px] font-semibold rounded-lg shadow-md cursor-pointer"
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
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="px-8 py-5 bg-card border-b border-border flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage and automate your team&apos;s processes</p>
                </div>
                {!showCreateForm && (
                    <Button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 h-10 rounded-lg shadow-sm font-semibold flex items-center gap-2 cursor-pointer"
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
                        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                            <div className="px-8 py-6 border-b border-border">
                                <h2 className="text-xl font-bold text-foreground">New Workflow</h2>
                            </div>
                            <div className="px-8 py-6 space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="workflow-name" className="text-sm font-medium text-foreground">
                                        Workflow name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="workflow-name"
                                        placeholder="e.g. Auto-assign on task creation"
                                        value={workflowName}
                                        onChange={(e) => setWorkflowName(e.target.value)}
                                        className="w-full h-11 px-4 bg-background border-border rounded-lg focus:border-primary focus:ring-0 transition-all text-foreground"
                                        autoFocus
                                    />
                                </div>

                                {/* Description + Project */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="workflow-desc" className="text-sm font-medium text-foreground">
                                            Description
                                        </Label>
                                        <Input
                                            id="workflow-desc"
                                            placeholder="Brief description"
                                            value={workflowDescription}
                                            onChange={(e) => setWorkflowDescription(e.target.value)}
                                            className="w-full h-11 px-4 bg-background border-border rounded-lg focus:border-primary focus:ring-0 transition-all text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project-id" className="text-sm font-medium text-foreground">
                                            Assign to Project <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                            <SelectTrigger id="project-id" className="w-full h-11 px-4 bg-background border-border rounded-lg text-foreground focus:border-primary focus:ring-0 transition-all">
                                                <SelectValue placeholder="Select Project" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border border-border text-popover-foreground">
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
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <Label className="text-sm font-medium text-foreground">Visibility</Label>
                                    <RadioGroup
                                        value={visibility}
                                        onValueChange={(v) => setVisibility(v as any)}
                                        className="space-y-3 mt-3"
                                    >
                                        {[
                                            { value: "private", icon: <Lock className="w-4 h-4 text-muted-foreground" />, label: "Private" },
                                            { value: "team", icon: <Users className="w-4 h-4 text-muted-foreground" />, label: "Teams" },
                                            { value: "workspace", icon: <Building2 className="w-4 h-4 text-muted-foreground" />, label: "Everyone from Workspace" },
                                        ].map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-3">
                                                <RadioGroupItem value={opt.value} id={opt.value} />
                                                <Label htmlFor={opt.value} className="flex items-center gap-2 text-sm font-normal text-foreground cursor-pointer">
                                                    {opt.icon} {opt.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-secondary/30 border-t border-border flex items-center justify-end gap-3">
                                <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground hover:text-foreground hover:bg-accent font-medium cursor-pointer">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateWorkflow}
                                    disabled={!workflowName.trim() || selectedProjectId === "none" || isCreating}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10 rounded-lg transition-all cursor-pointer"
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search workflows..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 bg-background border-border text-foreground rounded-lg focus:border-primary focus:ring-0 transition-all"
                                />
                            </div>
                            <div className="flex items-center bg-card border border-border rounded-lg p-1">
                                {(["grid", "list"] as const).map((mode) => (
                                    <Button
                                        key={mode}
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewMode(mode)}
                                        className={`h-8 w-8 rounded-md transition-all cursor-pointer ${viewMode === mode ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        {mode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                                            className={`bg-card border border-border rounded-2xl p-6 transition-all hover:shadow-md hover:border-primary/20 group cursor-pointer ${viewMode === "list" ? "flex items-center justify-between py-4" : ""}`}
                                            onClick={() =>
                                                automation.id &&
                                                router.push(`/workflows/${automation.id}?projectId=${automation.projectId}`)
                                            }
                                        >
                                            <div className={viewMode === "list" ? "flex items-center gap-6 flex-1" : "space-y-4"}>
                                                {/* Icon + Menu */}
                                                <div className="flex items-center justify-between">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                                                        <Zap className="w-6 h-6 text-primary" />
                                                    </div>
                                                    {viewMode === "grid" && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8 cursor-pointer">
                                                                    <MoreHorizontal className="w-5 h-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border border-border bg-popover text-popover-foreground p-1">
                                                                <DropdownMenuItem
                                                                    onClick={(e) => { e.stopPropagation(); router.push(`/workflows/${automation.id}?projectId=${automation.projectId}`); }}
                                                                    className="cursor-pointer py-2.5 hover:bg-accent hover:text-accent-foreground"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-2.5 text-muted-foreground" /> Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => handleDuplicate(e, automation.id!, automation.projectId)}
                                                                    className="cursor-pointer py-2.5 hover:bg-accent hover:text-accent-foreground"
                                                                >
                                                                    <Copy className="w-4 h-4 mr-2.5 text-muted-foreground" /> Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => handleDelete(e, automation.id!, automation.projectId)}
                                                                    className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 hover:bg-accent"
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
                                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                            {automation.name}
                                                        </h3>
                                                        {project && (
                                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">
                                                                {project.name}
                                                            </span>
                                                        )}
                                                        {/* Active badge */}
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${automation.isActive
                                                                ? "bg-green-500/10 text-green-500"
                                                                : "bg-secondary text-muted-foreground"
                                                                }`}
                                                        >
                                                            {automation.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {automation.description || `Trigger: ${automation.trigger}`}
                                                    </p>
                                                </div>

                                                {/* Footer */}
                                                <div className={`flex items-center justify-between pt-4 ${viewMode === "list" ? "pt-0 border-0" : "border-t border-border"}`}>
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {automation.trigger?.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground font-medium">{updatedAt}</span>
                                                </div>
                                            </div>

                                            {/* List: right-side menu */}
                                            {viewMode === "list" && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8 ml-4 cursor-pointer">
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border border-border bg-popover text-popover-foreground p-1">
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/workflows/${automation.id}?projectId=${automation.projectId}`); }}
                                                            className="cursor-pointer py-2.5 hover:bg-accent hover:text-accent-foreground"
                                                        >
                                                            <Edit className="w-4 h-4 mr-2.5 text-muted-foreground" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleDuplicate(e, automation.id!, automation.projectId)}
                                                            className="cursor-pointer py-2.5 hover:bg-accent hover:text-accent-foreground"
                                                        >
                                                            <Copy className="w-4 h-4 mr-2.5 text-muted-foreground" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleDelete(e, automation.id!, automation.projectId)}
                                                            className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 hover:bg-accent"
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
                            <div className="bg-card border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">No workflows found</h3>
                                <p className="text-muted-foreground mt-1">Try adjusting your search or create a new workflow.</p>
                                <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-6 h-9 rounded-lg cursor-pointer">
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
