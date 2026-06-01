// components/projects/views/list-view/common/EditCustomFieldPopup.tsx
'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pencil } from 'lucide-react';
import { useProjectsStore, TaskCustomField } from '@/stores/projects-store';
import { SelectOne } from '../customFields/SelectOne';
import { SelectMany } from '../customFields/SelectMany';
import { Text } from '../customFields/Text';
import { TextArea } from '../customFields/TextArea';
import { Label } from '../customFields/Label';
import { Number } from '../customFields/Number';
import { Website } from '../customFields/Website';
import { Email } from '../customFields/Email';
import { Phone } from '../customFields/Phone';
import { CheckboxField } from '../customFields/Checkbox';
import { DateField } from '../customFields/DateField';
import { BudgetField } from '../customFields/Budget';
import { RatingField } from '../customFields/Rating';
// import { RollupField } from '../customFields/Rollup';
import { VotingField } from '../customFields/Voting';
import { IpAddressField } from '../customFields/IpAddress';
// import { SocialMediaField } from '../customFields/SocialMedia';
// import { AutoNumberField } from '../customFields/AutoNumber';
import { TshirtSizeField } from '../customFields/TshirtSize';
import { LocationField } from '../customFields/Location';
import { PeopleField } from '../customFields/People';
import { FormulaField } from '../customFields/Formula';
import { FieldDifferenceField } from '../customFields/FieldDifference';
import { toast } from "@/components/ui/sonner";

interface EditCustomFieldPopupProps {
  projectId: string;
  field: TaskCustomField;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  align?: 'start' | 'end' | 'center';
}

// Normalize stored options → { value, color } shape for initialData
function getInitialOptions(field: TaskCustomField) {
  if (!field.options?.length) return [];
  return (field.options as (string | { value: string; color: string })[]).map(o =>
    typeof o === 'string' ? { value: o, color: '#6366f1' } : o
  );
}

export function EditCustomFieldPopup({
  projectId,
  field,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  align = 'start',
}: EditCustomFieldPopupProps) {
  const { updateTaskCustomField } = useProjectsStore();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const initialData = {
    name: field.name,
    description: field.description ?? '',
    options: getInitialOptions(field),
  };

  const handleSubmit = async (data: any) => {
    await updateTaskCustomField(projectId, field.id, {
      name: data.name,
      description: data.description,
      ...(data.options ? { options: data.options } : {}),
    });
    toast('success', { title: `"${data.name}" updated` });
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  // Dynamically render the correct field editor component
  const renderFieldEditor = () => {
    const props = { onSubmit: handleSubmit, onCancel: handleCancel, initialData };
    const existingFields = [{ id: field.id, name: field.name, type: field.type }];

    switch (field.type) {
      case 'select-one': return <SelectOne {...props} />;
      case 'select-many': return <SelectMany {...props} />;
      case 'text': return <Text {...props} />;
      case 'textarea': return <TextArea {...props} />;
      case 'label': return <Label {...props} />;
      case 'number': return <Number {...props} />;
      case 'website': return <Website {...props} />;
      case 'email': return <Email {...props} />;
      case 'phone': return <Phone {...props} />;
      case 'checkbox': return <CheckboxField {...props} />;
      case 'date': return <DateField {...props} />;
      case 'budget': return <BudgetField {...props} />;
      case 'rating': return <RatingField {...props} />;
      // case 'rollup':       return <RollupField {...props} />;
      case 'voting': return <VotingField {...props} />;
      case 'location': return <LocationField {...props} />;
      case 'ip-address': return <IpAddressField {...props} />;
      // case 'social-media': return <SocialMediaField {...props} />;
      // case 'auto-number':  return <AutoNumberField {...props} />;
      case 'tshirt-size': return <TshirtSizeField {...props} />;
      case 'formula': return <FormulaField availableFields={existingFields} {...props} />;
      case 'field-difference': return <FieldDifferenceField availableFields={existingFields} {...props} />;
      default: return <Text {...props} />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <button
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
            title={`Edit ${field.name}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px]                                                   p-0 flex flex-col h-[450px] border-b-[5px] border-b-primary"
        align={align}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b bg-background">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="font-semibold text-xs">Edit: {field.name}</h3>
        </div>

        {/* Field editor fills remaining height — same as FieldTypeSelectContent */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderFieldEditor()}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}