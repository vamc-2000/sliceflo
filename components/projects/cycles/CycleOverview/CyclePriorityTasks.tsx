"use client";

import React, { useState } from "react";
import { LayoutList, Plus } from "lucide-react";
import { TaskTable } from "@/components/projects/views/list-view/TaskTable";
import { Task } from "@/types/task.types";
import { useTasksStore } from "@/stores/tasks-store";
import { Button } from "@/components/ui/button";
import LinkCycleTasksDialog from "../LinkCycleTasksDialog";
import { QuickTaskCreation } from "../../QuickTaskCreation";

interface CyclePriorityTasksProps {
    isEmpty: boolean;
    projectId: string;
    tasks: Task[];
    cycleId?: string;
}

export function CyclePriorityTasks({ isEmpty, projectId, tasks, cycleId }: CyclePriorityTasksProps) {
    const { columnConfigs, addTask } = useTasksStore();
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [quickTaskOpen, setQuickTaskOpen] = useState(false);

    // Filter for Priority Tasks (e.g., non-low priority)
    const priorityTasks = tasks.filter(t =>
        t.priority?.toLowerCase() !== 'low'
    );

    const handleCreateTask = async (taskData: any) => {
        await addTask({
            ...taskData,
            startDate: taskData.startDate.toISOString(),
            endDate: taskData.endDate?.toISOString(),
            cycleId: cycleId || null,
            relationships: [],
            attachmentIds: [],
            labelIds: [],
            customFieldValues: {},
        });
        setQuickTaskOpen(false);
    };

    const handleCreateNewTaskClick = () => {
        setLinkDialogOpen(false);
        setQuickTaskOpen(true);
    };

    const isPriorityEmpty = priorityTasks.length === 0;

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Priority Tasks</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                        {priorityTasks.length} tasks
                    </span>
                    <Button
                        size="sm"
                        className="bg-[#001F3F] text-white hover:bg-[#002B5C] text-xs h-8 px-4 shadow-sm rounded-md"
                        onClick={() => setLinkDialogOpen(true)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add existing tasks</span>
                    </Button>
                </div>
            </div>

            {isPriorityEmpty ? (
                <div className="bg-[#F8F9FB] rounded-md p-6 flex flex-col min-h-[240px] border-b-4 border-gray-300 relative overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4">
                            <LayoutList className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
                        </div>
                        <p className="text-gray-400 text-xs max-w-[280px] mb-4">
                            Add or mark tasks as priority to track them here.
                        </p>
                        <Button
                            size="sm"
                            className="bg-[#001F3F] text-white hover:bg-[#002B5C] text-xs h-8 px-4 shadow-sm rounded-md"
                            onClick={() => setLinkDialogOpen(true)}
                        >
                            Add existing tasks
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto max-h-[500px] custom-scrollbar">
                    <TaskTable
                        groupId="priority-tasks"
                        projectId={projectId}
                        filteredTasks={priorityTasks}
                        hideFields={[]}
                        columnConfigs={columnConfigs}
                        displayOptions={{
                            collapsedSubtasks: false,
                            closedTasks: false,
                            wrapText: false,
                            subtaskParentId: false
                        }}
                        groupName="Priority Tasks"
                        groupColor="#3B82F6"
                        defaultCycleId={cycleId}
                    />
                </div>
            )}

            {cycleId && (
                <LinkCycleTasksDialog
                    open={linkDialogOpen}
                    onClose={() => setLinkDialogOpen(false)}
                    projectId={projectId}
                    cycleId={cycleId}
                    onCreateNewTaskClick={handleCreateNewTaskClick}
                />
            )}

            <QuickTaskCreation
                open={quickTaskOpen}
                onClose={() => setQuickTaskOpen(false)}
                projectId={projectId}
                selectedDate={new Date()}
                onCreateTask={handleCreateTask}
            />
        </div>
    );
}
