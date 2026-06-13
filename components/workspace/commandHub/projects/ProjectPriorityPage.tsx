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
import ConfirmationModal from "@/components/ConfirmationModal";

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
    const [deletePriorityId, setDeletePriorityId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteClick = (id: string) => {
        setDeletePriorityId(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deletePriorityId) return;
        setIsDeleting(true);
        try {
            await deleteProjectPriorityConfig(projectId, deletePriorityId);
            toast.success("Priority deleted");
            setDeletePriorityId(null);
        } catch {
            toast.error("Failed to delete priority");
        } finally {
            setIsDeleting(false);
        }
    };

    const editingPriority = editingPriorityId
        ? priorities.find(p => p._id === editingPriorityId) ?? null
        : null;

    return (
        <div className="w-full space-y-4 bg-background text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-semibold text-foreground">
                        Project Priority
                    </h2>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                        Create, edit, or organize priority levels used across this project.
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingPriorityId(null); setIsModalOpen(true); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8 cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" /> Create new
                </Button>
            </div>

            {/* Priority list */}
            <div className="space-y-2">
                {priorities.length === 0 && (
                    <p className="text-[13px] text-muted-foreground py-4 text-center">
                        No priorities yet. Create one to get started.
                    </p>
                )}
                {priorities.map(priority => (
                    <div
                        key={priority._id}
                        className="flex items-center justify-between p-3 rounded-md bg-card border border-border hover:shadow-sm transition-shadow"
                    >
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: priority.color }}
                            />
                            <span className="text-[13px] font-medium text-foreground">
                                {priority.label}
                            </span>
                            {priority.description && (
                                <span className="text-[11px] text-muted-foreground">
                                    {priority.description}
                                </span>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors cursor-pointer">
                                    <Ellipsis className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 bg-popover border border-border text-popover-foreground">
                                <DropdownMenuItem
                                    onClick={() => { setEditingPriorityId(priority._id); setIsModalOpen(true); }}
                                    className="text-[12px] cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                >
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDeleteClick(priority._id)}
                                    className="text-red-600 focus:text-red-600 text-[12px] cursor-pointer hover:bg-accent hover:text-accent-foreground"
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

            <ConfirmationModal
                open={!!deletePriorityId}
                onClose={() => setDeletePriorityId(null)}
                onConfirm={handleDeleteConfirm}
                title="Are you sure want to delete this priority?"
                description="This action is permanent and cannot be undone."
                confirmLabel="Delete Priority"
                loadingLabel="Deleting..."
                loading={isDeleting}
            />
        </div>
    );
};

export default ProjectPriorityPage;