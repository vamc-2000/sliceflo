// components/workspace/WorkspaceFieldTypeSelectDropdown.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { WorkspaceCustomFieldFormData, WorkspaceCustomFieldConfig } from '@/types/workspace.types';

// Import field type icons
import {
    CheckCircle2,
    Type,
    Hash,
    CalendarCheck,
} from "lucide-react";

// Import field configuration components
import { SelectOne } from "@/components/projects/views/list-view/customFields/SelectOne";
import { Text } from "@/components/projects/views/list-view/customFields/Text";
import { Number } from "@/components/projects/views/list-view/customFields/Number";
import { DateField } from "@/components/projects/views/list-view/customFields/DateField";

// ✅ Only fields supported by API: text, date, dropdown, number
const workspaceFields = [
    { type: "text", label: "Text", icon: Type, color: "text-gray-700" },
    { type: "number", label: "Number", icon: Hash, color: "text-gray-700" },
    { type: "dropdown", label: "Dropdown", icon: CheckCircle2, color: "text-gray-700" },
    { type: "date", label: "Date", icon: CalendarCheck, color: "text-gray-700" },
];

interface WorkspaceFieldTypeSelectDropdownProps {
    workspaceId: string;
}

export function WorkspaceFieldTypeSelectDropdown({ workspaceId }: WorkspaceFieldTypeSelectDropdownProps) {
    const { addWorkspaceCustomFieldConfig, workspaceCustomFieldsConfig } = useWorkspaceStore();

    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFieldType, setSelectedFieldType] = useState<string | null>(null);

    // Filter fields based on search query
    const filterFields = (fields: typeof workspaceFields) => {
        if (!searchQuery) return fields;
        return fields.filter((field) =>
            field.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredFields = filterFields(workspaceFields);

    const handleSelectType = (type: string) => {
        setSelectedFieldType(type);
        setSearchQuery("");
    };

    const handleBackToList = () => {
        setSelectedFieldType(null);
    };

    const handleFieldSubmit = async (data: any) => {
        try {
            // Transform options from string[] to { value, label }[] for API
            const transformedOptions: { value: string; label: string }[] = [];

            if (data.options && data.options.length > 0) {
                data.options.forEach((option: string) => {
                    transformedOptions.push({
                        value: option,
                        label: option
                    });
                });
            }

            // Map field type to API format
            // "select-one" -> "dropdown" for API
            let apiType = data.type;
            if (data.type === 'select-one') {
                apiType = 'dropdown';
            }

            // Build API payload
            const apiData: Omit<WorkspaceCustomFieldConfig, '_id'> = {
                name: data.name,
                label: data.name,
                type: apiType, // Use mapped type
                description: data.description || '',
                required: data.required || false,
                order: workspaceCustomFieldsConfig[workspaceId]?.length || 0,
                options: transformedOptions.length > 0 ? transformedOptions : undefined,
                defaultValue: data.defaultValue || undefined,
            };

            // Call API via store
            await addWorkspaceCustomFieldConfig(workspaceId, apiData);

            // Close dropdown and reset
            handleBackToList();
            setOpen(false);
        } catch (error) {
            console.error('Failed to create workspace custom field:', error);
            alert('Failed to create custom field. Please try again.');
        }
    };

    const handleFieldCancel = () => {
        handleBackToList();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button className="bg-[#001F3F] text-white font-medium px-3 h-8 rounded-md">
                    <Plus className="w-4 h-4 mr-1" />
                    Create field
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                
            className="w-[320px] p-0 flex flex-col h-[450px] border-b-5 border-b-[#001F3F]"
                // className="w-80 p-0 border-b-5 border-b-[#001F3F]"
                // style={{ maxHeight: '500px', display: 'flex', flexDirection: 'column' }}
            >
                {selectedFieldType ? (
                    // SHOW FIELD CONFIGURATION FORM
                    <>
                        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-2 border-b">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToList}
                                className="h-8 w-8 p-0"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h3 className="font-semibold text-sm">
                                {selectedFieldType === 'text' && 'Text'}
                                {selectedFieldType === 'number' && 'Number'}
                                {selectedFieldType === 'dropdown' && 'Dropdown'}
                                {selectedFieldType === 'date' && 'Date'}
                            </h3>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden">
                            {selectedFieldType === 'text' && (
                                <Text
                                    onSubmit={handleFieldSubmit as any}
                                    onCancel={handleFieldCancel}
                                />
                            )}

                            {selectedFieldType === 'number' && (
                                <Number
                                    onSubmit={handleFieldSubmit as any}
                                    onCancel={handleFieldCancel}
                                />
                            )}

                            {selectedFieldType === 'dropdown' && (
                                <SelectOne
                                    onSubmit={(data) => handleFieldSubmit({ ...data, type: 'select-one' }) as any}
                                    onCancel={handleFieldCancel}
                                />
                            )}

                            {selectedFieldType === 'date' && (
                                <DateField
                                    onSubmit={handleFieldSubmit as any}
                                    onCancel={handleFieldCancel}
                                />
                            )}
                        </div>
                    </>
                ) : (
                    // SHOW FIELD TYPE LIST
                    <>
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Create field</h3>
                        </div>

                        <div className="px-4 py-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search fields..."
                                    className="pl-8 h-8 text-sm border-gray-300 bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 py-1">
                            {filteredFields.map((field) => {
                                const Icon = field.icon;
                                return (
                                    <DropdownMenuItem
                                        key={field.type}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            handleSelectType(field.type);
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer focus:bg-gray-100"
                                    >
                                        <Icon className={cn("h-4 w-4", field.color)} />
                                        <span className="text-sm">{field.label}</span>
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
