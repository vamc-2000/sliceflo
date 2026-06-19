// components/timesheet/AddTimesheetEntryModal.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, ChevronDown, CirclePlay, Clock, Clock7, Loader2 } from "lucide-react";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarPicker } from "@/components/CalendarPicker";
import { format, startOfWeek } from "date-fns";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { nanoid } from "nanoid";
import ProjectTaskPicker from "./ProjectTaskPicker";
import { cn } from "@/lib/utils";
import { CreateTimesheetRequest, TimesheetWithUser } from "@/types/timesheet.types";
import { toast } from "@/components/ui/sonner";
import { formatTaskId } from "@/utils/task-utils";
import { formatLocalDate, convertUTCToCalendarDate, convertSelectedDateToUTC } from "@/utils/timezone-utils";

const parseLocalDate = (dateString: string) => {
    const dateStr = dateString.split("T")[0];
    const [year, month, dayPart] = dateStr.split("-");
    return new Date(Number(year), Number(month) - 1, Number(dayPart));
};

interface AddTimesheetEntryModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: TimesheetWithUser;
    prefillDate?: Date;
    mode?: "task" | "freetext";
}

export function AddTimesheetEntryModal({
    open,
    onClose,
    initialData,
    prefillDate,
    mode,
}: AddTimesheetEntryModalProps) {
    const { user } = useProfileStore();
    const { projects, fetchProjects } = useProjectsStore();
    const { tasks, fetchTasks } = useTasksStore();
    const { createTimesheet, updateTimesheet, timesheets } = useTimesheetStore();

    const isDateFrozen = React.useCallback((date: Date) => {
        const weekStartStr = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");

        const weekEntries = timesheets.filter(t => t.weekStart === weekStartStr);
        if (weekEntries.length === 0) return false;

        return weekEntries.every(e =>
            (e.status === "Pending" && !e.rejectedAt) || e.status === "Approved"
        );
    }, [timesheets]);

    const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
    const [selectedTask, setSelectedTask] = useState<string | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [startHour, setStartHour] = useState("09");
    const [startMinute, setStartMinute] = useState("00");
    const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

    const [endHour, setEndHour] = useState("06");
    const [endMinute, setEndMinute] = useState("00");
    const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM");
    const [hasTimeSelected, setHasTimeSelected] = useState(false);
    const [timePopoverOpen, setTimePopoverOpen] = useState(false);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [billable, setBillable] = useState(false);
    const [notes, setNotes] = useState("");
    const [freetext, setFreetext] = useState("");
    const [bOpen, setBOpen] = useState(false);
    const [logHours, setLogHours] = useState(0);
    const [logMinutes, setLogMinutes] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeMode = initialData?.freetext ? "freetext" : (mode || "task");

    React.useEffect(() => {
        if (selectedProject) {
            fetchTasks(selectedProject); // Filters tasks by projectId[file:3]
        }
    }, [selectedProject, fetchTasks]);

    React.useEffect(() => {
        if (open) {
            fetchProjects(); // Fetches from API and populates store
            if (initialData) {
                setSelectedProject(initialData.projectId);
                setSelectedTask(initialData.taskId);
                setSelectedDate(initialData.date ? parseLocalDate(initialData.date) : new Date());
                const hours = Math.floor((initialData.timeSpentMinutes || 0) / 60);
                const minutes = (initialData.timeSpentMinutes || 0) % 60;
                setLogHours(hours);
                setLogMinutes(minutes);
                setNotes(initialData.notes || "");
                setFreetext(initialData.freetext || "");
            } else {
                setSelectedDate(prefillDate ?? new Date());
                setFreetext("");
            }
        }
    }, [open, fetchProjects, initialData, prefillDate]);

    const formatTime = (h: string, m: string, p: string) =>
        `${h}:${m} ${p}`;

    const toMinutes = (h: string, m: string, p: "AM" | "PM") => {
        let hour = Number(h);

        if (p === "AM") {
            hour = hour === 12 ? 0 : hour;
        } else {
            hour = hour === 12 ? 12 : hour + 12;
        }

        return hour * 60 + Number(m);
    };

    const isValidTimeRange = React.useMemo(() => {
        if (!hasTimeSelected) return false;

        const start = toMinutes(startHour, startMinute, startPeriod);
        const end = toMinutes(endHour, endMinute, endPeriod);

        return end > start;
    }, [
        hasTimeSelected,
        startHour,
        startMinute,
        startPeriod,
        endHour,
        endMinute,
        endPeriod,
    ]);

    React.useEffect(() => {
        if (!hasTimeSelected || !isValidTimeRange) return;

        const start = toMinutes(startHour, startMinute, startPeriod);
        const end = toMinutes(endHour, endMinute, endPeriod);
        const diff = end - start;

        setLogHours(Math.floor(diff / 60));
        setLogMinutes(diff % 60);
    }, [
        hasTimeSelected,
        isValidTimeRange,
        startHour,
        startMinute,
        startPeriod,
        endHour,
        endMinute,
        endPeriod,
    ]);

    React.useEffect(() => {
        if (isValidTimeRange) {
            setTimePopoverOpen(false);
        }
    }, [isValidTimeRange]);

    const resetForm = () => {
        setSelectedProject(undefined);
        setSelectedTask(undefined);
        setSelectedDate(new Date());

        setStartHour("09");
        setStartMinute("00");
        setStartPeriod("AM");

        setEndHour("06");
        setEndMinute("00");
        setEndPeriod("PM");

        setHasTimeSelected(false);
        setBillable(false);
        setNotes("");
        setFreetext("");
        setLogHours(0);
        setLogMinutes(0);
    };

    const handleEntry = async () => {
        if (activeMode === "task" && (!selectedProject || !selectedTask)) return;

        const timeSpentMinutes = logHours * 60 + logMinutes;
        if (timeSpentMinutes === 0) return;

        setIsSubmitting(true);
        try {
            // Use Log Time input values (hours + minutes)
            const timeSpentFormatted = (() => {
                const hrs = logHours;
                const mins = logMinutes;
                if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
                if (hrs > 0) return `${hrs}h`;
                if (mins > 0) return `${mins}m`;
                return "0m";
            })();

            const payload: any = {
                date: selectedDate
                    ? format(selectedDate, "yyyy-MM-dd")
                    : format(new Date(), "yyyy-MM-dd"),
                timeSpent: timeSpentFormatted,
            };

            if (activeMode === "freetext") {
                payload.freetext = freetext || undefined;
                payload.notes = notes || freetext || undefined;
            } else {
                payload.notes = notes || undefined;
                payload.taskId = selectedTask!;
                payload.projectId = selectedProject!;
            }

            if (initialData) {
                const success = await updateTimesheet(initialData.id, payload);
                if (success) {
                    toast("success", {
                        title: "Timesheet entry updated successfully",
                    });
                    resetForm();
                    onClose();
                }
            } else {
                const newTimesheet = await createTimesheet(payload);
                if (newTimesheet) {
                    toast("success", {
                        title: "Timesheet entry added successfully",
                    });
                    resetForm();
                    onClose();
                }
            }
        } catch (error) {
            console.error("Failed to create timesheet:", error);
            toast("error", { title: "Failed to create timesheet" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    resetForm();
                    onClose();
                }
            }}
        >
            <DialogContent data-testid="add-timesheet-modal" className="sm:max-w-lg border-0 border-b-[5px] border-primary rounded-lg flex flex-col max-h-[90vh]">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={user?.profilePictureUrl || ""}
                                alt={user?.name || "User"}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <span>{user?.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label>{activeMode === "freetext" ? "Free Text" : "Select Task"}</Label>
                        {activeMode === "freetext" ? (
                            <Textarea
                                value={freetext}
                                onChange={(e) => setFreetext(e.target.value)}
                                placeholder="Enter your free text here...."
                                className="min-h-[60px] border border-input rounded-md bg-background px-3 py-2 text-sm"
                            />
                        ) : (
                            <Popover open={bOpen} onOpenChange={setBOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        data-testid="btn-select-task-modal"
                                        variant="outline"
                                        className="w-full justify-between bg-muted min-w-0 max-w-[calc(100vw-80px)] sm:max-w-[464px] text-sm overflow-hidden whitespace-normal flex items-center shrink"
                                    >
                                        <span className="truncate text-left text-xs flex-1 min-w-0 mr-2 flex items-center gap-1.5" title={
                                            selectedTask
                                                ? tasks.find(t => t.id === selectedTask)?.name
                                                : "Select project & task"
                                        }>
                                            {selectedTask ? (
                                                <>
                                                    {(() => {
                                                        const t = tasks.find(task => task.id === selectedTask);
                                                        const p = projects.find(proj => proj.id === selectedProject);
                                                        if (!t) return null;
                                                        return (
                                                            <>
                                                                {/* <span className="text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded shrink-0">
                                                                    {formatTaskId(p?.slug || "TASK", t.taskNumber)}
                                                                </span> */}
                                                                <span className="truncate text-xs">{t.name}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </>
                                            ) : (
                                                "Select project & task"
                                            )}
                                        </span>
                                        {/* <ChevronDown className="h-4 w-4 opacity-60 shrink-0" /> */}
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 transition-transform opacity-60 shrink-0",
                                                bOpen && "rotate-180"
                                            )}
                                        />
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-116.25 p-0 border-0 border-b-[5px] border-primary rounded-lg ">
                                    <ProjectTaskPicker
                                        selectedProjectId={selectedProject}
                                        selectedTaskId={selectedTask}
                                        onSelect={(projectId, taskId) => {
                                            setSelectedProject(projectId);
                                            setSelectedTask(taskId);
                                            setBOpen(false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    <div className="rounded-md border border-input bg-muted py-1 px-2">
                            <div className="mb-1 flex items-center justify-between rounded-md bg-muted px-1 py-1">
                                {/* Left */}
                                <Label className="whitespace-nowrap text-muted-foreground text-xs">
                                    Log Time
                                </Label>

                                {/* Right */}
                                <div className="flex items-center gap-2">
                                    {/* <Input
                                        className="h-8 w-25 border-muted-foreground bg-background"
                                        placeholder="Hours"
                                    />
                                    <Input
                                        className="h-8 w-25 border-muted-foreground bg-background"
                                        placeholder="Mins"
                                    /> */}

                                    <Input
                                        data-testid="input-log-hours"
                                        type="number"
                                        min={0}
                                        className="h-6 w-25 border-muted-foreground bg-background placeholder:text-xs text-xs"
                                        placeholder="Hours"
                                        value={logHours === 0 ? "" : logHours}
                                        onFocus={() => {
                                            if (logHours === 0) setLogHours(0); // visually cleared via value logic
                                        }}
                                        onBlur={() => {
                                            if (logHours === undefined || logHours === null) {
                                                setLogHours(0);
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLogHours(val === "" ? 0 : Number(val));
                                            setHasTimeSelected(false); // disable start/end logic
                                        }}
                                    />

                                    <Input
                                        data-testid="input-log-minutes"
                                        type="number"
                                        min={0}
                                        max={59}
                                        className="h-6 w-25 border-muted-foreground bg-background placeholder:text-xs text-xs"
                                        placeholder="Mins"
                                        value={logMinutes === 0 ? "" : logMinutes}
                                        onBlur={() => {
                                            if (logMinutes === undefined || logMinutes === null) {
                                                setLogMinutes(0);
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLogMinutes(val === "" ? 0 : Math.min(59, Number(val)));
                                            setHasTimeSelected(false);
                                        }}
                                    />


                                    {/* <Button
                                        variant="outline"
                                        className="h-8 w-9 p-0 bg-background"
                                    >
                                        <CirclePlay className="h-4 w-4 text-muted-foreground" />
                                    </Button> */}
                                </div>
                            </div>

                            <Separator className="bg-border h-1.5 my-1" />

                            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            data-testid="btn-select-date"
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-7 px-3 font-normal hover:bg-muted text-xs flex items-center justify-start gap-2 rounded-md cursor-pointer",
                                                !selectedDate && "text-muted-foreground"
                                            )}
                                        >
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {selectedDate ? (
                                                formatLocalDate(selectedDate)
                                            ) : (
                                                "Select date"
                                            )}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-auto p-2 border-0 border-b-[5px] border-primary" align="start">
                                        <CalendarPicker
                                            selectedDate={selectedDate}
                                            onDateSelect={(date) => {
                                                setSelectedDate(date);
                                                setDatePopoverOpen(false); // CLOSE popover
                                            }}
                                            disabled={isDateFrozen}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            data-testid="btn-select-time-range"
                                            variant="outline"
                                            className={`
                                                h-7 bg-muted text-muted-foreground
                                                flex items-center gap-2 justify-start
                                                transition-all duration-200
                                                ${hasTimeSelected ? "w-53.75 px-3" : "w-7 p-0 justify-center"}
                                            `}
                                        >
                                            <Clock className="h-3 w-3 shrink-0" />
                                            {hasTimeSelected && (
                                                <span className="truncate">
                                                    {formatTime(startHour, startMinute, startPeriod)} -{" "}
                                                    {formatTime(endHour, endMinute, endPeriod)}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-65 p-4 space-y-4" align="start">
                                        {/* START TIME */}
                                        <div className="space-y-2">
                                            <Label className="text-sm">Start time</Label>
                                            <div className="flex gap-2">
                                                <Select value={startHour} onValueChange={(v) => { setStartHour(v); setHasTimeSelected(true); }}>
                                                    <SelectTrigger className="w-17.5">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[...Array(12)].map((_, i) => {
                                                            const h = String(i + 1).padStart(2, "0");
                                                            return (
                                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={startMinute} onValueChange={(v) => { setStartMinute(v); setHasTimeSelected(true); }}>
                                                    <SelectTrigger className="w-17.5">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {["00", "15", "30", "45"].map((m) => (
                                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={startPeriod} onValueChange={(v) => { setStartPeriod(v as "AM" | "PM"); setHasTimeSelected(true); }}>
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AM">AM</SelectItem>
                                                        <SelectItem value="PM">PM</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* END TIME */}
                                        <div className="space-y-2">
                                            <Label className="text-sm">End time</Label>
                                            <div className="flex gap-2">
                                                <Select value={endHour} onValueChange={setEndHour}>
                                                    <SelectTrigger className="w-17.5">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[...Array(12)].map((_, i) => {
                                                            const h = String(i + 1).padStart(2, "0");
                                                            return (
                                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={endMinute} onValueChange={setEndMinute}>
                                                    <SelectTrigger className="w-17.5">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {["00", "15", "30", "45"].map((m) => (
                                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={endPeriod} onValueChange={(v) => setEndPeriod(v as "AM" | "PM")}>
                                                    <SelectTrigger className="w-20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AM">AM</SelectItem>
                                                        <SelectItem value="PM">PM</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                    <div className="space-y-1">
                        <Label>Notes</Label>
                        {/* <Separator className="bg-border h-1.5 my-1" /> */}
                        <ProseMirrorEditor
                            initialContent={notes}
                            onBlur={setNotes}
                            placeholder="Enter your note here...."
                            className="min-h-[10px] border border-input rounded-md bg-background px-3 py-2 text-sm"
                            editable={true}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end -mb-2 mt-4 flex-shrink-0">
                    <Button
                        data-testid="btn-submit-timesheet-entry"
                        variant="outline"
                        disabled={
                            (activeMode === "task" && (!selectedProject || !selectedTask)) ||
                            (activeMode === "task" && (logHours * 60 + logMinutes) === 0) ||
                            (activeMode === "freetext" && !freetext.trim()) ||
                            isSubmitting
                        }
                        onClick={handleEntry}
                        className={`px-10 py-1 transition-colors cursor-pointer text-sm
                            ${(activeMode === "freetext" || selectedProject)
                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground"
                                : "bg-muted text-muted-foreground border-muted-foreground"
                            }
                        `}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting
                            ? initialData
                                ? "Updating..."
                                : "Adding..."
                            : initialData
                                ? "Update Entry"
                                : "Add Entry"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}