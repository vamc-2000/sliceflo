"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Flag, Calendar, User2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { WorkspaceFieldTypeSelectDropdown } from "@/components/workspace/commandHub/workspace/WorkspaceFieldTypeSelectDropdown";
import { Loader } from '@/components/Loader';
import ConfirmationModal from "@/components/ConfirmationModal";
import { EditWorkspaceCustomFieldPopup } from "@/components/workspace/commandHub/workspace/EditWorkspaceCustomFieldPopup";

// Project-level system fields (shown in About Project panel)
const PROJECT_SYSTEM_FIELDS = [
  { id: 'priority', label: 'Priority', type: 'select-one', icon: Flag, required: false },
  { id: 'startDate', label: 'Start Date', type: 'date', icon: Calendar, required: false },
  { id: 'endDate', label: 'End Date', type: 'date', icon: Calendar, required: false },
  { id: 'owner', label: 'Owner', type: 'people', icon: User2, required: false },
] as const;


const ProjectDetailsPage = () => {
  const {
    currentWorkspace,
    workspaceCustomFieldsConfig,
    fetchWorkspaceCustomFieldsConfig,
    updateWorkspaceCustomFieldConfig,
    deleteWorkspaceCustomFieldConfig,
    workspaceMembers,
    isLoading
  } = useWorkspaceStore();

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch custom fields on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceCustomFieldsConfig(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceCustomFieldsConfig]);

  // Get custom fields for current workspace
  const customFields = useMemo(
    () => workspaceCustomFieldsConfig[currentWorkspace?.id || ''] || [],
    [workspaceCustomFieldsConfig, currentWorkspace?.id]
  );

  // Map custom fields to match the display format
  const customFieldsList = customFields.map(field => ({
    id: field._id || '',
    name: field.label,
    type: field.type,
    description: field.description,
    options: field.options,
    required: field.required,
    isSystem: false,
    checked: true,
  }));

  // Track which project system fields are visible (default all visible)
  const [systemFieldVisibility, setSystemFieldVisibility] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PROJECT_SYSTEM_FIELDS.map(f => [f.id, true]))
  );

  const toggleProjectSystemField = (fieldId: string) => {
    setSystemFieldVisibility(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const systemFieldsList = PROJECT_SYSTEM_FIELDS.map(field => ({
    id: field.id,
    label: field.label,
    type: field.type,
    icon: field.icon,
    required: field.required,
    checked: systemFieldVisibility[field.id] ?? true,
  }));

  // ✅ Get field values for system fields
  const getSystemFieldValues = (fieldId: string) => {
    switch (fieldId) {
      case 'priority':
        return [];
      case 'owner':
        return workspaceMembers.map(member => ({
          id: member.userId || member.userId,
          name: member.name,
          email: member.email,
        }));
      default:
        return [];
    }
  };

  // ✅ Get field values for custom fields
  const getCustomFieldValues = (field: any) => {
    if (field.type === 'select-one' || field.type === 'select-many') {
      if (field.options && Array.isArray(field.options)) {
        return field.options.map((opt: any, idx: number) => ({
          id: typeof opt === 'string' ? opt : opt.id || `${idx}`,
          name: typeof opt === 'string' ? opt : opt.value || opt.label || opt.name || opt,
          color: typeof opt === 'string' ? undefined : opt.color,
        }));
      }
    }
    return [];
  };

  // ✅ Render inline field values
  const renderInlineFieldValues = (fieldId: string, values: any[]) => {
    // Priority is configured per-project — show a hint instead of blank
    if (fieldId === 'priority') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] text-gray-500 italic">
          Configured per project
        </span>
      );
    }
    if (values.length === 0) return null;

    // Limit to first 3 values for inline display
    const displayValues = values.slice(0, 3);
    const remainingCount = values.length - 3;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayValues.map((value: any) => (
          <div
            key={value.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px]"
          >
            {/* ✅ Render color dot for values with colors */}
            {value.color && (
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

  const handleEditField = (fieldId: string) => {
    setEditingFieldId(fieldId);
  };

  const handleDeleteField = (fieldId: string) => {
    setDeleteFieldId(fieldId);
  };

  const handleDeleteConfirm = async () => {
    if (!currentWorkspace?.id || !deleteFieldId) return;
    setIsDeleting(true);
    try {
      await deleteWorkspaceCustomFieldConfig(currentWorkspace.id, deleteFieldId);
      setDeleteFieldId(null);
    } catch (error) {
      console.error('Failed to delete field:', error);
      alert('Failed to delete custom field. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if workspace exists
  if (!currentWorkspace?.id) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🏢</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Workspace Selected
        </h3>
        <p className="text-sm text-gray-500">
          Please select a workspace to manage custom fields
        </p>
      </div>
    );
  }

  // Show loader while fetching custom fields
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <Loader message="Loading custom fields..." size="md" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Project details
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and customize the fields used to capture project-level information.
          </p>
        </div>

        {/* Create field button */}
        <WorkspaceFieldTypeSelectDropdown workspaceId={currentWorkspace.id} />
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-auto py-4 space-y-2">

        {/* ── Project System Fields ─────────────────────────────── */}
        <div>
          {/* <h3 className="text-sm font-medium text-gray-700 mb-3">System Fields</h3> */}
          <div className="space-y-2">
            {systemFieldsList.map((field) => {
              const Icon = field.icon;
              const fieldValues = getSystemFieldValues(field.id);

              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50"
                >
                  {/* Left: checkbox + icon + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={field.checked}
                      disabled={field.required}
                      onCheckedChange={() => !field.required && toggleProjectSystemField(field.id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {field.label}
                        {field.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>

                      {/* ✅ Type and Values inline */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded-sm inline-block text-xs text-gray-600">
                          {field.type}
                        </span>

                        {/* ✅ Render inline field values */}
                        {renderInlineFieldValues(field.id, fieldValues)}
                      </div>
                    </div>
                  </div>

                  {/* Right: System badge */}
                  <span className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded flex-shrink-0">
                    System
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ Custom Fields Section */}
        {customFieldsList.length > 0 && (
          <div className="mt-2">
            {/* <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Fields</h3> */}
            <div className="space-y-2">
              {customFieldsList.map((field) => {
                const fieldValues = getCustomFieldValues(field);

                const originalField = customFields.find((cf) => cf._id === field.id);
                return (
                  <div
                    key={field.id}
                    className="group flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Left side: Checkbox + Field info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={field.checked}
                        disabled={field.isSystem}
                        className="h-5 w-5"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {field.name}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </div>

                        {/* ✅ Type and Values inline */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm inline-block text-xs">
                            {field.type}
                          </span>

                          {/* ✅ Render inline field values */}
                          {renderInlineFieldValues('', fieldValues)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 relative">
                      {originalField && currentWorkspace?.id && (
                        <EditWorkspaceCustomFieldPopup
                          workspaceId={currentWorkspace.id}
                          field={originalField}
                          open={editingFieldId === field.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingFieldId(null);
                          }}
                          trigger={<button className="absolute right-0 top-0 w-8 h-8 opacity-0 pointer-events-none" aria-hidden="true" />}
                          align="end"
                        />
                      )}

                      {/* Right side: Actions menu */}
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
                            onClick={() => handleEditField(field.id)}
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
              <Flag className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No custom fields yet
            </h3>
            <p className="text-xs text-gray-500 text-center max-w-xs">
              Create custom fields to track additional project-level information
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
