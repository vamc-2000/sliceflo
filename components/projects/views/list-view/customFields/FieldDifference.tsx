// components/list-view/customFields/FieldDifference.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight, Loader2 } from "lucide-react";

interface FieldOption {
    id: string;
    name: string;
    type: 'date' | 'number';
    isBuiltIn?: boolean;
}

interface FieldDifferenceFieldProps {
    availableFields: Array<{ id: string; name: string; type: string }>;
    onSubmit: (data: {
        name: string;
        type: 'field-difference';
        description: string;
        relatedTo: 'date' | 'number';
        difference: {
            field1: string;
            field2: string;
        };
        outputFormat?: 'days' | 'hours';
    }) => void;
    onCancel: () => void;
    initialData?: {
        name: string;
        description?: string;
        relatedTo?: 'date' | 'number';
        difference?: { field1: string; field2: string };
        outputFormat?: 'days' | 'hours';
    };
}

export function FieldDifferenceField({
    availableFields,
    onSubmit,
    onCancel,
    initialData,
}: FieldDifferenceFieldProps) {
  const [loading, setLoading] = useState(false);
    const [fieldName, setFieldName] = useState(initialData?.name ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [relatedTo, setRelatedTo] = useState<'date' | 'number'>(initialData?.relatedTo ?? 'date');
    const [field1, setField1] = useState(initialData?.difference?.field1 ?? '');
    const [field2, setField2] = useState(initialData?.difference?.field2 ?? '');
    const [outputFormat, setOutputFormat] = useState<'days' | 'hours'>(initialData?.outputFormat ?? 'days');
    const [showMoreSettings, setShowMoreSettings] = useState(false);

    // Built-in date fields for tasks/subtasks
    const builtInDateFields: FieldOption[] = [
        { id: 'createdAt', name: 'Created at', type: 'date', isBuiltIn: true },
        { id: 'completedOn', name: 'Completed on', type: 'date', isBuiltIn: true },
        { id: 'startDate', name: 'Start date', type: 'date', isBuiltIn: true },
        { id: 'endDate', name: 'Due date', type: 'date', isBuiltIn: true },
    ];

    // Get available fields based on relatedTo type
    const getAvailableFieldsByType = (): FieldOption[] => {
        if (relatedTo === 'date') {
            // Include built-in date fields + custom date fields
            const customDateFields = availableFields
                .filter(field => field.type === 'date')
                .map(field => ({
                    id: field.id,
                    name: field.name,
                    type: 'date' as const,
                    isBuiltIn: false,
                }));

            return [...builtInDateFields, ...customDateFields];
        } else {
            // Only custom number/budget/autonumber fields
            return availableFields
                .filter(field =>
                    field.type === 'number' ||
                    field.type === 'budget' ||
                    field.type === 'auto-number'
                )
                .map(field => ({
                    id: field.id,
                    name: field.name,
                    type: 'number' as const,
                    isBuiltIn: false,
                }));
        }
    };

    const filteredFields = getAvailableFieldsByType();

    // Reset field selections when relatedTo changes
    const handleRelatedToChange = (value: 'date' | 'number') => {
        setRelatedTo(value);
        setField1('');
        setField2('');
    };

    const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
        if (!field1 || !field2) return;
    setLoading(true);
    try {
      await onSubmit({
            name: fieldName,
            type: 'field-difference',
            description,
            relatedTo,
            difference: {
                field1,
                field2,
            },
            outputFormat: relatedTo === 'date' ? outputFormat : undefined,
        });
      if (!initialData) {
        // Reset form
        setFieldName('');
        setDescription('');
        setRelatedTo('date');
        setField1('');
        setField2('');
        setOutputFormat('days');
        setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
                {/* Field Name */}
                <div className="space-y-2">
                    <label htmlFor="field-name" className="text-xs font-medium block">Field name</label>
                    <Input data-testid="custom-field-name-input"
            disabled={!!initialData}
                        id="field-name"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="Enter name..."
                        className="h-9"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label htmlFor="description" className="text-xs font-medium block">
                        Description
                    </label>
                    <textarea data-testid="custom-field-description-input"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description...."
                        rows={2}
                        className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Related To */}
                <div className="space-y-2">
                    <label className="text-xs font-medium block">Related to</label>
                    <RadioGroup value={relatedTo} onValueChange={handleRelatedToChange}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="date" id="date" />
                            <Label htmlFor="date" className={`text-xs cursor-pointer ${relatedTo === 'date' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Date
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="number" id="number" />
                            <Label htmlFor="number" className={`text-xs cursor-pointer ${relatedTo === 'number' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Number
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Field Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-medium block">{relatedTo === 'date' ? 'Difference between dates' : 'Difference between number fields'}</label>

                    {/* First Field */}
                    <Select value={field1} onValueChange={setField1}>
                        <SelectTrigger data-testid="custom-field-difference-start-trigger" className="h-9">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredFields.length === 0 ? (
                                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                    No {relatedTo} fields available
                                </div>
                            ) : (
                                <>
                                    {/* Built-in fields first (for dates) */}
                                    {relatedTo === 'date' && builtInDateFields.length > 0 && (
                                        <>
                                            {builtInDateFields.map((field) => (
                                                <SelectItem data-testid={`custom-field-difference-start-option-${field.id}`} key={field.id} value={field.id}>
                                                    {field.name}
                                                </SelectItem>
                                            ))}
                                            {availableFields.filter(f => f.type === 'date').length > 0 && (
                                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                                    Custom Fields
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Custom fields */}
                                    {filteredFields
                                        .filter(f => !f.isBuiltIn)
                                        .map((field) => (
                                            <SelectItem data-testid={`custom-field-difference-start-option-${field.id}`} key={field.id} value={field.id}>
                                                {field.name}
                                            </SelectItem>
                                        ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>

                    {/* "and" Label */}
                    <div className="text-xs text-foreground">and</div>

                    {/* Second Field */}
                    <Select value={field2} onValueChange={setField2}>
                        <SelectTrigger data-testid="custom-field-difference-end-trigger" className="h-9">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredFields.length === 0 ? (
                                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                    No {relatedTo} fields available
                                </div>
                            ) : (
                                <>
                                    {/* Built-in fields first (for dates) */}
                                    {relatedTo === 'date' && builtInDateFields.length > 0 && (
                                        <>
                                            {builtInDateFields.map((field) => (
                                                <SelectItem data-testid={`custom-field-difference-end-option-${field.id}`} key={field.id} value={field.id}>
                                                    {field.name}
                                                </SelectItem>
                                            ))}
                                            {availableFields.filter(f => f.type === 'date').length > 0 && (
                                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                                    Custom Fields
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Custom fields */}
                                    {filteredFields
                                        .filter(f => !f.isBuiltIn)
                                        .map((field) => (
                                            <SelectItem data-testid={`custom-field-difference-end-option-${field.id}`} key={field.id} value={field.id}>
                                                {field.name}
                                            </SelectItem>
                                        ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Output Options (Only for Date) */}
                {relatedTo === 'date' && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium block">Output options</label>
                        <RadioGroup value={outputFormat} onValueChange={(val) => setOutputFormat(val as 'days' | 'hours')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="days" id="days" />
                                <Label htmlFor="days" className={`text-xs cursor-pointer ${outputFormat === 'days' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    Number of days (xx days)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hours" id="hours" />
                                <Label htmlFor="hours" className={`text-xs cursor-pointer ${outputFormat === 'hours' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    HH:MM:SS
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                )}

                {/* More Settings Accordion - ALWAYS VISIBLE */}
                <button data-testid="custom-field-more-settings-btn"
                    type="button"
                    onClick={() => setShowMoreSettings(!showMoreSettings)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-muted hover:bg-muted rounded-md transition-colors"
                >
                    <span className="text-xs text-muted-foreground">More settings and permissions</span>
                    <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${showMoreSettings ? 'rotate-90' : ''}`}
                    />
                </button>

                {/* More Settings Content */}
                {showMoreSettings && (
                    <div className="space-y-3 p-3 border rounded-md bg-muted">
                        <p className="text-xs text-muted-foreground">
                            Additional settings coming soon...
                        </p>
                    </div>
                )}
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
                <Button data-testid="custom-field-cancel-btn"
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-9"
                >
                    Cancel
                </Button>
                <Button data-testid="custom-field-submit-btn"
                    type="button"
                    onClick={handleSubmit}
                    disabled={(!fieldName.trim() || !field1 || !field2) || loading}
                    className="flex-1 h-9"
                >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <>{initialData ? 'Update Field' : 'Create'}</>
          )}
        </Button>
            </div>
        </div>
    );
}
