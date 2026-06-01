"use client";

import React from "react";
import { X, Copy, Upload, Repeat, MoveRight, Circle, UserPlus, Trash2, LayoutTemplate, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

interface BulkActionToolbarProps {
    selectedCount: number;
    taskTypes: TaskTypeOption[];
    statusOptions: StatusOption[];
    priorityOptions: PriorityOption[];
    members: MemberOption[];
    eligibleForSubtaskConversion: number;
    onDuplicate: () => void;
    onExport: (format: "pdf" | "csv" | "excel") => void;
    onConvertTo: (taskType: string) => void;
    onConvertToSubtask: () => void;
    onPriority: (priority: string) => void;
    onStatus: (status: string) => void;
    onAssignee: (userId: string) => void;
    onDelete: () => void;
    onClearSelection: () => void;
}

interface TaskTypeOption {
    value: string;
    label: string;
}

interface StatusOption {
    value: string;
    label: string;
    color?: string;
}

interface PriorityOption {
    value: string;
    label: string;
    color?: string;
}

interface MemberOption {
    id: string;
    name: string;
    avatar?: string;
}

function StatusDropdown({
    label,
    icon: Icon,
    statusOptions,
    onSelect,
}: {
    label: string;
    icon: React.FC<{ className?: string }>;
    statusOptions: StatusOption[];
    onSelect: (status: string) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-1 px-4 h-full hover:bg-card/10 transition-colors">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs leading-none">{label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="top"
                align="center"
                className="mb-2 min-w-[160px]"
            >
                {statusOptions.length === 0 && (
                    <DropdownMenuItem disabled>
                        No statuses available
                    </DropdownMenuItem>
                )}
                {statusOptions.map((status) => (
                    <DropdownMenuItem
                        key={status.value}
                        onClick={() => onSelect(status.value)}
                        className="flex items-center gap-2"
                    >
                        {/* Color dot matching TaskTable style */}
                        {status.color && (
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: status.color }}
                            />
                        )}
                        {status.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function PriorityDropdown({
    label,
    icon: Icon,
    priorityOptions,
    onSelect,
}: {
    label: string;
    icon: React.FC<{ className?: string }>;
    priorityOptions: PriorityOption[];
    onSelect: (priority: string) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-1 px-4 h-full hover:bg-card/10 transition-colors">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs leading-none">{label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="top"
                align="center"
                className="mb-2 min-w-[160px]"
            >
                {priorityOptions.length === 0 && (
                    <DropdownMenuItem disabled>
                        No priorities available
                    </DropdownMenuItem>
                )}
                {priorityOptions.map((priority) => (
                    <DropdownMenuItem
                        key={priority.value}
                        onClick={() => onSelect(priority.value)}
                        className="flex items-center gap-2"
                    >
                        {/* Color dot matching TaskTable style */}
                        {priority.color && (
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: priority.color }}
                            />
                        )}
                        {priority.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MemberAvatar({ name, avatar }: { name: string; avatar?: string }) {
    if (avatar) {
        return (
            <img
                src={avatar}
                alt={name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
        );
    }
    return (
        <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(name) }}
        >
            {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
    );
}

export function BulkActionToolbar({
    selectedCount,
    taskTypes,
    statusOptions,
    priorityOptions,
    members,
    eligibleForSubtaskConversion,
    onDuplicate,
    onExport,
    onConvertTo,
    onConvertToSubtask,
    onPriority,
    onStatus,
    onAssignee,
    onDelete,
    onClearSelection,
}: BulkActionToolbarProps) {
    if (selectedCount === 0) return null;

    const handlers: Record<string, () => void> = {
        delete: onDelete,
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-0 bg-primary text-primary-foreground rounded-md shadow-2xl border border-border overflow-hidden h-12">

                {/* Selected count */}
                <div className="flex items-center gap-2 px-4 pr-3 border-r border-white/20 h-full">
                    <span className="text-xs font-medium whitespace-nowrap">
                        {selectedCount} Task{selectedCount > 1 ? "s" : ""} selected
                    </span>
                </div>

                {/* Duplicate */}
                <button
                    onClick={onDuplicate}
                    className="flex flex-col items-center justify-center gap-1 px-4 h-full hover:bg-card/10 transition-colors"
                >
                    <Copy className="h-4 w-4" />
                    <span className="text-xs leading-none">Duplicate</span>
                </button>

                {/* ✅ Export with upward dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center justify-center gap-1 px-4 h-full hover:bg-card/10 transition-colors">
                            <Upload className="h-4 w-4" />
                            <span className="text-xs leading-none">Export</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"         // ← opens upward
                        align="center"
                        className="mb-2 min-w-[130px]"
                    >
                        <DropdownMenuItem onClick={() => onExport("pdf")} className="flex items-center gap-2">
                            <Image src="/images/pdf.svg" alt="PDF" width={20} height={20} />
                            PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("csv")} className="flex items-center gap-2">
                            <Image src="/images/csv.svg" alt="CSV" width={20} height={20} />
                            CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport("excel")} className="flex items-center gap-2">
                            <Image src="/images/excel.svg" alt="Excel" width={20} height={20} />
                            Excel
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* ✅ Convert To with upward dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center justify-center gap-1 px-4 h-full hover:bg-card/10 transition-colors">
                            <Repeat className="h-4 w-4" />
                            <span className="text-xs leading-none">Convert to</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="center"
                        className="mb-2 min-w-[150px]"
                    >
                        {/* Regular task types flat list */}
                        {taskTypes.map((type) => (
                            <DropdownMenuItem
                                key={type.value}
                                onClick={() => onConvertTo(type.value)}
                                className="flex items-center gap-2"
                            >
                                <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                                {type.label}
                            </DropdownMenuItem>
                        ))}

                        {/* ── Subtask option ── */}
                        {eligibleForSubtaskConversion > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={onConvertToSubtask}
                                    className="flex items-center gap-2"
                                >
                                    <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                                    Subtask
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* ✅ Priority picker (upward) */}
                <PriorityDropdown
                    label="Priority"
                    icon={Flag}
                    priorityOptions={priorityOptions}
                    onSelect={onPriority}
                />

                {/* ✅ Status — same picker, kept for now pending client confirmation */}
                <StatusDropdown
                    label="Status"
                    icon={Circle}
                    statusOptions={statusOptions}
                    onSelect={onStatus}
                />

                {/* ✅ Assignee — project members list (upward) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center justify-center gap-1 px-4 h-full hover:bg-card/10 transition-colors">
                            <UserPlus className="h-4 w-4" />
                            <span className="text-xs leading-none">Assignee</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="center"
                        className="mb-2 min-w-[180px] max-h-[260px] overflow-y-auto"
                    >
                        {members.length === 0 && (
                            <DropdownMenuItem disabled>
                                No members available
                            </DropdownMenuItem>
                        )}

                        {/* Unassign option */}
                        {members.length > 0 && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => onAssignee("")}
                                    className="flex items-center gap-2 text-muted-foreground"
                                >
                                    <div className="w-6 h-6 rounded-full border border-dashed border-input flex items-center justify-center flex-shrink-0">
                                        <X className="h-3 w-3" />
                                    </div>
                                    Unassign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}

                        {/* Members list */}
                        {members.map((member) => (
                            <DropdownMenuItem
                                key={member.id}
                                onClick={() => onAssignee(member.id)}
                                className="flex items-center gap-2"
                            >
                                <MemberAvatar name={member.name} avatar={member.avatar} />
                                <span className="truncate">{member.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* ✅ Delete */}
                <button
                    onClick={onDelete}
                    className="flex flex-col items-center justify-center gap-1 px-4 h-full transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-xs leading-none">Delete</span>
                </button>

                {/* Divider + Close */}
                <div className="border-l border-white/20 h-full flex items-center">
                    <button
                        onClick={onClearSelection}
                        className="flex items-center justify-center px-3 h-full hover:bg-card/10 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}