// components/drafts/DraftDetailPage.tsx
// Full-page standalone version of DraftDetailView for shareable /drafts/[id] URLs.
// Mirrors TaskDetailPage — same layout, adapted for DraftResponse fields.

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    X as XIcon,
    Calendar as CalendarIcon,
    Check,
    User,
    Flag,
    Plus,
    MoreHorizontal,
    Share2,
    History,
    LayoutTemplate,
    Copy,
    ExternalLink,
    ChevronDown,
    GitBranch,
    Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useDraftsStore } from "@/stores/drafts-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore, getDefaultTaskTypeIcon, getProfilePictureUrl } from "@/stores/projects-store";
import { DraftResponse, PatchDraftRequest } from "@/lib/api/drafts-api";
import { cn } from "@/lib/utils";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { toast } from "@/components/ui/sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DraftAttachments } from "./DraftAttachments";
import DiscussionPage from "../disucssions/DiscussionPage";


const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 'sm', src }: { name?: string; size?: 'sm' | 'md' | 'xs'; src?: string | null }) {
    const dim = size === 'xs' ? 'w-5 h-5 text-[10px]' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
    if (!name && !src) {
        return (
            <div className={`${dim} rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0`}>
                <User className="h-3 w-3" />
            </div>
        );
    }

    return (
        <UIAvatar className={cn(dim, "border shrink-0")}>
            {src && <AvatarImage src={src} className="object-cover" />}
            <AvatarFallback
                className="font-semibold text-foreground bg-muted"
                style={{ backgroundColor: name ? getAvatarColor(name) : undefined }}
            >
                {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-3 w-3" />}
            </AvatarFallback>
        </UIAvatar>
    );
}

interface DraftDetailPageProps {
    draft: DraftResponse;
    projectId: string;
    isSubDraft?: boolean;
    onOpenInWorkspace?: () => void;
}

export function DraftDetailPage({
    draft: initialDraft,
    projectId,
    isSubDraft = false,
    onOpenInWorkspace,
}: DraftDetailPageProps) {
    const { drafts, saveDraft, deleteDraft, getSubtasksByDraft } = useDraftsStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
    const { projects, getTaskStatusConfigs, getTaskPriorityConfigs, getMembersByProject } = useProjectsStore();

    // Live draft from store
    const storeDraft = drafts.find((d) => d.id === initialDraft.id);
    const currentDraft = storeDraft ?? initialDraft;
    const subDrafts = getSubtasksByDraft(currentDraft.id);

    const draftProjectId = currentDraft.projectId || projectId;
    const currentProject = projects.find((p) => p.id === draftProjectId);

    const taskStatusConfigs = getTaskStatusConfigs(draftProjectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(draftProjectId);
    const projectMembers = draftProjectId ? getMembersByProject(draftProjectId) : workspaceMembers;

    const mentionableMembers = projectMembers.map((m) => ({
        id: m.userId,
        name: m.name ?? m.email ?? m.userId,
        avatar: getProfilePictureUrl(m.avatar),
    }));

    const getMemberName = (userId?: string) => {
        if (!userId) return null;
        return projectMembers.find((m) => m.userId === userId)?.name || null;
    };

    const getPriorityColor = (val?: string) =>
        taskPriorityConfigs.find((p) => p.value === val)?.color;

    // State
    const [activeTab, setActiveTab] = useState<"properties">("properties");
    const [isAddingSubDraft, setIsAddingSubDraft] = useState(false);
    const [newSubDraftTitle, setNewSubDraftTitle] = useState("");
    const [isReadOnly] = useState(false);
    const [isDraftDetailsExpanded, setIsDraftDetailsExpanded] = useState(true);
    const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);

    const handleUpdateDraft = (updates: Partial<PatchDraftRequest>) => {
        saveDraft({ id: currentDraft.id, workspaceId: currentDraft.workspaceId, ...updates });
    };

    const handleCopyDraftLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/drafts/${currentDraft.id}`);
            toast("success", { title: "Draft link copied!" });
        } catch {
            toast("error", { title: "Failed to copy link" });
        }
    };

    const handleCopyDraftId = async () => {
        try {
            await navigator.clipboard.writeText(currentDraft.id);
            toast("success", { title: "Draft ID copied!" });
        } catch {
            toast("error", { title: "Failed to copy ID" });
        }
    };

    const handleAddSubDraft = async () => {
        if (!newSubDraftTitle.trim()) return;
        const title = newSubDraftTitle;
        setNewSubDraftTitle("");
        setIsAddingSubDraft(false);
        await saveDraft({
            title,
            taskType: "subtask",
            parentTaskId: currentDraft.id,
            workspaceId: currentDraft.workspaceId,
            projectId: currentDraft.projectId,
            status: currentDraft.status,
        });
    };


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Header section (fixed at top) */}
            <div className="flex-none bg-background flex items-center justify-between shrink-0 text-xs">
                <div className="flex items-center gap-2">
                    <Breadcrumbs />
                    {isSubDraft && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            Sub-Draft
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                        Created {currentDraft.createdAt ? format(new Date(currentDraft.createdAt), "MMM d, yyyy") : "—"}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <GitBranch className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-b-4 border-b-[#001F3F]">
                            <DropdownMenuItem onClick={handleCopyDraftLink} className="cursor-pointer">Draft Link</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyDraftId} className="cursor-pointer">Draft ID</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {onOpenInWorkspace && (
                        <Button variant="ghost" size="sm" onClick={onOpenInWorkspace} className="gap-1.5 text-muted-foreground h-8">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Two-column area */}
            <ResizablePanelGroup direction="horizontal" className="flex flex-1 overflow-hidden">
                {/* LEFT PANEL */}
                <ResizablePanel defaultSize={70} className="flex flex-col overflow-hidden bg-background">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                        {/* Draft Title */}
                        <div className="flex items-center shrink-0 flex-wrap gap-3">
                            <h1 className="text-sm leading-tight">{currentDraft.title}</h1>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 h-8 w-auto min-w-[60px] bg-[#001F3F] text-white rounded-md justify-center px-2">
                                    {(() => {
                                        const DefaultIcon = getDefaultTaskTypeIcon();
                                        return (
                                            <>
                                                <DefaultIcon className="w-4 h-4 text-white" />
                                                <span className="text-xs text-white">
                                                    {currentDraft.taskType ? currentDraft.taskType.charAt(0).toUpperCase() + currentDraft.taskType.slice(1) : "Draft"}
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => navigator.clipboard.writeText(currentDraft.id)}
                                    title="Copy full ID"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Description</Label>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <History className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </div>
                            <ProseMirrorEditor
                                initialContent={currentDraft.description || ""}
                                mentionableMembers={mentionableMembers}
                                onBlur={(content) => handleUpdateDraft({ description: content })}
                                placeholder="Add draft description..."
                                className="task-description-editor"
                                editable={!isReadOnly}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {!isSubDraft && subDrafts.length === 0 && !isAddingSubDraft && (
                                <Button variant="secondary" size="sm" className="text-xs rounded h-8" onClick={() => setIsAddingSubDraft(true)}>
                                    <Plus className="h-3 w-3 mr-1" /> Sub-Draft
                                </Button>
                            )}
                        </div>

                        <DiscussionPage
                            entityType="task"
                            entityId={currentDraft.id}
                            mentionableMembers={mentionableMembers}
                        />

                        {/* Sub-Drafts */}
                        {!isSubDraft && (isAddingSubDraft || subDrafts.length > 0) && (
                            <div className="space-y-4 border-t pt-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold">Sub-Drafts</h3>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" className="h-8" onClick={() => setIsAddingSubDraft(true)} disabled={isAddingSubDraft}>
                                            <Plus className="h-3 w-3 mr-1" />Add Sub-Draft
                                        </Button>
                                        {subDrafts.length === 0 && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setIsAddingSubDraft(false); setNewSubDraftTitle(""); }}>
                                                <XIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr className="border-b">
                                                <th className="text-left p-3 text-xs font-medium text-muted-foreground w-10">
                                                    <input type="checkbox" className="rounded border-border" disabled />
                                                </th>
                                                {["Title", "Assignee", "Status", "Start Date", "Due Date"].map((h) => (
                                                    <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground">{h}</th>
                                                ))}
                                                <th className="w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isAddingSubDraft && (
                                                <tr className="bg-blue-50/30 border-b">
                                                    <td className="p-3"><input type="checkbox" disabled className="rounded border-border opacity-50" /></td>
                                                    <td className="p-3">
                                                        <Input
                                                            value={newSubDraftTitle}
                                                            onChange={(e) => setNewSubDraftTitle(e.target.value)}
                                                            placeholder="Type sub-draft title..."
                                                            className="h-8 border-blue-300 focus-visible:ring-blue-500"
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" && newSubDraftTitle.trim()) handleAddSubDraft();
                                                                else if (e.key === "Escape") { setIsAddingSubDraft(false); setNewSubDraftTitle(""); }
                                                            }}
                                                            autoFocus
                                                        />
                                                    </td>
                                                    <td colSpan={4} className="p-3 text-xs text-muted-foreground opacity-50">—</td>
                                                    <td className="p-3">
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={handleAddSubDraft} disabled={!newSubDraftTitle.trim()}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => { setIsAddingSubDraft(false); setNewSubDraftTitle(""); }}>
                                                                <XIcon className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {subDrafts.map((sub) => (
                                                <tr key={sub.id} className="border-b hover:bg-muted/20">
                                                    <td className="p-3"><input type="checkbox" className="rounded border-border" /></td>
                                                    <td className="p-3 text-xs">{sub.title}</td>
                                                    <td className="p-3 text-xs">
                                                        {sub.assigneeId ? (() => {
                                                            const member = projectMembers.find(m => m.userId === sub.assigneeId);
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar name={member?.name} src={getProfilePictureUrl(member?.avatar)} size="xs" />
                                                                </div>
                                                            );
                                                        })() : <span className="text-xs text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="p-3 text-xs">
                                                        {sub.status
                                                            ? <span className="px-2 py-1 rounded text-xs bg-muted">{sub.status}</span>
                                                            : <span className="text-xs text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground">
                                                        {sub.startDate ? format(new Date(sub.startDate), "MMM dd, yyyy") : "—"}
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground">
                                                        {sub.dueDate ? format(new Date(sub.dueDate), "MMM dd, yyyy") : "—"}
                                                    </td>
                                                    <td className="p-3">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => deleteDraft(sub.id, currentDraft.workspaceId)}
                                                                    className="text-red-600"
                                                                >
                                                                    Delete Sub-Draft
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            ))}
                                            {subDrafts.length === 0 && !isAddingSubDraft && (
                                                <tr>
                                                    <td colSpan={7} className="p-8 text-center">
                                                        <p className="text-xs text-muted-foreground">No sub-drafts added yet</p>
                                                        <Button variant="link" size="sm" className="text-xs" onClick={() => setIsAddingSubDraft(true)}>
                                                            Add your first sub-draft
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {isAddingSubDraft && (
                                    <p className="text-xs text-muted-foreground">
                                        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to save or{" "}
                                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-[2px] bg-muted hover:bg-muted-foreground/50 transition-all" />

                {/* RIGHT SIDEBAR */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={45} className="flex flex-col shrink-0 border-l">
                    <div className="bg-muted p-2 flex items-center gap-1">
                        <button
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#001F3F] text-white shadow-sm"
                            data-testid="draft-detail-tab-properties"
                        >
                            Properties
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                            {/* Draft Details collapsible section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold">Draft Details</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setIsDraftDetailsExpanded(!isDraftDetailsExpanded)}
                                    >
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isDraftDetailsExpanded ? "rotate-180" : "rotate-0")} />
                                    </Button>
                                </div>

                                <div className={cn(
                                    "transition-all duration-300 ease-in-out overflow-hidden space-y-1",
                                    isDraftDetailsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
                                )}>
                                    {/* STATUS */}
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-muted-foreground flex items-center gap-2 text-sm shrink-0">
                                            <Activity className="h-4 w-4" /> Status
                                        </Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm" className={cn("h-8 px-3 hover:bg-muted text-xs", !currentDraft.status && "text-muted-foreground")}>
                                                    {currentDraft.status ? (() => {
                                                        const s = taskStatusConfigs.find((x) => x.value === currentDraft.status);
                                                        return (
                                                            <span className="flex items-center gap-1.5">
                                                                {s && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />}
                                                                {s?.label || currentDraft.status}
                                                            </span>
                                                        );
                                                    })() : "—"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleUpdateDraft({ status: undefined })}>Clear</DropdownMenuItem>
                                                <Separator className="my-1" />
                                                {taskStatusConfigs.map((s) => (
                                                    <DropdownMenuItem key={s._id} onSelect={() => handleUpdateDraft({ status: s.value })}>
                                                        <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                                        {s.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* PRIORITY */}
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-muted-foreground flex items-center gap-2 text-sm shrink-0">
                                            <Flag className="h-4 w-4" /> Priority
                                        </Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm" className={cn("h-8 px-3 text-xs border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 dark:hover:bg-blue-900/40", !currentDraft.priority && "text-blue-400 dark:text-blue-500/70")}>
                                                    {currentDraft.priority ? (
                                                        <span className="flex items-center gap-1.5">
                                                            {getPriorityColor(currentDraft.priority) && (
                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPriorityColor(currentDraft.priority) }} />
                                                            )}
                                                            {taskPriorityConfigs.find((p) => p.value === currentDraft.priority)?.label || currentDraft.priority}
                                                        </span>
                                                    ) : "—"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleUpdateDraft({ priority: undefined })}>Clear</DropdownMenuItem>
                                                <Separator className="my-1" />
                                                {taskPriorityConfigs.map((p) => (
                                                    <DropdownMenuItem key={p._id} onSelect={() => handleUpdateDraft({ priority: p.value })}>
                                                        <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }} />
                                                        {p.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* START DATE */}
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                            <CalendarIcon className="h-4 w-4" /> Start
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="secondary" size="sm" className={cn("h-8 px-3 font-normal text-xs border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 dark:hover:bg-blue-900/40", !currentDraft.startDate && "text-blue-400 dark:text-blue-500/70")}>
                                                    {currentDraft.startDate ? format(new Date(currentDraft.startDate), "PP") : "—"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={currentDraft.startDate ? new Date(currentDraft.startDate) : undefined}
                                                    onSelect={(d) => {
                                                        if (d) {
                                                            const updates: Partial<PatchDraftRequest> = { startDate: format(d, "yyyy-MM-dd") };
                                                            if (currentDraft.dueDate && new Date(currentDraft.dueDate) < d) updates.dueDate = undefined;
                                                            handleUpdateDraft(updates);
                                                        }
                                                    }}
                                                    initialFocus
                                                />
                                                {currentDraft.startDate && (
                                                    <div className="p-2 border-t">
                                                        <Button variant="ghost" size="sm" className="w-full text-xs text-red-500" onClick={() => handleUpdateDraft({ startDate: undefined })}>
                                                            Clear date
                                                        </Button>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* DUE DATE */}
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                            <CalendarIcon className="h-4 w-4" /> Due
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="secondary" size="sm" className={cn("h-8 px-3 font-normal text-xs border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 dark:hover:bg-blue-900/40", !currentDraft.dueDate && "text-blue-400 dark:text-blue-500/70")}>
                                                    {currentDraft.dueDate ? format(new Date(currentDraft.dueDate), "PP") : "—"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={currentDraft.dueDate ? new Date(currentDraft.dueDate) : undefined}
                                                    onSelect={(d) => { if (d) handleUpdateDraft({ dueDate: format(d, "yyyy-MM-dd") }); }}
                                                    disabled={(date) => (currentDraft.startDate ? date < new Date(new Date(currentDraft.startDate).setHours(0, 0, 0, 0)) : false)}
                                                    initialFocus
                                                />
                                                {currentDraft.dueDate && (
                                                    <div className="p-2 border-t">
                                                        <Button variant="ghost" size="sm" className="w-full text-xs text-red-500" onClick={() => handleUpdateDraft({ dueDate: undefined })}>
                                                            Clear date
                                                        </Button>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* ASSIGNEE */}
                                    <div className="flex items-center justify-between py-1">
                                        <Label className="text-muted-foreground flex items-center gap-2 text-xs shrink-0">
                                            <User className="h-4 w-4" /> Assignee
                                        </Label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm" className={cn("h-8 px-3 hover:bg-muted text-xs border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 dark:hover:bg-blue-900/40", !currentDraft.assigneeId && "text-blue-400 dark:text-blue-500/70")}>
                                                    {currentDraft.assigneeId ? (() => {
                                                        const member = projectMembers.find(m => m.userId === currentDraft.assigneeId);
                                                        return (
                                                            <span className="flex items-center gap-1.5">
                                                                <Avatar name={member?.name} src={getProfilePictureUrl(member?.avatar)} size="xs" />
                                                            </span>
                                                        );
                                                    })() : "—"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleUpdateDraft({ assigneeId: undefined })}>Clear</DropdownMenuItem>
                                                <Separator className="my-1" />
                                                {projectMembers.map((m) => (
                                                    <DropdownMenuItem key={m.userId} onSelect={() => handleUpdateDraft({ assigneeId: m.userId })}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar name={m.name} src={getProfilePictureUrl(m.avatar)} size="xs" />
                                                            {m.name}
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>


                            {/* Attachments collapsible section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold">Attachments</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
                                    >
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAttachmentsExpanded ? "rotate-180" : "rotate-0")} />
                                    </Button>
                                </div>

                                <div className={cn(
                                    "transition-all duration-300 ease-in-out overflow-hidden",
                                    isAttachmentsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
                                )}>
                                    <DraftAttachments
                                        draftId={currentDraft.id}
                                        attachments={currentDraft.attachments ?? []}
                                        workspaceId={currentDraft.workspaceId}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
