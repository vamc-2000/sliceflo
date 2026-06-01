// components/drafts/DraftDetailView.tsx
"use client";

import React, { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
    GitBranch,
} from "lucide-react";
import { format } from "date-fns";
import { useDraftsStore } from "@/stores/drafts-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore, getDefaultTaskTypeIcon, getProfilePictureUrl } from "@/stores/projects-store";
import { DraftResponse, PatchDraftRequest } from "@/lib/api/drafts-api";
import { cn } from "@/lib/utils";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { toast } from "@/components/ui/sonner";
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
            <div className={`${dim} rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0`}>
                <User className="h-3 w-3" />
            </div>
        );
    }

    return (
        <UIAvatar className={cn(dim, "border shrink-0")}>
            {src && <AvatarImage src={src} className="object-cover" />}
            <AvatarFallback
                className="font-semibold text-white bg-gray-400"
                style={{ backgroundColor: name ? getAvatarColor(name) : undefined }}
            >
                {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-3 w-3" />}
            </AvatarFallback>
        </UIAvatar>
    );
}

interface DraftDetailViewProps {
    draft: DraftResponse | null;
    isSubDraft?: boolean;
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DraftDetailView({
    draft,
    isSubDraft = false,
    projectId,
    open,
    onOpenChange,
}: DraftDetailViewProps) {
    const { drafts, saveDraft, deleteDraft, getSubtasksByDraft } = useDraftsStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
    const { projects, getTaskStatusConfigs, getTaskPriorityConfigs, getMembersByProject } = useProjectsStore();

    const [activeTab, setActiveTab] = useState<"properties">("properties");
    const [isAddingSubDraft, setIsAddingSubDraft] = useState(false);
    const [newSubDraftTitle, setNewSubDraftTitle] = useState("");
    const [isReadOnly] = useState(false);


    const storeDraft = draft ? drafts.find((d) => d.id === draft.id) : undefined;
    const currentDraft = storeDraft ?? draft;
    const subDrafts = currentDraft ? getSubtasksByDraft(currentDraft.id) : [];

    const draftProjectId = currentDraft?.projectId || projectId;
    const currentProject = projects.find((p) => p.id === draftProjectId);

    const taskStatusConfigs = getTaskStatusConfigs(draftProjectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(draftProjectId);
    const projectMembers = draftProjectId ? getMembersByProject(draftProjectId) : workspaceMembers;

    const mentionableMembers = React.useMemo(() => {
        return projectMembers.map((m) => ({
            id: m.userId,
            name: m.name ?? m.email ?? m.userId,
            avatar: getProfilePictureUrl(m.avatar),
        }));
    }, [projectMembers]);

    if (!draft || !currentDraft) return null;

    const getMemberName = (userId?: string) => {
        if (!userId) return null;
        return projectMembers.find((m) => m.userId === userId)?.name || null;
    };

    const getPriorityColor = (val?: string) =>
        taskPriorityConfigs.find((p) => p.value === val)?.color;

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
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white rounded-l-lg shadow-xl transition-transform duration-300 ease-in-out data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
                    style={{ width: "1050px", maxWidth: "95vw", height: "100%" }}
                >
                    <VisuallyHidden asChild>
                        <div>
                            <DialogPrimitive.Title>Draft Details</DialogPrimitive.Title>
                            <DialogPrimitive.Description>View and manage draft details.</DialogPrimitive.Description>
                        </div>
                    </VisuallyHidden>

                    <div className="flex flex-col h-full w-full overflow-hidden rounded-lg">
                        {/* UNIFIED HEADER */}
                        <div className="px-5 py-2 flex items-center justify-between bg-white shrink-0 text-sm border-b">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 flex items-center gap-1">
                                    <span className="hover:underline cursor-pointer">{currentWorkspace?.name || "Workspace"}</span>
                                    <span>/</span>
                                    <span className="hover:underline cursor-pointer">{currentProject?.name || "Project"}</span>
                                    <span>/</span>
                                    {isSubDraft && currentDraft.parentTaskId && (
                                        <>
                                            <span className="hover:underline cursor-pointer text-gray-500">
                                                {drafts.find((d) => d.id === currentDraft.parentTaskId)?.title ?? "Parent Draft"}
                                            </span>
                                            <span>/</span>
                                        </>
                                    )}
                                    <span className="hover:underline cursor-pointer text-gray-700 font-medium truncate max-w-[160px]">
                                        {currentDraft.title}
                                    </span>
                                </span>
                                {isSubDraft && (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Sub-Draft</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">
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
                                <DialogPrimitive.Close asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                </DialogPrimitive.Close>
                            </div>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Panel */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                    <div className="flex items-center shrink-0 flex-wrap gap-3">
                                        <h1 className="text-4xl font-semibold">{currentDraft.title}</h1>
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
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(currentDraft.id)} title="Copy full ID">
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Description</Label>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <History className="h-3 w-3 text-gray-500" />
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

                                    {!isSubDraft && (isAddingSubDraft || subDrafts.length > 0) && (
                                        <div className="space-y-4 border-t pt-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold">Sub-Drafts</h3>
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
                                                                <input type="checkbox" className="rounded border-gray-300" disabled />
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
                                                                <td className="p-3"><input type="checkbox" disabled className="rounded border-gray-300 opacity-50" /></td>
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
                                                                <td className="p-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                                <td className="p-3 text-sm">{sub.title}</td>
                                                                <td className="p-3 text-sm">
                                                                    {sub.assigneeId ? (() => {
                                                                        const member = projectMembers.find(m => m.userId === sub.assigneeId);
                                                                        return (
                                                                            <div className="flex items-center gap-2">
                                                                                <Avatar name={member?.name} src={getProfilePictureUrl(member?.avatar)} size="xs" />
                                                                            </div>
                                                                        );
                                                                    })() : <span className="text-xs text-muted-foreground">—</span>}
                                                                </td>
                                                                <td className="p-3 text-sm">
                                                                    {sub.status ? <span className="px-2 py-1 rounded text-xs bg-muted">{sub.status}</span> : <span className="text-xs text-muted-foreground">—</span>}
                                                                </td>
                                                                <td className="p-3 text-xs text-muted-foreground">{sub.startDate ? format(new Date(sub.startDate), "MMM dd, yyyy") : "—"}</td>
                                                                <td className="p-3 text-xs text-muted-foreground">{sub.dueDate ? format(new Date(sub.dueDate), "MMM dd, yyyy") : "—"}</td>
                                                                <td className="p-3">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => deleteDraft(sub.id, currentDraft.workspaceId)} className="text-red-600">Delete Sub-Draft</DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {subDrafts.length === 0 && !isAddingSubDraft && (
                                                            <tr>
                                                                <td colSpan={7} className="p-8 text-center">
                                                                    <p className="text-sm text-muted-foreground">No sub-drafts added yet</p>
                                                                    <Button variant="link" size="sm" className="text-xs" onClick={() => setIsAddingSubDraft(true)}>Add your first sub-draft</Button>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {isAddingSubDraft && (
                                                <p className="text-xs text-muted-foreground">Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to save or <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Sidebar */}
                            <div className="w-[320px] flex flex-col shrink-0 border-l">
                                <div className="flex justify-around border-b bg-white shrink-0 p-2">
                                    <Button variant="ghost" size="sm" className="px-4 py-3 font-medium transition-colors underline underline-offset-8 decoration-[#001F3F] text-[#001F3F]">
                                        Properties
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="space-y-1">
                                        {/* STATUS */}
                                        <div className="flex items-center justify-between py-1">
                                            <Label className="text-gray-600 flex items-center gap-2 text-sm shrink-0"><LayoutTemplate className="h-4 w-4" />Status</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="sm" className={cn("h-8 px-3 hover:bg-gray-200 text-xs", !currentDraft.status && "text-gray-400")}>
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
                                            <Label className="text-gray-600 flex items-center gap-2 text-sm shrink-0"><Flag className="h-4 w-4" />Priority</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="sm" className={cn("h-8 px-3 hover:bg-gray-200 text-xs", !currentDraft.priority && "text-gray-400")}>
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
                                            <Label className="text-gray-600 flex items-center gap-2 text-sm shrink-0"><CalendarIcon className="h-4 w-4" />Start Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="secondary" size="sm" className={cn("h-8 px-3 font-normal hover:bg-gray-200 text-xs", !currentDraft.startDate && "text-gray-400")}>
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
                                                            <Button variant="ghost" size="sm" className="w-full text-xs text-red-500" onClick={() => handleUpdateDraft({ startDate: undefined })}>Clear date</Button>
                                                        </div>
                                                    )}
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* DUE DATE */}
                                        <div className="flex items-center justify-between py-1">
                                            <Label className="text-gray-600 flex items-center gap-2 text-sm shrink-0"><CalendarIcon className="h-4 w-4" />Due Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="secondary" size="sm" className={cn("h-8 px-3 font-normal hover:bg-gray-200 text-xs", !currentDraft.dueDate && "text-gray-400")}>
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
                                                            <Button variant="ghost" size="sm" className="w-full text-xs text-red-500" onClick={() => handleUpdateDraft({ dueDate: undefined })}>Clear date</Button>
                                                        </div>
                                                    )}
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* ASSIGNEE */}
                                        <div className="flex items-center justify-between py-1">
                                            <Label className="text-gray-600 flex items-center gap-2 text-sm shrink-0"><User className="h-4 w-4" />Assignee</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="sm" className={cn("h-8 px-3 hover:bg-gray-200 text-xs", !currentDraft.assigneeId && "text-gray-400")}>
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


                                        <Separator className="my-2" />
                                        <DraftAttachments draftId={currentDraft.id} attachments={currentDraft.attachments ?? []} workspaceId={currentDraft.workspaceId} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
