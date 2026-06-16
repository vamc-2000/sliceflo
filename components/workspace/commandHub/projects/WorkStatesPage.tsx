"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Ellipsis, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectsStore } from "@/stores/projects-store";
import AddWorkStateModal from "../AddWorkStateModal";
import ConfirmationModal from "@/components/ConfirmationModal";

interface WorkStatesPageProps {
  projectId: string;
}

const WorkStatesPage: React.FC<WorkStatesPageProps> = ({ projectId }) => {
  const { getTaskStatusConfigs, addTaskStatusConfig, updateTaskStatusConfig, deleteTaskStatusConfig } =
    useProjectsStore();

  const statuses = getTaskStatusConfigs(projectId);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [deleteStateId, setDeleteStateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editingStatus = editingStatusId
    ? statuses.find(s => s._id === editingStatusId) || null
    : null;

  const handleEdit = (id: string) => {
    setEditingStatusId(id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteStateId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteStateId) return;
    setIsDeleting(true);
    try {
      await deleteTaskStatusConfig(projectId, deleteStateId);
      setDeleteStateId(null);
    } catch (error) {
      // Error already handled
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (data: { name: string; color: string }) => {
    if (editingStatusId) {
      await updateTaskStatusConfig(projectId, editingStatusId, {
        label: data.name,
        color: data.color,
      });
    } else {
      await addTaskStatusConfig(projectId, {
        label: data.name,
        color: data.color,
        value: data.name.toLowerCase().replace(/\s+/g, '_'),
      });
    }
    setIsModalOpen(false);
    setEditingStatusId(null);
  };

  return (
    <div className="w-full space-y-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">
            Work states
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Set up and personalize workflow states to monitor the progress of your work items.
          </p>
        </div>
        <Button
          onClick={() => { setEditingStatusId(null); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add state
        </Button>
      </div>

      {/* Custom Statuses */}
      <div className="space-y-1.5">
        {statuses.map(status => (
          <div
            key={status._id}
            className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-[13px] text-foreground">{status.label}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-all cursor-pointer">
                  <Ellipsis className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-popover border border-border text-popover-foreground">
                <DropdownMenuItem onClick={() => handleEdit(status._id)} className="text-[12px] gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(status._id)}
                  className="text-red-600 focus:text-red-600 text-[12px] gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Modal — reusing AddWorkStateModal as-is, it only needs name + color */}
      <AddWorkStateModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStatusId(null); }}
        onSave={handleSave}
        editingState={editingStatus ? { name: editingStatus.label, color: editingStatus.color } : null}
      />

      <ConfirmationModal
        open={!!deleteStateId}
        onClose={() => setDeleteStateId(null)}
        onConfirm={handleDeleteConfirm}
        title="Are you sure want to delete this work state?"
        description="This action is permanent and cannot be undone."
        confirmLabel="Delete State"
        loadingLabel="Deleting..."
        loading={isDeleting}
      />
    </div>
  );
};

export default WorkStatesPage;