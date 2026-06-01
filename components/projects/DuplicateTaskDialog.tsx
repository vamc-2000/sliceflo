// components/DuplicateTaskDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const TASK_DUPLICATE_FIELDS = [
    { id: "task_type", name: "Task Type", col: "left" },
    { id: "due_date", name: "Due date", col: "left" },
    { id: "assignee", name: "Assignee", col: "left" },
    { id: "priority", name: "Priority", col: "left" },
    { id: "attachments", name: "Attachments", col: "right" },
    { id: "custom_field_values", name: "Custom Field Values", col: "right" },
    { id: "relationships", name: "Relationships", col: "right" },
    // { id: "checklists", name: "Checklists", col: "left" },
    // { id: "keep_checked_items", name: "Keep checked items", col: "left", dependsOn: "checklists" },
    // { id: "recurring_settings", name: "Recurring Settings", col: "left" },
    // { id: "followers", name: "Followers", col: "left" },
    // { id: "comments", name: "Comments", col: "right" },
    // { id: "only_assigned_comments", name: "Only Assigned Comments", col: "right", dependsOn: "comments" },
    // { id: "comment_attachments", name: "Comment attachments", col: "right", dependsOn: "comments" },
    // { id: "dependencies", name: "Dependencies", col: "right" },
    // { id: "keep_task_status", name: "Keep Task Status", col: "right" },
] as const;

type FieldId = typeof TASK_DUPLICATE_FIELDS[number]["id"];
type DuplicateMode = "system" | "customize";

interface DuplicateTaskDialogProps {
    open: boolean;
    onClose: () => void;
    originalTaskName: string;
    title?: string;
    task: {
        attachments?: { id: string }[];
        comments?: { id: string }[];
        relationships?: { type: string; targetTaskId: string }[];
        customFieldValues?: Record<string, any>;
    } | null;
    onDuplicate: (newName: string, selectedFieldIds: FieldId[]) => Promise<void>;
}

const DuplicateTaskDialog: React.FC<DuplicateTaskDialogProps> = ({
    open, onClose, originalTaskName, task, title, onDuplicate,
}) => {
    const [newName, setNewName] = useState(originalTaskName);
    const [hasNameChanged, setHasNameChanged] = useState(false);
    const [mode, setMode] = useState<DuplicateMode>("system");
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<FieldId[]>(
        TASK_DUPLICATE_FIELDS.map((f) => f.id)
    );

    useEffect(() => {
        if (open) {
            setNewName(originalTaskName);
            setHasNameChanged(false);
            setMode("system");
            setLoading(false);
            setSelectedIds(TASK_DUPLICATE_FIELDS.map((f) => f.id));
        }
    }, [open, originalTaskName]);

    const allSelected = selectedIds.length === TASK_DUPLICATE_FIELDS.length;

    // const toggleField = (id: FieldId) => {
    //     setSelectedIds((prev) => {
    //         // unchecking checklists → also uncheck keep_checked_items
    //         if (id === "checklists" && prev.includes("checklists")) {
    //             return prev.filter((f) => f !== "checklists" && f !== "keep_checked_items");
    //         }
    //         // unchecking comments → also uncheck only_assigned_comments + comment_attachments
    //         if (id === "comments" && prev.includes("comments")) {
    //             return prev.filter(
    //                 (f) => f !== "comments" && f !== "only_assigned_comments" && f !== "comment_attachments"
    //             );
    //         }
    //         return prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
    //     });
    // };

    const toggleField = (id: FieldId) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSelectedIds(allSelected ? [] : TASK_DUPLICATE_FIELDS.map((f) => f.id));
    };

    const handleDuplicate = async () => {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            const SYSTEM_FIELDS: FieldId[] = ["task_type", "due_date", "assignee", "priority", "custom_field_values"];

            const fields = mode === "system"
                ? SYSTEM_FIELDS
                : selectedIds;
            await onDuplicate(newName.trim(), fields);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const leftFields = TASK_DUPLICATE_FIELDS.filter((f) => f.col === "left");
    const rightFields = TASK_DUPLICATE_FIELDS.filter((f) => f.col === "right");

    const renderCheckbox = (field: typeof TASK_DUPLICATE_FIELDS[number]) => {
        const checked = selectedIds.includes(field.id);
        const disabled = "dependsOn" in field &&
            !selectedIds.includes(field.dependsOn as FieldId);
        return (
            <label
                key={field.id}
                className={cn(
                    "flex cursor-pointer items-center gap-2 text-xs",
                    disabled && "opacity-40 cursor-not-allowed"
                )}
            >
                <div
                    onClick={() => !disabled && toggleField(field.id)}
                    className={cn(
                        "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border",
                        checked && !disabled
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground bg-card"
                    )}
                >
                    {checked && !disabled && (
                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current">
                            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5"
                                fill="none" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
                <span className="truncate">{field.name}</span>
            </label>
        );
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[480px] border-b-[5px] border-b-primary p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {title ?? "Duplicate task"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">New task name</Label>
                            <Input
                                placeholder="Task name"
                                value={newName}
                                onChange={(e) => {
                                    setNewName(e.target.value);
                                    setHasNameChanged(e.target.value !== originalTaskName);
                                }}
                                className="h-10"
                            />
                        </div>

                        {/* Mode toggle */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Choose what to duplicate
                            </Label>
                            <div className="rounded-lg border p-1.5">
                                <div className="grid grid-cols-2 gap-1">
                                    {(["system", "customize"] as DuplicateMode[]).map((m) => (
                                        <Button
                                            key={m}
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setMode(m)}
                                            className={cn(
                                                "h-9 rounded-md px-3 text-xs font-medium capitalize transition-colors",
                                                mode === m
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground "
                                            )}
                                        >
                                            {m === "system" ? "System" : "Customize"}
                                        </Button>
                                    ))}
                                </div>

                                {/* System description */}
                                {mode === "system" && (
                                    <p className="mt-2 px-1 text-xs text-muted-foreground">
                                        All fields including custom fields and settings will be duplicated exactly as is.
                                    </p>
                                )}

                                {/* Customize checklist panel */}
                                {mode === "customize" && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-xs text-muted-foreground">
                                                Select the what you want to duplicate
                                            </span>
                                            <button
                                                type="button"
                                                onClick={toggleAll}
                                                className="flex items-center gap-1.5 text-xs font-medium text-primary"
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 items-center justify-center rounded border",
                                                    allSelected
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-muted-foreground bg-card"
                                                )}>
                                                    {allSelected && (
                                                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current">
                                                            <path d="M1 4l3 3 5-6" stroke="currentColor"
                                                                strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {allSelected ? "Unselect All" : "Select All"}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1">
                                            <div className="space-y-2">{leftFields.map(renderCheckbox)}</div>
                                            <div className="space-y-2">{rightFields.map(renderCheckbox)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between px-6 py-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        onClick={handleDuplicate}
                        disabled={!newName.trim() || loading || !hasNameChanged}
                        className="text-primary-foreground bg-primary hover:bg-primary/90 text-primary-foreground font-medium min-w-[110px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Duplicate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DuplicateTaskDialog;