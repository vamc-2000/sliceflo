"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Plus,
    ChevronDown,
    ChevronRight,
    Ellipsis,
    Pencil,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/stores/workspace-store";
import AddProjectPhaseModal from "../AddProjectPhaseModal";
import { Loader } from "@/components/Loader";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";

interface ProjectPhasesPageProps {
    workspaceId: string;
}

const ProjectPhasesPage: React.FC<ProjectPhasesPageProps> = ({ workspaceId }) => {
    const {
        projectPhases,
        isLoadingPhases,
        fetchProjectPhases,
        addProjectPhase,
        addChildPhase,
        updateProjectPhase,
        updateChildPhase,
        deleteProjectPhase,
        deleteChildPhase,
    } = useWorkspaceStore();

    // Fetch on mount
    useEffect(() => {
        if (workspaceId) {
            fetchProjectPhases(workspaceId);
        }
    }, [workspaceId]);

    // Local collapse state
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    const toggleCollapse = (id: string) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContext, setModalContext] = useState<
        | null
        | { mode: "add-parent" }
        | { mode: "add-child"; parentId: string; parentLabel: string }
        | { mode: "edit-parent"; phaseId: string; name: string; color: string }
        | { mode: "edit-child"; phaseId: string; parentId: string; name: string; color: string }
    >(null);

    const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null);
    const [deleteSubPhaseContext, setDeleteSubPhaseContext] = useState<{ childId: string; parentId: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openAddParent = () => {
        setModalContext({ mode: "add-parent" });
        setIsModalOpen(true);
    };

    const openAddChild = (parentId: string, parentLabel: string) => {
        setModalContext({ mode: "add-child", parentId, parentLabel });
        setIsModalOpen(true);
    };

    const openEditParent = (phaseId: string, name: string, color: string) => {
        setModalContext({ mode: "edit-parent", phaseId, name, color });
        setIsModalOpen(true);
    };

    const openEditChild = (phaseId: string, parentId: string, name: string, color: string) => {
        setModalContext({ mode: "edit-child", phaseId, parentId, name, color });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContext(null);
    };

    const editingStateForModal =
        modalContext?.mode === "edit-parent" || modalContext?.mode === "edit-child"
            ? { name: modalContext.name, color: modalContext.color }
            : null;

    const groupNameForModal =
        modalContext?.mode === "add-child"
            ? modalContext.parentLabel
            : modalContext?.mode === "edit-child"
                ? (modalContext as any).parentLabel ?? "Sub-phase"
                : "Phase";

    // Save handler
    const handleSave = async (data: { name: string; color: string }) => {
        if (!modalContext) return;
        try {
            if (modalContext.mode === "add-parent") {
                await addProjectPhase(workspaceId, { label: data.name, color: data.color });
                toast.success("Phase created");
            } else if (modalContext.mode === "add-child") {
                await addChildPhase(workspaceId, modalContext.parentId, { label: data.name, color: data.color });
                toast.success("Sub-phase created");
            } else if (modalContext.mode === "edit-parent") {
                await updateProjectPhase(workspaceId, modalContext.phaseId, { label: data.name, color: data.color });
                toast.success("Phase updated");
            } else if (modalContext.mode === "edit-child") {
                await updateChildPhase(workspaceId, modalContext.phaseId, modalContext.parentId, { label: data.name, color: data.color });
                toast.success("Sub-phase updated");
            }
        } catch {
            toast.error("Operation failed. Please try again.");
        }
        closeModal();
    };

    const handleDeleteParentClick = (phaseId: string) => {
        setDeletePhaseId(phaseId);
    };

    const handleDeleteParentConfirm = async () => {
        if (!deletePhaseId) return;
        setIsDeleting(true);
        try {
            await deleteProjectPhase(workspaceId, deletePhaseId);
            toast.success("Phase deleted");
            setDeletePhaseId(null);
        } catch {
            toast.error("Cannot delete — projects may be using this phase.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteChildClick = (childId: string, parentId: string) => {
        setDeleteSubPhaseContext({ childId, parentId });
    };

    const handleDeleteChildConfirm = async () => {
        if (!deleteSubPhaseContext) return;
        setIsDeleting(true);
        try {
            await deleteChildPhase(workspaceId, deleteSubPhaseContext.childId, deleteSubPhaseContext.parentId);
            toast.success("Sub-phase deleted");
            setDeleteSubPhaseContext(null);
        } catch {
            toast.error("Cannot delete — projects may be using this sub-phase.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoadingPhases) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <Loader message="Loading phases..." size="md" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-background text-foreground">

            {/* Header - same as original */}
            <div className="flex items-center justify-between pr-2">
                <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                        Project phases
                    </h2>
                    <p className="text-[12px] text-muted-foreground">
                        Create and customize the phases used to capture project-level information.
                    </p>
                </div>
                {/* Header Add phase button → creates a parent phase */}
                <Button
                    onClick={openAddParent}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8 cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add phase
                </Button>
            </div>

            {/* Phases list - same DOM structure as original groups */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 py-4">
                {projectPhases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                        No phases yet. Add one to get started.
                    </p>
                ) : (
                    projectPhases.map((phase) => {
                        const isCollapsed = collapsedIds.has(phase._id);

                        return (
                            <div
                                key={phase._id}
                                className="border border-border rounded-lg overflow-hidden bg-card"
                            >
                                {/* Phase header - same as original group header */}
                                <div className="flex items-center justify-between p-3 bg-secondary border-b border-border">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => toggleCollapse(phase._id)}
                                            className="hover:bg-accent hover:text-accent-foreground rounded p-0.5 transition-colors cursor-pointer"
                                        >
                                            {isCollapsed ? (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
 
                                        <div
                                            className="w-3.5 h-3.5 rounded-full"
                                            style={{ backgroundColor: phase.color }}
                                        />
                                        <span className="text-[14px] font-medium text-foreground">
                                            {phase.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-0.5">
                                        {/* Plus inside phase header → creates a child sub-phase */}
                                        <button
                                            onClick={() => openAddChild(phase._id, phase.label)}
                                            className="hover:bg-accent hover:text-accent-foreground rounded-full p-1 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 text-muted-foreground" />
                                        </button>

                                        {/* Edit / Delete dropdown for parent phase */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="hover:bg-accent hover:text-accent-foreground rounded-full p-1 transition-colors cursor-pointer">
                                                    <Ellipsis className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32 bg-popover border border-border text-popover-foreground border-b-5 border-b-primary">
                                                <DropdownMenuItem
                                                    onClick={() => openEditParent(phase._id, phase.label, phase.color)}
                                                    className="text-[12px] gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteParentClick(phase._id)}
                                                    className="text-red-600 focus:text-red-600 text-[12px] gap-2 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Children - same as original states rows */}
                                {!isCollapsed && (
                                    <div className="p-2 space-y-1">
                                        {phase.children && phase.children.length > 0 ? (
                                            phase.children.map((child) => (
                                                <div
                                                    key={child._id}
                                                    className="flex items-center justify-between p-2.5 rounded hover:bg-accent/45 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: child.color }}
                                                        />
                                                        <span className="text-[13px] text-foreground/90">
                                                            {child.label}
                                                        </span>
                                                    </div>

                                                    {/* Direct edit/delete icons instead of dropdown */}
                                                    <div className="flex items-center gap-2 transition-all">
                                                        <button
                                                            onClick={() => openEditChild(child._id, phase._id, child.label, child.color)}
                                                            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteChildClick(child._id, phase._id)}
                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[12px] text-muted-foreground px-2 py-1">
                                                No sub-phases. Click + to add one.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <AddProjectPhaseModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
                parentPhaseName={
                    modalContext?.mode === "add-child" || modalContext?.mode === "edit-child"
                        ? (modalContext as any).parentLabel
                        : undefined
                }
                editingPhase={editingStateForModal}
            />

            <ConfirmationModal
                open={!!deletePhaseId}
                onClose={() => setDeletePhaseId(null)}
                onConfirm={handleDeleteParentConfirm}
                title="Are you sure want to delete this phase?"
                description="This action is permanent and cannot be undone."
                confirmLabel="Delete Phase"
                loadingLabel="Deleting..."
                loading={isDeleting}
            />

            <ConfirmationModal
                open={!!deleteSubPhaseContext}
                onClose={() => setDeleteSubPhaseContext(null)}
                onConfirm={handleDeleteChildConfirm}
                title="Are you sure want to delete this sub-phase?"
                description="This action is permanent and cannot be undone."
                confirmLabel="Delete Sub-phase"
                loadingLabel="Deleting..."
                loading={isDeleting}
            />
        </div>
    );
};

export default ProjectPhasesPage;