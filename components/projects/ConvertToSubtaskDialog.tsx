// components/projects/ConvertToSubtaskDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Task } from "@/types/task.types";
import { X, Flag, UserPlus, GitBranch } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface PriorityConfig {
    _id: string;
    value: string;
    label: string;
    color: string;
}

interface Member {
    userId: string;
    name: string;
}

interface ConvertToSubtaskDialogProps {
    open: boolean;
    onClose: () => void;
    taskToConvert: Task | null;
    availableTasks: Task[];
    members: Member[];
    priorityConfigs: PriorityConfig[];
    projectName?: string;
    workspaceName?: string;
    onConfirm: (
        parentTaskId: string,
        updates: {
            name: string;
            priority?: string;
            endDate?: string;
            assignee?: string;
        }
    ) => void;
}

// ── Priority Flag pill ────────────────────────────────────────────────────────
function PriorityFlag({ color }: { color?: string }) {
    const bg = color ?? "#9CA3AF";
    return (
        <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${bg}22`, border: `1.5px solid ${bg}` }}
        >
            <Flag className="h-3 w-3" style={{ color: bg, fill: bg }} />
        </div>
    );
}

// ── Avatar color helper ───────────────────────────────────────────────────────
const AVATAR_COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];
function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ConvertToSubtaskDialog({
    open,
    onClose,
    taskToConvert,
    availableTasks,
    members,
    priorityConfigs,
    projectName = "Project name",
    workspaceName = "Workspace name",
    onConfirm,
}: ConvertToSubtaskDialogProps) {
    const [selectedParentTaskId, setSelectedParentTaskId] = useState("");
    const [name, setName] = useState("");
    const [priority, setPriority] = useState<string | undefined>(undefined);
    const [endDate, setEndDate] = useState<string | undefined>(undefined);
    const [assignee, setAssignee] = useState<string | undefined>(undefined);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

    useEffect(() => {
        if (taskToConvert) {
            setName(taskToConvert.name ?? "");
            setPriority(taskToConvert.priority ?? undefined);
            setEndDate(taskToConvert.endDate ?? undefined);
            setAssignee(taskToConvert.assignee ?? undefined);
        }
        setSelectedParentTaskId("");
    }, [taskToConvert?.id]);

    const handleConfirm = () => {
        if (!selectedParentTaskId || !name.trim()) return;
        onConfirm(selectedParentTaskId, {
            name: name.trim(),
            priority,
            endDate,
            assignee,
        });
        setSelectedParentTaskId("");
    };

    const parentOptions = availableTasks.filter(
        (t) =>
            t.id !== taskToConvert?.id &&  // not the task itself
            !t.parentTaskId                // not already a subtask (can't be a parent)
    );
    const selectedPriority = priorityConfigs.find((p) => p.value === priority);
    const selectedAssignee = members.find((m) => m.userId === assignee);

    if (!taskToConvert) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent className="p-0 gap-0 overflow-hidden rounded-xl border-b-[5px] border-b-primary w-md">

                <VisuallyHidden.Root>
                    <DialogTitle>Convert to Subtask</DialogTitle>
                </VisuallyHidden.Root>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">

                        {/* ✅ Lucide icon replacing the SVG */}
                        <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                        {/* Dynamic: Workspace / Project / Task */}
                        <span className="text-xs text-muted-foreground truncate">
                            <span className="font-medium text-foreground">{workspaceName}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className="font-medium text-foreground">{projectName}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className="font-medium text-foreground">{taskToConvert.name}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 mx-4">
                        {endDate && (
                            <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded">
                                {format(new Date(endDate), "MMM d")}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="px-4 pt-4 space-y-4">

                    {/* Parent task selector */}
                    <Select
                        value={selectedParentTaskId}
                        onValueChange={setSelectedParentTaskId}
                    >
                        <SelectTrigger className="w-full text-xs border-border focus:ring-1 focus:ring-ring">
                            <SelectValue
                                placeholder={
                                    parentOptions.length === 0
                                        ? "No tasks available"
                                        : "Select a parent task..."
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {parentOptions.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Subtask name — pre-filled */}
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Sub task name...."
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && selectedParentTaskId && name.trim())
                                handleConfirm();
                            if (e.key === "Escape") onClose();
                        }}
                        className="border-0 border-b border-border rounded-none shadow-none px-0 focus-visible:ring-0 focus-visible:border-ring text-xs placeholder:text-muted-foreground"
                    />
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">

                        {/* Due Date */}
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-8 text-xs font-medium border",
                                        endDate
                                            ? "border-blue-200 bg-blue-50 text-blue-700"
                                            : "border-border text-muted-foreground"
                                    )}
                                >
                                    {endDate ? format(new Date(endDate), "MMM d, yyyy") : "Set due date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate ? new Date(endDate) : undefined}
                                    onSelect={(date) => {
                                        setEndDate(date?.toISOString());
                                        setIsCalendarOpen(false);
                                    }}
                                    initialFocus
                                />
                                {endDate && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-muted-foreground border-t rounded-none"
                                        onClick={() => {
                                            setEndDate(undefined);
                                            setIsCalendarOpen(false);
                                        }}
                                    >
                                        Clear date
                                    </Button>
                                )}
                            </PopoverContent>
                        </Popover>

                        {/* Priority */}
                        <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0 rounded-full"
                                    title={selectedPriority?.label ?? "No priority"}
                                >
                                    <PriorityFlag color={selectedPriority?.color} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" align="start">
                                <button
                                    onClick={() => { setPriority(undefined); setIsPriorityOpen(false); }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs text-muted-foreground"
                                >
                                    No priority
                                </button>
                                {priorityConfigs.map((p) => (
                                    <button
                                        key={p._id}
                                        onClick={() => { setPriority(p.value); setIsPriorityOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs",
                                            priority === p.value && "bg-muted font-medium"
                                        )}
                                    >
                                        <Flag
                                            className="h-3.5 w-3.5 flex-shrink-0"
                                            style={{ color: p.color, fill: p.color }}
                                        />
                                        {p.label}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>

                        {/* Assignee */}
                        <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0 rounded-full"
                                    title={selectedAssignee?.name ?? "Unassigned"}
                                >
                                    {selectedAssignee ? (
                                        <Avatar className="h-7 w-7">
                                            <AvatarFallback
                                                className="text-primary-foreground text-xs font-semibold"
                                                style={{ backgroundColor: getAvatarColor(selectedAssignee.name) }}
                                            >
                                                {selectedAssignee.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full border border-dashed border-input flex items-center justify-center text-muted-foreground">
                                            <UserPlus className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1" align="start">
                                <button
                                    onClick={() => { setAssignee(undefined); setIsAssigneeOpen(false); }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs text-muted-foreground"
                                >
                                    Unassigned
                                </button>
                                {members.map((m) => (
                                    <button
                                        key={m.userId}
                                        onClick={() => { setAssignee(m.userId); setIsAssigneeOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs",
                                            assignee === m.userId && "bg-muted font-medium"
                                        )}
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback
                                                className="text-primary-foreground text-xs font-semibold"
                                                style={{ backgroundColor: getAvatarColor(m.name) }}
                                            >
                                                {m.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {m.name}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>

                    </div>

                    {/* Create button */}
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedParentTaskId || !name.trim()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 h-8 text-xs rounded-lg"
                    >
                        Create
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}