// components/workspace/commandHub/workspace/EditWorkspaceCustomFieldPopup.tsx
'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pencil } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { WorkspaceCustomFieldConfig } from '@/types/workspace.types';
import { SelectOne } from '@/components/projects/views/list-view/customFields/SelectOne';
import { Text } from '@/components/projects/views/list-view/customFields/Text';
import { Number } from '@/components/projects/views/list-view/customFields/Number';
import { DateField } from '@/components/projects/views/list-view/customFields/DateField';
import { toast } from '@/components/ui/sonner';

interface EditWorkspaceCustomFieldPopupProps {
  workspaceId: string;
  field: WorkspaceCustomFieldConfig;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  align?: 'start' | 'end' | 'center';
}

// Normalize stored options → { value, color } shape for initialData
function getInitialOptions(field: WorkspaceCustomFieldConfig) {
  if (!field.options?.length) return [];
  return field.options.map(o => ({
    value: typeof o === 'string' ? o : o.value,
    color: '#6366f1',
  }));
}

export function EditWorkspaceCustomFieldPopup({
  workspaceId,
  field,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  align = 'start',
}: EditWorkspaceCustomFieldPopupProps) {
  const { updateWorkspaceCustomFieldConfig } = useWorkspaceStore();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const initialData = {
    name: field.label,
    description: field.description ?? '',
    options: getInitialOptions(field),
    defaultValue: field.defaultValue ?? '',
  };

  const handleSubmit = async (data: any) => {
    if (!field._id) return;
    try {
      const transformedOptions: { value: string; label: string }[] = [];
      if (data.options && data.options.length > 0) {
        data.options.forEach((option: any) => {
          const val = typeof option === 'string' ? option : option.value;
          transformedOptions.push({
            value: val,
            label: val,
          });
        });
      }

      // Map field type to API format: "select-one" -> "dropdown" for API
      let apiType = data.type || field.type;
      if (apiType === 'select-one') {
        apiType = 'dropdown';
      }

      const updates: Partial<WorkspaceCustomFieldConfig> = {
        name: data.name,
        label: data.name,
        type: apiType,
        description: data.description || '',
        required: data.required || false,
        options: transformedOptions.length > 0 ? transformedOptions : undefined,
        defaultValue: data.defaultValue || undefined,
      };

      await updateWorkspaceCustomFieldConfig(workspaceId, field._id, updates);
      toast('success', { title: `"${data.name}" updated` });
      setOpen(false);
    } catch (error) {
      console.error('Failed to update workspace custom field config:', error);
      toast('error', { title: 'Failed to update custom field' });
    }
  };

  const handleCancel = () => setOpen(false);

  // Dynamically render the correct field editor component
  const renderFieldEditor = () => {
    const props = { onSubmit: handleSubmit, onCancel: handleCancel, initialData };

    switch (field.type) {
      case 'dropdown':
        return <SelectOne {...props} />;
      case 'text':
        return <Text {...props} />;
      case 'number':
        return <Number {...props} />;
      case 'date':
        return <DateField {...props} />;
      default:
        return <Text {...props} />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <button
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
            title={`Edit ${field.label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] p-0 flex flex-col h-[450px] border-b-[5px] border-b-[#001F3F]"
        align={align}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b bg-background">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="font-semibold text-xs">Edit: {field.label}</h3>
        </div>

        {/* Field editor fills remaining height */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderFieldEditor()}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
