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

interface WorkStatesPageProps {
  projectId: string;
}

const WorkStatesPage: React.FC<WorkStatesPageProps> = ({ projectId }) => {
  const { getTaskStatusConfigs, addTaskStatusConfig, updateTaskStatusConfig, deleteTaskStatusConfig } =
    useProjectsStore();

  const statuses = getTaskStatusConfigs(projectId);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const editingStatus = editingStatusId
    ? statuses.find(s => s._id === editingStatusId) || null
    : null;

  const handleEdit = (id: string) => {
    setEditingStatusId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this status?")) {
      await deleteTaskStatusConfig(projectId, id);
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
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            Work states
          </h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            Set up and personalize workflow states to monitor the progress of your work items.
          </p>
        </div>
        <Button
          onClick={() => { setEditingStatusId(null); setIsModalOpen(true); }}
          className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8"
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
            className="flex items-center justify-between p-2.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-[13px] text-gray-700 dark:text-gray-300">{status.label}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all">
                  <Ellipsis className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleEdit(status._id)} className="text-[12px] gap-2">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(status._id)}
                  className="text-red-600 focus:text-red-600 text-[12px] gap-2"
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
    </div>
  );
};

export default WorkStatesPage;