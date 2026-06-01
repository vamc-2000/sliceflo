"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Ellipsis, LayoutTemplate } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useProjectsStore,
  TaskTypeConfig,
} from "@/stores/projects-store";
import AddWorkItemTypeModal from "../AddWorkItemTypeModal";
import { uploadIcon, uploadFile, deleteUpload } from '@/lib/api/uploads-api';
import toast from 'react-hot-toast';
import { IconData, iconComponentMap } from '@/components/ColorIconPicker';

export interface WorkItemTypeData {
  name: string;
  pluralName: string;
  description: string;
  icon?: IconData | null;
}

interface WorkItemTypesPageProps {
  projectId: string;
}



const WorkItemTypesPage: React.FC<WorkItemTypesPageProps> = ({
  projectId,
}) => {
  const {
    getTaskTypesByProject,
    addTaskTypeToProject,
    updateTaskTypeInProject,
    deleteTaskTypeFromProject,
  } = useProjectsStore();

  const allTypes = getTaskTypesByProject(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  const editingType = editingTypeId
    ? allTypes.find((t) => t._id === editingTypeId)
    : null;

  const handleEditClick = (id: string) => {
    setEditingTypeId(id);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingTypeId(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: WorkItemTypeData) => {
    try {
      let iconId: string | null = null;
      let iconObject: TaskTypeConfig['icon'] = null; // ✅ build from upload response

      console.log("Saving work item type with data:", data);

      if (data.icon?.type === 'icon' && data.icon.icon) {
        // ✅ Lucide icon — call uploadIcon API to get real iconId
        const result = await uploadIcon({
          icon: {
            name: data.icon.icon,
            color: data.icon.color || '#3B82F6',
          },
        });
        iconId = result.id;

        // ✅ build icon object from upload response
        iconObject = {
          iconId: result.id,
          type: 'icon',
          name: result.name,        // from upload response
          color: result.color,      // from upload response
        };
      } else if (data.icon?.type === 'file' && data.icon.imageId) {
        // ✅ Uploaded image — imageId already set by ColorIconPicker
        iconId = data.icon.imageId;

        // ✅ build icon object from what we know
        iconObject = {
          iconId: data.icon.imageId,
          type: 'file',
          name: '',
          color: data.icon.color || '#3B82F6',
          presignedUrl: data.icon.image, // already available from picker
        };
      }
      console.log("Icon ID to save:", iconId);

      if (editingTypeId) {
        await updateTaskTypeInProject(projectId, editingTypeId, {
          label: data.name,
          pluralLabel: data.pluralName,
          description: data.description,
          color: data.icon?.color || '#3B82F6',
          iconId: iconId || undefined,   // ✅ only send iconId
          icon: iconObject,
        });
      } else {
        const value = data.name.toLowerCase().replace(/\s+/g, '-');
        const order = allTypes.length + 5;

        await addTaskTypeToProject(projectId, {
          value,
          label: data.name,
          pluralLabel: data.pluralName,
          description: data.description,
          color: data.icon?.color || '#3B82F6',
          order,
          iconId: iconId || undefined,   // ✅ only send iconId
          icon: iconObject,
        });
      }

      setIsModalOpen(false);
      setEditingTypeId(null);
    } catch (error) {
      // already handled in store
    }
  };

  const handleDelete = async (typeId: string) => {
    if (window.confirm("Are you sure you want to delete this task type?")) {
      try {
        await deleteTaskTypeFromProject(projectId, typeId);
      } catch (error) {
        // Error already handled in store with toast
      }
    }
  };

  // ✅ Handle icon upload
  const handleIconUpload = async (file: File): Promise<{ id: string; url?: string }> => {
    try {
      const result = await uploadFile(file);
      return result;
    } catch (error) {
      toast.error('Failed to upload icon');
      throw error;
    }
  };

  const handleIconDelete = async (uploadId: string): Promise<void> => {
    try {
      await deleteUpload(uploadId);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete icon');
      throw error;
    }
  };

  const renderWorkItemTypeIcon = (type: TaskTypeConfig) => {
    if (type.icon?.type === "file" && type.icon?.presignedUrl) {
      return (
        <img
          src={type.icon.presignedUrl}
          alt={type.label}
          className="w-full h-full object-cover"
        />
      );
    }

    if (type.displayImage) {
      return (
        <img
          src={type.displayImage}
          alt={type.label}
          className="w-6 h-6 object-contain"
        />
      );
    }

    if (type.iconId && type.icon?.type === "icon" && type.icon?.name) {
      const Icon = iconComponentMap[type.icon.name];
      if (Icon) {
        return (
          <Icon
            className="w-5 h-5"
            color={type.icon.color || type.color || "#3B82F6"}
          />
        );
      }
    }

    return (
      <LayoutTemplate
        className="w-5 h-5 shrink-0"
        color={type.color || "#6B7280"}
      />
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Work item types</h2>
          <p className="text-sm text-muted-foreground">
            {allTypes.length} total types
          </p>
        </div>
        <Button
          onClick={() => handleCreateClick()}
          className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          Create work item
        </Button>
      </div>

      {/* Custom Types Section */}
      <div>
        {/* <h3 className="text-sm font-medium mb-3 text-muted-foreground">Custom Types</h3> */}
        <div className="flex flex-col gap-2">
          {allTypes.length > 0 && (
            allTypes.map((type) => (
              <div
                key={type._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* <div
                    className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium overflow-hidden"
                    style={{
                      backgroundColor: type.color + '20',
                      color: type.color,
                    }}
                  >
                    {type.icon?.type === 'file' && type.icon?.presignedUrl ? (
                      // ✅ Show uploaded image icon
                      <img
                        src={type.icon.presignedUrl}
                        alt={type.label}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : type.icon?.type === 'icon' && type.icon?.name ? (
                      (() => {
                        // ✅ use iconComponentMap — has full icon library including "person", "time" etc.
                        const Icon = iconComponentMap[type.icon.name];
                        return Icon
                          ? <Icon size={16} color={type.icon.color || type.color} />
                          : <span>{type.label.charAt(0)}</span>;
                      })()
                    ) : (
                      // ✅ Fallback to first letter
                      <span>{type.label.charAt(0)}</span>
                    )}
                  </div> */}

                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {renderWorkItemTypeIcon(type)}
                  </div>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Ellipsis className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEditClick(type._id)}
                      className="text-[12px]"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(type._id)}
                      className="text-red-600 focus:text-red-600 text-[12px]"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )))}
        </div>
      </div>
      <AddWorkItemTypeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTypeId(null); }}
        onSave={handleSave}
        onUpload={handleIconUpload}
        onDelete={handleIconDelete}
        editingType={editingType ? {
          name: editingType.label,
          pluralName: editingType.pluralLabel || editingType.label,
          description: editingType.description,
          icon: editingType.icon ? {
            type: editingType.icon.type === 'file' ? 'file' : 'icon',
            icon: editingType.icon.name,           // ✅ for lucide icons
            image: editingType.icon.presignedUrl,  // ✅ for uploaded image icons
            color: editingType.icon.color || editingType.color,
          } : { type: 'icon', color: editingType.color },
        } : null}
      />
    </div>
  );
};

export default WorkItemTypesPage;
