"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Plus, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore, getTaskTypeIcon, getDefaultTaskTypeIcon } from "@/stores/projects-store";
import { Loader } from '@/components/Loader';
import { FieldTypeSelectContent } from "@/components/projects/views/list-view/common/FieldTypeSelectContent";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { EditCustomFieldPopup } from "@/components/projects/views/list-view/common/EditCustomFieldPopup";



interface CustomFieldPageProps {
  projectId?: string;
}

const CustomFieldPage = ({ projectId }: CustomFieldPageProps) => {
  // ✅ Get both system fields and custom fields
  const {
    getSystemFields,
    isSystemFieldVisible,
    toggleSystemFieldVisibility,
  } = useTasksStore();
  const { workspaceMembers } = useWorkspaceStore();
  const { projects, getTaskTypesByProject, getTaskStatusConfigs, deleteTaskCustomField, getTaskPriorityConfigs } = useProjectsStore();
  const [showCreateField, setShowCreateField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Get system fields with visibility state
  const systemFields = getSystemFields();
  const selectedProject = projects.find(p => p.id === projectId);
  const customFields = selectedProject?.customFields || [];

  // ✅ Get field options
  const taskStatusConfigs = projectId ? getTaskStatusConfigs(projectId) : [];
  const taskPriorityConfigs = projectId ? getTaskPriorityConfigs(projectId) : [];
  const members = (selectedProject?.members || []).map(({ userId }) => {
    const wm = workspaceMembers.find(m => m.userId === userId);
    return {
      id: userId,
      name: wm?.name || userId,
      email: wm?.email,
    };
  })
  const taskTypes = projectId ? getTaskTypesByProject(projectId) : [];

  // ✅ Get field values based on field type
  const getFieldValues = (field: any) => {
    if (field.isSystem) {
      switch (field.id) {
        case 'status':
          return taskStatusConfigs.map(cfg => ({
            id: cfg._id,
            name: cfg.label,
            color: cfg.color,
          }));
        case 'priority':
          return taskPriorityConfigs.map(cfg => ({
            id: cfg._id,
            name: cfg.label,
            color: cfg.color,
          }));
        case 'assignee':
          return members.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
          }));
        case 'taskType':
          return taskTypes.map(type => ({
            id: type._id,
            name: type.label,
            color: type.color,
            icon: type.icon,
            isSystem: type._id.startsWith('system-'),
          }));
        default:
          return [];
      }
    } else {
      // Custom field options
      if (field.type === 'select-one' || field.type === 'select-many') {
        const customField = customFields.find(cf => cf.id === field.id);
        if (customField?.options) {
          return Array.isArray(customField.options)
            ? customField.options.map((opt: any, idx: number) => ({
              id: typeof opt === 'string' ? opt : opt.id || `${idx}`,
              name: typeof opt === 'string' ? opt : opt.value || opt.name || opt,
              color: typeof opt === 'string' ? undefined : opt.color,
            }))
            : [];
        }
      }
      return [];
    }
  };

  // ✅ Map system fields with current visibility
  const systemFieldsList = systemFields.map(field => ({
    id: field.id,
    name: field.name,
    type: field.type,
    description: field.description,
    isSystem: true,
    checked: projectId ? isSystemFieldVisible(projectId, field.id) : field.defaultVisible,
    required: field.required,
  }));

  // Map custom fields to display format
  const customFieldsList = customFields.map(field => ({
    id: field.id,
    name: field.name,
    type: field.type,
    description: field.description,
    isSystem: false,
    checked: true,
    required: false,
    options: field.options || [],
  }));


  const handleDeleteField = (fieldId: string) => {
    setDeleteFieldId(fieldId);
  };

  const handleDeleteConfirm = async () => {
    if (!projectId || !deleteFieldId) return;
    setIsDeleting(true);
    try {
      await deleteTaskCustomField(projectId, deleteFieldId);
      setDeleteFieldId(null);
    } catch (error) {
      console.error('Failed to delete custom field:', error);
      alert('Failed to delete custom field. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFieldCreated = () => {
    setShowCreateField(false);
  };

  // ✅ Render inline field values
  const renderInlineFieldValues = (field: any) => {
    const values = getFieldValues(field);
    if (values.length === 0) return null;

    // Limit to first 3 values for inline display
    const displayValues = values.slice(0, 4);
    const remainingCount = values.length - 4;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayValues.map((value: any) => (
          <div
            key={value.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px]"
          >
            {/* ✅ Render icon for task types */}
            {field.id === 'taskType' && (() => {
              const taskType = taskTypes.find(t => t._id === value.id);
              const IconComponent = getTaskTypeIcon(taskType);
              const DefaultIcon = getDefaultTaskTypeIcon();

              return IconComponent ? (
                <IconComponent
                  className="w-2.5 h-2.5 flex-shrink-0"
                  style={{ color: value.color }}
                />
              ) : (
                <DefaultIcon
                  className="w-2.5 h-2.5 flex-shrink-0"
                  style={{ color: value.color }}
                />
              );
            })()}

            {/* ✅ Render color dot for status/priority/custom options */}
            {value.color && field.id !== 'taskType' && (
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: value.color }}
              />
            )}

            {/* Value name */}
            <span className="text-gray-600">{value.name}</span>
          </div>
        ))}

        {/* ✅ Show remaining count if more than 3 */}
        {remainingCount > 0 && (
          <span className="text-[10px] text-gray-400">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  // Check if project exists
  if (!projectId || !selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📁</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Project Selected
        </h3>
        <p className="text-sm text-gray-500">
          Please select a project to manage custom fields
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Custom fields
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage system and custom fields for your project
          </p>
        </div>

        <DropdownMenu open={showCreateField} onOpenChange={setShowCreateField}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="bg-[#001F3F] text-white hover:text-[#001F3F] font-medium px-3 h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create field
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[320px] p-0 flex flex-col h-[450px] border-b-5 border-b-[#001F3F]"
            align="end"
            side="bottom"
          >
            <FieldTypeSelectContent
              projectId={projectId}
              onFieldCreated={handleFieldCreated}
              onBack={() => setShowCreateField(false)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 pr-1">
        {/* ✅ System Fields Section */}
        {systemFieldsList.length > 0 && (
          <div className="mt-6">
            {/* <h3 className="text-sm font-medium text-gray-700 mb-3">System Fields</h3> */}
            <div className="space-y-2">
              {systemFieldsList.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* ✅ Checkbox toggles visibility */}
                    <Checkbox
                      checked={field.checked}
                      disabled={field.required}
                      onCheckedChange={() => {
                        if (projectId && !field.required) {
                          toggleSystemFieldVisibility(projectId, field.id);
                        }
                      }}
                      className="h-5 w-5"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {field.name}
                        {field.required && (
                          <span className="text-xs text-red-500" title="Required field">
                            *
                          </span>
                        )}
                      </div>

                      {/* ✅ Type and Values inline */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded-sm inline-block text-xs text-gray-600">
                          {field.type}
                        </span>

                        {/* ✅ Render inline field values */}
                        {renderInlineFieldValues(field)}
                      </div>
                    </div>
                  </div>

                  {/* System badge */}
                  <span className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded flex-shrink-0">
                    System
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Custom Fields Section */}
        {customFieldsList.length > 0 && (
          <div className="mt-2">
            {/* <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Fields</h3> */}
            <div className="space-y-2">
              {customFieldsList.map((field) => {
                const originalField = customFields.find((cf) => cf.id === field.id);
                return (
                  <div
                    key={field.id}
                    className="group flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={field.checked}
                        className="h-5 w-5"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {field.name}
                        </div>

                        {/* ✅ Type and Values inline */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm inline-block text-xs">
                            {field.type}
                          </span>

                          {/* ✅ Render inline field values */}
                          {renderInlineFieldValues(field)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 relative">
                      {originalField && projectId && (
                        <EditCustomFieldPopup
                          projectId={projectId}
                          field={originalField}
                          open={editingFieldId === field.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingFieldId(null);
                          }}
                          trigger={<button className="absolute right-0 top-0 w-8 h-8 opacity-0 pointer-events-none" aria-hidden="true" />}
                          align="end"
                        />
                      )}

                      {/* Actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-b-5 border-b-[#001F3F]">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFieldId(field.id);
                            }}
                          >
                            Edit field
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteField(field.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            Delete field
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={!!deleteFieldId}
        onClose={() => setDeleteFieldId(null)}
        onConfirm={handleDeleteConfirm}
        title="Are you sure want to delete this custom field?"
        description="This action is permanent and cannot be undone."
        confirmLabel="Delete Field"
        loadingLabel="Deleting..."
        loading={isDeleting}
      />

      {/* Empty State */}
      {/* {customFieldsList.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"> 
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            No custom fields yet
          </h3>
          <p className="text-xs text-gray-500 text-center max-w-xs">
            Create custom fields to track additional information specific to your project
          </p>
        </div>
      )} */}
    </div>
  );
};

export default CustomFieldPage;
