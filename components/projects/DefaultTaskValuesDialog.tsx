// components/projects/DefaultTaskValuesDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, Calendar, User, ChevronDown } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface DefaultTaskValues {
    priority?: string;
    startDate?: string;
    endDate?: string;
    assignee?: string;
}

interface DefaultTaskValuesDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
}

export function DefaultTaskValuesDialog({
    open,
    onClose,
    projectId,
}: DefaultTaskValuesDialogProps) {
    const { getTaskPriorityConfigs } = useProjectsStore();
    const { workspaceMembers } = useWorkspaceStore();

    const priorityConfigs = getTaskPriorityConfigs(projectId);

    const [values, setValues] = useState<DefaultTaskValues>({});
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);

    useEffect(() => {
        if (open) setValues({});
    }, [open]);

    const selectedPriority = priorityConfigs.find(p => p.value === values.priority);
    const selectedMember = workspaceMembers.find(m => m.userId === values.assignee);

    const handleClearAll = () => setValues({});
    const handleSave = () => {
        console.log("Saving default task values:", values);
        onClose();
    };

    // Shared value button class — fixed w-[180px], light gray pill, matches target screenshot
    const valueBtnCls =
        "w-[120px] h-9 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 transition-colors text-xs cursor-pointer";

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-b-[5px] border-b-primary gap-0">

                {/* Header */}
                <DialogHeader className="px-6 p-4">
                    <DialogTitle className="text-sm font-semibold">
                        Set default values for new tasks
                    </DialogTitle>
                </DialogHeader>

                {/* Field rows */}
                <div className="px-6 space-y-0">

                    {/* Priority */}
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>Priority</span>
                        </div>
                        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                            <PopoverTrigger asChild>
                                <button className={valueBtnCls}>
                                    <span
                                        className="flex items-center justify-center w-6 h-6 rounded-full"
                                        style={{
                                            backgroundColor: selectedPriority
                                                ? selectedPriority.color              // solid priority color when selected
                                                : 'text-muted-background'                  // rose-100 muted when unselected
                                        }}
                                    >
                                        <Flag
                                            className="h-3.5 w-3.5"
                                            style={{
                                                color: selectedPriority
                                                    ? 'white'                         // white flag when selected
                                                    : 'text-muted-foreground'               // rose-500 muted flag when unselected
                                            }}
                                        />
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-44 p-1 border-b-[5px] border-b-primary">
                                {priorityConfigs.length === 0 ? (
                                    <p className="text-xs text-muted-foreground px-2 py-1.5">No priorities configured</p>
                                ) : (
                                    priorityConfigs.map(p => (
                                        <button
                                            key={p._id}
                                            onClick={() => {
                                                setValues(prev => ({ ...prev, priority: p.value }));
                                                setPriorityOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted text-left"
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: p.color }}
                                            />
                                            {p.label}
                                        </button>
                                    ))
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Start Date */}
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>Start Date</span>
                        </div>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                            <PopoverTrigger asChild>
                                <button className={valueBtnCls}>
                                    <span className={`w-full text-center ${values.startDate ? "text-foreground" : "text-muted-foreground text-xs"}`}>
                                        {values.startDate
                                            ? format(new Date(values.startDate), "d MMM")
                                            : "Set date"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-auto p-0 border-b-[5px] border-b-primary">
                                <CalendarComponent
                                    mode="single"
                                    selected={values.startDate ? new Date(values.startDate) : undefined}
                                    onSelect={(date) => {
                                        setValues(prev => ({ ...prev, startDate: date?.toISOString() }));
                                        setStartDateOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* End Date */}
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>End Date</span>
                        </div>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                            <PopoverTrigger asChild>
                                <button className={valueBtnCls}>
                                    <span className={`w-full text-center ${values.endDate ? "text-foreground" : "text-muted-foreground text-xs"}`}>
                                        {values.endDate
                                            ? format(new Date(values.endDate), "d MMM")
                                            : "Set date"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-auto p-0 border-b-[5px] border-b-primary">
                                <CalendarComponent
                                    mode="single"
                                    selected={values.endDate ? new Date(values.endDate) : undefined}
                                    onSelect={(date) => {
                                        setValues(prev => ({ ...prev, endDate: date?.toISOString() }));
                                        setEndDateOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Assignee */}
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center gap-3 text-xs font-medium">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>Assignee</span>
                        </div>
                        <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                            <PopoverTrigger asChild>
                                <button className={valueBtnCls}>
                                    {selectedMember ? (
                                        <>
                                            <span className="flex items-center justify-center gap-2 min-w-0 flex-1">
                                                {selectedMember.profilePicture ? (
                                                    <img src={selectedMember.profilePicture} alt={selectedMember.name}
                                                        className="w-6 h-6 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold">
                                                        {selectedMember.name?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        </>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-52 p-1 border-b-[5px] border-b-primary">
                                {workspaceMembers.length === 0 ? (
                                    <p className="text-xs text-muted-foreground px-2 py-1.5">No members found</p>
                                ) : (
                                    workspaceMembers.map(member => (
                                        <button
                                            key={member.userId}
                                            onClick={() => {
                                                setValues(prev => ({ ...prev, assignee: member.userId }));
                                                setAssigneeOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted text-left"
                                        >
                                            {member.profilePicture ? (
                                                <img
                                                    src={member.profilePicture}
                                                    alt={member.name}
                                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                                    {member.name?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <span className="truncate">{member.name}</span>
                                        </button>
                                    ))
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 p-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-muted-foreground"
                    >
                        Clear all
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5"
                        >
                            Save
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}