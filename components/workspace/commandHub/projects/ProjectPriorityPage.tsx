"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ellipsis, Plus } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectsStore } from "@/stores/projects-store";
import { toast } from "react-hot-toast";
import AddPriorityModal from "../AddPriorityModal";

interface ProjectPriorityPageProps {
    projectId: string;
}

const ProjectPriorityPage: React.FC<ProjectPriorityPageProps> = ({ projectId }) => {
    const {
        getProjectPriorityConfigs,
        addProjectPriorityConfig,
        updateProjectPriorityConfig,
        deleteProjectPriorityConfig,
    } = useProjectsStore();

    const priorities = getProjectPriorityConfigs(projectId);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);

    // ✅ Matches AddPriorityConfigModal's onSave signature exactly
    const handleSave = async (data: {
        label: string;
        value: string;
        description: string;
        color: string;
        order: number;
    }) => {
        try {
            if (editingPriorityId) {
                await updateProjectPriorityConfig(projectId, editingPriorityId, {
                    label: data.label,
                    value: data.value,
                    description: data.description,
                    color: data.color,
                    order: data.order,
                });
                toast.success("Priority updated");
            } else {
                await addProjectPriorityConfig(projectId, {
                    label: data.label,
                    value: data.value,
                    description: data.description,
                    color: data.color,
                    order: data.order,
                });
                toast.success("Priority created");
            }
            setIsModalOpen(false);
            setEditingPriorityId(null);
        } catch {
            toast.error("Failed to save priority");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this priority?")) {
            try {
                await deleteProjectPriorityConfig(projectId, id);
                toast.success("Priority deleted");
            } catch {
                toast.error("Failed to delete priority");
            }
        }
    };

    const editingPriority = editingPriorityId
        ? priorities.find(p => p._id === editingPriorityId) ?? null
        : null;

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
                        Project Priority
                    </h2>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Create, edit, or organize priority levels used across this project.
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingPriorityId(null); setIsModalOpen(true); }}
                    className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8"
                >
                    <Plus className="w-3.5 h-3.5" /> Create new
                </Button>
            </div>

            {/* Priority list */}
            <div className="space-y-2">
                {priorities.length === 0 && (
                    <p className="text-[13px] text-gray-400 py-4 text-center">
                        No priorities yet. Create one to get started.
                    </p>
                )}
                {priorities.map(priority => (
                    <div
                        key={priority._id}
                        className="flex items-center justify-between p-3 rounded-md bg-gray-50 hover:shadow-sm transition-shadow"
                    >
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: priority.color }}
                            />
                            <span className="text-[13px] font-medium text-gray-900">
                                {priority.label}
                            </span>
                            {priority.description && (
                                <span className="text-[11px] text-gray-400">
                                    {priority.description}
                                </span>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <Ellipsis className="w-4 h-4 text-gray-500" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem
                                    onClick={() => { setEditingPriorityId(priority._id); setIsModalOpen(true); }}
                                    className="text-[12px]"
                                >
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDelete(priority._id)}
                                    className="text-red-600 focus:text-red-600 text-[12px]"
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AddPriorityModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingPriorityId(null); }}
                onSave={handleSave}
                editingPriority={
                    editingPriority
                        ? {
                            label: editingPriority.label,
                            value: editingPriority.value,
                            description: editingPriority.description,
                            color: editingPriority.color,
                            order: editingPriority.order,
                        }
                        : null
                }
                nextOrder={priorities.length + 1}
            />
        </div>
    );
};

export default ProjectPriorityPage;