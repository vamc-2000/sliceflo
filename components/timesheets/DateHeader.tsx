"use client";

import { useState, useMemo, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WeekCalendar } from "./DateHeader/WeekCalendar";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { MyTimesheetView } from "@/app/(pages)/timesheet/create/page";
import { AddApproverDropdown } from "./TimeSheets/AddApproverDropdown";
import SendForApprovalDialog from "./TimeEntries/SendForApprovalDialog";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, getWeek } from "date-fns";

interface DateHeaderProps {
    onAddEntry?: () => void;
    selectedWeek: { start: Date; end: Date };
    setSelectedWeek: (week: { start: Date; end: Date }) => void;
    myView: MyTimesheetView;
}

export function DateHeader({ onAddEntry, selectedWeek, setSelectedWeek, myView }: DateHeaderProps) {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
    const [openApproval, setOpenApproval] = useState(false);

    const { timesheets, fetchUserApprovers, selectedUserApprovers } = useTimesheetStore();
    const { workspaceMembers } = useWorkspaceStore();
    const { user } = useAuthStore();

    const userId = timesheets.find(
        t => t.weekStart === format(selectedWeek.start, "yyyy-MM-dd")
    )?.userId || timesheets[0]?.userId || user?.id || "";

    const getInitials = (name?: string) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
        return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    };

    useEffect(() => {
        if (userId) {
            fetchUserApprovers(userId);
        }
    }, [userId, fetchUserApprovers]);

    const approversCount = useMemo(() => {
        if (!userId) return 0;

        if (selectedUserApprovers && selectedUserApprovers.userId === userId) {
            const count = selectedUserApprovers.approvers?.length || selectedUserApprovers.timesheetApprovers?.length || 0;
            if (count > 0) return count;
        }

        if (!selectedWeek) return 0;

        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");
        const weekEntries = timesheets.filter(t => t.weekStart === weekStartStr);
        const approverIds = weekEntries.find(t => t.approverIds?.length > 0)?.approverIds;

        if (approverIds && approverIds.length > 0) {
            return approverIds.length;
        }

        return 0;
    }, [selectedWeek, timesheets, selectedUserApprovers, userId]);

    const weekStatus = useMemo(() => {
        if (!selectedWeek) return "Draft";
        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");
        const weekEntries = timesheets.filter(t => t.weekStart === weekStartStr);
        if (weekEntries.length === 0) return "Draft";
        
        // Priority: Approved > Pending > Rejected > Draft
        if (weekEntries.some(e => e.status === "Approved")) return "Approved";
        if (weekEntries.some(e => e.status === "Pending")) return "Pending";
        if (weekEntries.some(e => e.status === "Rejected")) return "Rejected";
        
        return "Draft";
    }, [selectedWeek, timesheets]);

    const isFrozen = useMemo(() => {
        if (!selectedWeek) return false;
        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");
        const weekEntries = timesheets.filter(t => t.weekStart === weekStartStr);
        if (weekEntries.length === 0) return false;
        
        // Disable buttons ONLY if every entry in the week is either "Pending" (without rejectedAt) or "Approved"
        return weekEntries.every(e => 
            (e.status === "Pending" && !e.rejectedAt) || e.status === "Approved"
        );
    }, [selectedWeek, timesheets]);

    const weekNumber = useMemo(() => {
        if (!selectedWeek) return null;
        return getWeek(selectedWeek.start, {
            weekStartsOn: 1,        // Monday
            firstWeekContainsDate: 4,
        });
    }, [selectedWeek]);

    const currentApprovers = useMemo(() => {
        if (!userId) return [];

        if (
            selectedUserApprovers &&
            selectedUserApprovers.userId === userId &&
            selectedUserApprovers.approvers?.length > 0
        ) {
            return selectedUserApprovers.approvers.map((approver) => {
                const member = workspaceMembers.find((m) => m.userId === approver.id);

                return member
                    ? member
                    : {
                        userId: approver.id,
                        name: approver.name,
                        email: approver.email,
                        profilePicture: approver.profilePictureUrl ?? approver.profilePicture,
                        role: approver.jobRole ?? "Member",
                    };
            });
        }

        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");
        const weekEntries = timesheets.filter((t) => t.weekStart === weekStartStr);

        const approverIds = Array.from(
            new Set(weekEntries.flatMap((t) => t.approverIds ?? []))
        );

        return approverIds
            .map((id) => workspaceMembers.find((m) => m.userId === id))
            .filter(Boolean);
    }, [userId, selectedUserApprovers, workspaceMembers, selectedWeek, timesheets]);

    const isResend = useMemo(() => {
        if (!selectedWeek) return false;
        const weekStartStr = format(selectedWeek.start, "yyyy-MM-dd");
        const weekEntries = timesheets.filter(t => t.weekStart === weekStartStr);
        return weekEntries.some(e => e.status === "Rejected" || !!e.rejectedAt);
    }, [selectedWeek, timesheets]);

    const formatShortDate = (date: Date) =>
        new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        }).format(date);

    const shiftWeek = (direction: "prev" | "next") => {

        const delta = direction === "next" ? 7 : -7;

        const newStart = new Date(selectedWeek.start);
        newStart.setDate(newStart.getDate() + delta);

        const newEnd = new Date(selectedWeek.end);
        newEnd.setDate(newEnd.getDate() + delta);

        setSelectedWeek({ start: newStart, end: newEnd });
    };

    const today = new Date();

    return (
        <div data-testid="date-header-container" className="flex items-center justify-between bg-background px-6 py-1">
            {/* Left */}
            <div className="flex items-center gap-1.5 text-foreground">
                {/* <span className="text-[15px] font-medium mr-1">
                    {weekNumber ? `Week ${weekNumber}` : ""}
                </span> */}
                {/* Left chevron */}
                <button
                    data-testid="btn-prev-week"
                    onClick={() => shiftWeek("prev")}
                    disabled={!selectedWeek}
                    className="p-0.5 disabled:opacity-40 cursor-pointer "
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Date text → opens calendar */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button data-testid="btn-select-week" className="font-medium px-1 cursor-pointer ">
                            {selectedWeek
                                ? `${formatShortDate(selectedWeek.start)} - ${formatShortDate(selectedWeek.end)}`
                                : "Select week"}
                        </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-3 " align="start">
                        <WeekCalendar
                            selectedYear={currentYear}
                            selectedWeek={selectedWeek}
                            onWeekSelect={(week) => {
                                setSelectedWeek(week);
                                setCurrentYear(week.start.getFullYear());
                            }}
                        />

                    </PopoverContent>
                </Popover>

                {/* Right chevron */}
                <button
                    data-testid="btn-next-week"
                    onClick={() => shiftWeek("next")}
                    disabled={!selectedWeek}
                    className="p-0.5 disabled:opacity-40 cursor-pointer "
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {weekNumber && (
                    <span className="text-[15px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Week {weekNumber}
                    </span>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                {/* Approver section — always opens the same dropdown */}
                <AddApproverDropdown
                    userId={userId}
                    trigger={
                        <Button
                            data-testid="btn-approvers"
                            variant="ghost"
                            // disabled={isFrozen}
                            className="bg-muted text-foreground hover:bg-muted/80 h-10 px-4 flex items-center gap-3 cursor-pointer rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Users className="h-5 w-5 text-foreground" strokeWidth={2} />
                            <span className="text-[15px] font-medium text-foreground">Approvers</span>
                            <span className="text-[15px] font-medium text-foreground ml-1">{approversCount}</span>
                        </Button>
                    }
                />

                {/* Conditional action button */}
                {myView === "timesheet" && (
                    <Button
                        data-testid="btn-add-entry"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 py-5 px-5! cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onAddEntry}
                        disabled={isFrozen}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Entry
                    </Button>
                )}

                {myView === "clipboard" && (
                    <Button
                        data-testid="btn-send-approval"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 py-5 px-5! cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setOpenApproval(true)}
                        disabled={isFrozen}
                    >
                        {isResend ? "Resend for Approval" : "Send for approval"}
                    </Button>
                )}
            </div>
            <SendForApprovalDialog
                open={openApproval}
                onClose={() => setOpenApproval(false)}
                selectedWeek={selectedWeek}
                onSend={() => {
                    setOpenApproval(false);

                    // 🔹 API / store logic goes here
                    // submitTimesheet(selectedWeek);
                }}
            />

        </div>
    );
}