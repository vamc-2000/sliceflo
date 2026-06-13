"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Ellipsis, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectsStore } from "@/stores/projects-store";
import AddStatusUpdateModal from "../AddStatusUpdateModal";
import { toast } from "react-hot-toast";
import ConfirmationModal from "@/components/ConfirmationModal";

interface ProjectUpdatesPageProps {
  projectId: string;
}

const ProjectUpdatesPage: React.FC<ProjectUpdatesPageProps> = ({
  projectId = "default-project",
}) => {
  const {
    getProjectStatusConfigs,
    addProjectStatusConfig,
    updateProjectStatusConfig,
    deleteProjectStatusConfig,
  } = useProjectsStore();

  // Get statuses for this project
  const statuses = getProjectStatusConfigs(projectId);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const handleCreateNew = () => {
    setEditingStatusId(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: { name: string; color: string; backgroundColor: string }) => {
    try {
      if (editingStatusId) {
        await updateProjectStatusConfig(projectId, editingStatusId, {
          label: data.name,
          color: data.color,
          value: data.name.toLowerCase().replace(/\s+/g, "-"),
        });
        toast.success("Status updated");
      } else {
        await addProjectStatusConfig(projectId, {
          label: data.name,
          color: data.color,
          value: data.name.toLowerCase().replace(/\s+/g, "-"),
        });
        toast.success("Status created");
      }
      setIsModalOpen(false);
      setEditingStatusId(null);
    } catch (error) {
      console.error("Error saving status:", error);
      toast.error("Failed to save status");
    }
  };

  
  const handleEdit = (id: string) => {
    setEditingStatusId(id);
    setIsModalOpen(true);
  };
  
  const handleDelete = (id: string) => {
    setDeleteStatusId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteStatusId) return;
    setIsDeleting(true);
    try {
      await deleteProjectStatusConfig(projectId, deleteStatusId);
      toast.success("Status deleted");
    } catch (error) {
      toast.error("Failed to delete status");
    } finally {
      setIsDeleting(false);
      setDeleteStatusId(null);
    }
  };

  const editingStatus = editingStatusId
    ? statuses.find((s) => s._id === editingStatusId) || null  // ✅ _id not id
    : null;

  return (
    <div className="w-full space-y-4 bg-background text-foreground">
      {/* Header - Same style as Labels page */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">
            Project updates
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Create, edit, or organize status updates used across this project.
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create new
        </Button>
      </div>

      {/* Status Cards */}
      <div className="space-y-2">
        {/* Custom statuses */}
        {statuses.map((status) => (
          <div
            key={status._id}
            className="flex items-center justify-between p-3 rounded-md hover:shadow-sm transition-shadow border border-border"
            style={{ backgroundColor: status.color + '15' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-[13px] font-medium text-foreground">{status.label}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors cursor-pointer">
                  <Ellipsis className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-popover border border-border text-popover-foreground">
                <DropdownMenuItem onClick={() => handleEdit(status._id)} className="text-[12px] cursor-pointer hover:bg-accent hover:text-accent-foreground">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(status._id)}
                  className="text-red-600 focus:text-red-600 text-[12px] cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Modal — pass label as name for the modal's existing interface */}
      <AddStatusUpdateModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStatusId(null); }}
        onSave={handleSave}
        editingStatus={
          editingStatus
            ? {
                name: editingStatus.label,
                color: editingStatus.color,
                backgroundColor: editingStatus.color + '15'
              }
            : null
        }
      />

      <ConfirmationModal
        open={!!deleteStatusId}
        onClose={() => setDeleteStatusId(null)}
        onConfirm={handleDeleteConfirm}
        title="Are you sure want to delete this status update?"
        description="This action is permanent and cannot be undone."
        confirmLabel="Delete Status"
        loadingLabel="Deleting..."
        loading={isDeleting}
      />
    </div>
  );
};

export default ProjectUpdatesPage;
