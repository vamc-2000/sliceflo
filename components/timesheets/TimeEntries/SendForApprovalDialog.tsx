"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { OctagonAlert, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useState, useMemo, useEffect } from "react";
import { format, getWeek } from "date-fns";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { AddApproverDropdown } from "../TimeSheets/AddApproverDropdown";
import { toast } from "@/components/ui/sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
    open: boolean;
    onClose: () => void;
    onSend: () => void;
    selectedWeek: { start: Date; end: Date };
}

export default function SendForApprovalDialog({
    open,
    onClose,
    onSend,
    selectedWeek,
}: Props) {

    const {
        timesheets,
        submitTimesheets,
        isTimesheetsLoading,
        fetchUserApprovers,
        selectedUserApprovers
    } = useTimesheetStore();
    const { tasks } = useTasksStore();
    const { workspaceMembers } = useWorkspaceStore();
    const { user } = useAuthStore();

    const [content, setContent] = useState<string>("");

    const userId = useMemo(() => {
        return timesheets.find(
            t => t.weekStart === format(selectedWeek.start, "yyyy-MM-dd")
        )?.userId || user?.id;
    }, [timesheets, selectedWeek, user]);

    useEffect(() => {
        if (userId && open) {
            fetchUserApprovers(userId);
        }
    }, [userId, open, fetchUserApprovers]);

    const approvers = useMemo(() => {
        if (!selectedWeek) return [];

        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");

        // 1. Try to get from store first (current selection)
        if (selectedUserApprovers && selectedUserApprovers.userId === userId && selectedUserApprovers.approvers.length > 0) {
            return selectedUserApprovers.approvers.map(a => {
                const member = workspaceMembers.find(m => m.userId === a.id);
                return {
                    ...a,
                    userId: a.id,
                    name: a.name || member?.name || "Unknown",
                    profilePicture: a.profilePictureUrl || a.profilePicture || member?.profilePicture || (member as any)?.profilePictureUrl,
                    role: (a as any).jobRole || (a as any).role || (member as any)?.jobRole || (member as any)?.role || "Approver"
                };
            });
        }

        // 2. Fallback to weekly entries
        const weeklyEntries = timesheets.filter(
            (t) => t.weekStart === weekStartStr
        );
        const approverIds =
            weeklyEntries.find((t) => t.approverIds?.length)?.approverIds || [];

        if (approverIds.length > 0) {
            return approverIds
                .map((approverId) => {
                    const member = workspaceMembers.find((member) => member.userId === approverId);
                    if (!member) return null;
                    return {
                        ...member,
                        userId: member.userId,
                        profilePicture: member.profilePicture || (member as any).profilePictureUrl,
                        role: (member as any).jobRole || member.role || "Approver"
                    };
                })
                .filter((m): m is any => !!m);
        }

        return [];
    }, [selectedWeek, timesheets, workspaceMembers, selectedUserApprovers, userId]);

    const handleContentChange = (value: string) => {
        setContent(value);
    };

    const handleSendForApproval = async () => {
        if (!selectedWeek || !userId) return;

        const weekStart = format(selectedWeek.start, "yyyy-MM-dd");

        const success = await submitTimesheets(weekStart, userId);

        if (success) {
            toast("success", { title: "Timesheet submitted successfully" })

            onSend?.();
            onClose();
        } else {
            toast("error", { title: "Timesheet submission failed" })
        }
    };

    const { displayTasks, totalHours } = useMemo(() => {
        if (!selectedWeek) return { displayTasks: [], totalHours: 0 };

        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");
        const weeklyEntries = timesheets.filter((t) => t.weekStart === weekStartStr);

        // Group by taskId
        const groupedTasks = weeklyEntries.reduce((acc, entry) => {
            if (!acc[entry.taskId]) {
                acc[entry.taskId] = 0;
            }
            acc[entry.taskId] += entry.timeSpentMinutes;
            return acc;
        }, {} as Record<string, number>);

        const display = Object.entries(groupedTasks).map(([taskId, minutes]) => {
            const task = tasks.find((t) => t.id === taskId);
            return {
                id: taskId,
                name: task ? task.name : "Unknown Task",
                time: `${(minutes / 60).toFixed(1)}h`,
                minutes,
            };
        });

        const totalMinutes = weeklyEntries.reduce((sum, t) => sum + t.timeSpentMinutes, 0);

        return {
            displayTasks: display,
            totalHours: (totalMinutes / 60).toFixed(1),
        };
    }, [timesheets, tasks, selectedWeek]);

    const weekNumber = selectedWeek
        ? getWeek(selectedWeek.start, {
            weekStartsOn: 1,        // Monday
            firstWeekContainsDate: 4,
        })
        : null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent data-testid="send-for-approval-dialog" className="w-[38vw] sm:max-w-6xl max-w-none p-0 gap-0">
                {/* Header */}
                <VisuallyHidden>
                    <DialogTitle>Send Timesheet for Approval</DialogTitle>
                </VisuallyHidden>
                {/* <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 space-y-0!"> */}
                <div className="flex items-center justify-between px-6 py-2">
                    <div className="flex items-center gap-3">
                        {/* Week badge */}
                        <span data-testid="send-for-approval-week-badge" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-foreground">
                            {weekNumber ? `W${weekNumber}` : "W--"}
                            <OctagonAlert className="h-4 w-4" />
                        </span>

                        {/* Title + hours stacked */}
                        <div className="flex flex-col leading-tight">
                            <h2 className="text-base font-semibold text-gray-900">
                                {weekNumber ? `Week ${weekNumber} Timesheet` : "Weekly Timesheet"}
                            </h2>
                            <span 
                                data-testid="send-for-approval-total-hours"
                                className="inline-flex self-start items-center mt-0.5 px-2 py-0.5 text-xs font-semibold text-foreground bg-orange-500 rounded-md"
                            >
                                {totalHours} h
                            </span>
                        </div>
                    </div>
                    {/* </DialogHeader> */}
                </div>

                {/* Body */}
                <div className="px-6">
                    {/* Tasks */}
                    <div>
                        <h3 className="mb-2 text-sm font-medium text-foreground">
                            Tasks Accomplished
                        </h3>

                        <div data-testid="send-for-approval-tasks-table" className="overflow-hidden rounded-md border">
                            <div className="max-h-38 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-foreground sticky top-0">
                                        <tr>
                                            <th className="border-r px-4 py-1.5 text-center font-medium w-3/4">
                                                Task Name
                                            </th>
                                            <th className="px-4 py-1.5 text-center font-medium w-1/4">
                                                Time
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {displayTasks.map((task) => (
                                            <tr key={task.id} data-testid={`approval-task-row-${task.id}`} className="border-t">
                                                <td className="border-r px-4 py-1.5">{task.name}</td>
                                                <td className="px-4 py-1.5 text-center">{task.time}</td>
                                            </tr>
                                        ))}
                                        {displayTasks.length === 0 && (
                                            <tr data-testid="approval-task-empty-state" className="border-t text-gray-500 font-normal italic">
                                                <td colSpan={2} className="px-4 py-4 text-center">
                                                    No tasks recorded for this week.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Approver */}
                    <div className="mt-2">
                        <h3 className="mb-1 text-sm font-semibold text-gray-900">Approver</h3>

                        <div data-testid="send-for-approval-approver-section" className="rounded-lg border border-gray-200 p-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    {approvers.length > 0 ? (
                                        <TooltipProvider>
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {approvers.map((approver) => (
                                                    <Tooltip key={approver.userId}>
                                                        <TooltipTrigger asChild>
                                                            <div data-testid={`approver-avatar-${approver.userId}`} className="cursor-pointer transition-transform hover:scale-105">
                                                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                                    <AvatarImage
                                                                        src={
                                                                            approver.profilePicture ||
                                                                            approver.profilePictureUrl ||
                                                                            undefined
                                                                        }
                                                                    />

                                                                    <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium text-sm">
                                                                        {(approver.name || approver.email || "?")
                                                                            .split(" ")
                                                                            .map((n: string) => n[0])
                                                                            .join("")
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent
                                                            side="top"
                                                            className="bg-primary text-primary-foreground border-none shadow-lg"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">
                                                                    {approver.name}
                                                                </span>

                                                                <span className="text-xs text-gray-300">
                                                                    {approver.jobRole ||
                                                                        approver.role ||
                                                                        "Approver"}
                                                                </span>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        </TooltipProvider>
                                    ) : (
                                        <div data-testid="approval-no-approver" className="text-sm text-gray-500 italic">
                                            No approver selected
                                        </div>
                                    )}
                                </div>

                                {userId && (
                                    <AddApproverDropdown
                                        userId={userId}
                                        defaultView="select"
                                        trigger={
                                            <Button
                                                data-testid="btn-change-approver"
                                                variant="ghost"
                                                className="h-9 px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-foreground border border-primary/20 rounded-md shadow-sm"
                                            >
                                                {approvers.length > 0 ? "Change Approver" : "Add Approver"}
                                            </Button>
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <h3 className="mb-1 mt-2 text-sm font-semibold text-gray-700">
                            Note for Approver
                        </h3>

                        <div data-testid="approval-note-editor" className="rounded-md border overflow-hidden w-full">
                            <RichTextEditor
                                data-testid="approval-note-editor"
                                value={content}
                                onChange={handleContentChange}
                                placeholder="Enter your message here..."
                                className="w-full min-h-[80px]!"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-2 mb-1">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        className="border-primary text-foreground"
                        data-testid="btn-cancel-send-for-approval"
                    >
                        Cancel
                    </Button>

                    <Button
                        data-testid="btn-send-for-approval"
                        disabled={isTimesheetsLoading || displayTasks.length === 0 || approvers.length === 0}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSendForApproval}
                    >
                        {isTimesheetsLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send for Approval"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
