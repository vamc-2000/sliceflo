"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Plus, Search } from 'lucide-react';
import { useTasksStore } from '@/stores/tasks-store';
import { FieldTypeSelectContent } from "@/components/projects/views/list-view/common/FieldTypeSelectContent";
import { useProjectsStore } from '@/stores/projects-store';

interface ListFieldVisibilityPopupProps {
    projectId: string;
}

// Define a unified type for field items
type FieldItem = {
    id: string;
    label: string;
    isCustom: boolean;
    isSystem: boolean;
    type?: string;
    required?: boolean;
};

export function ListFieldVisibilityPopup({ projectId }: ListFieldVisibilityPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateField, setShowCreateField] = useState(false);

    const {
        columnConfigs,
        toggleColumnVisibility,
        getSystemFields,              // ✅ ADD
        toggleSystemFieldVisibility,  // ✅ ADD
    } = useTasksStore();
    const { getTaskCustomFields } = useProjectsStore();

    // ✅ ADD THIS — popup switches update immediately after toggle
    const systemFieldVisibility = useTasksStore(state => state.systemFieldVisibility);

    // ✅ Get system fields from store
    const systemFields = getSystemFields();

    // Get project-specific custom fields
    const projectCustomFields = getTaskCustomFields(projectId);

    // Get visibility state for a field
    const isFieldVisible = (fieldId: string, isSystem: boolean) => {
        const key = `${projectId}-list-${fieldId}`;
        const legacyKey = `${projectId}-${fieldId}`;

        if (systemFieldVisibility[key] !== undefined) return systemFieldVisibility[key];

        if (isSystem) {
            if (systemFieldVisibility[legacyKey] !== undefined) return systemFieldVisibility[legacyKey];
            const field = systemFields.find(f => f.id === fieldId);

            // List Default: Everything except Type, Cycle, and Start Date
            if (fieldId === 'taskType' || fieldId === 'startDate' || fieldId === 'cycle') return false;

            return field?.defaultVisible ?? true;
        }

        // Custom fields in List default to visible
        const config = columnConfigs.find(c => c.id === fieldId);
        return config?.pinned ?? true;
    };

    const handleToggle = (fieldId: string, isSystem: boolean, required: boolean) => {
        // Don't allow hiding ID or Task
        if (fieldId === 'id' || fieldId === 'task') return;
        if (required) return;

        // Use the same store for all fields to ensure view-specific separation
        toggleSystemFieldVisibility(projectId, fieldId, "list");
    };

    const getFieldLabel = (fieldId: string) => {
        // Check system fields first
        const systemField = systemFields.find(f => f.id === fieldId);
        if (systemField) return systemField.name;

        // Check custom fields
        const customField = projectCustomFields.find(f => f.id === fieldId);
        if (customField) return customField.name;

        // Fallback
        return fieldId;
    };

    const getFieldType = (fieldId: string, isSystem: boolean) => {
        if (isSystem) {
            const systemField = systemFields.find(f => f.id === fieldId);
            return systemField?.type;
        }
        const customField = projectCustomFields.find(f => f.id === fieldId);
        return customField?.type;
    };

    // Filter fields based on search query
    const filterBySearch = (label: string) => {
        if (!searchQuery) return true;
        return label.toLowerCase().includes(searchQuery.toLowerCase());
    };

    // ✅ Map system fields to unified format
    const systemFieldItems: FieldItem[] = systemFields
        .filter(f => filterBySearch(f.name))
        .map(f => ({
            id: f.id,
            label: f.name,
            isCustom: false,
            isSystem: true,
            type: f.type,
            required: f.required,
        }));

    // Map custom fields to unified format
    const customFieldItems: FieldItem[] = projectCustomFields
        .filter(f => filterBySearch(f.name))
        .map(f => ({
            id: f.id,
            label: f.name,
            isCustom: true,
            isSystem: false,
            type: f.type,
            required: false,
        }));

    // ✅ Combine all fields
    const allFields = [...systemFieldItems, ...customFieldItems];

    // ✅ Separate shown and hidden fields
    const shownFields = allFields.filter(f => isFieldVisible(f.id, f.isSystem));
    const hiddenFields = allFields.filter(f => !isFieldVisible(f.id, f.isSystem));

    const handleCreateFieldClick = () => {
        setShowCreateField(true);
    };

    const handleBackToFields = () => {
        setShowCreateField(false);
    };

    const handleFieldCreated = () => {
        setShowCreateField(false);
        setIsOpen(false);
    };

    const handleHideAll = () => {
        shownFields.forEach(field => {
            if (field.id !== 'id' && field.id !== 'task') {
                handleToggle(field.id, field.isSystem, field.required || false);
            }
        });
    };

    const handleShowAll = () => {
        hiddenFields.forEach(field => {
            handleToggle(field.id, field.isSystem, field.required || false);
        });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setShowCreateField(false);
                setSearchQuery('');
            }
        }}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    data-testid="list-fields-visibility-trigger"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[280px] p-0 flex flex-col h-[450px] border-b-[5px] border-b-primary"
                align="end"
                side="bottom"
                data-testid="list-fields-visibility-content"
            >
                {showCreateField ? (
                    <FieldTypeSelectContent
                        projectId={projectId}
                        onFieldCreated={handleFieldCreated}
                        onBack={handleBackToFields}
                    />
                ) : (
                    <>
                        {/* FIXED HEADER */}
                        <div className="flex-shrink-0 px-3 py-2.5 border-b space-y-2 bg-background">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold">Fields</h4>
                                <span className="text-xs text-muted-foreground">
                                    {shownFields.length} visible
                                </span>
                            </div>
 
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    placeholder="Search fields..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-8 pl-8 pr-2 text-xs border rounded-md outline-none focus:ring-1 focus:ring-primary"
                                    data-testid="list-fields-visibility-search"
                                />
                            </div>
                        </div>
 
                        {/* SCROLLABLE CONTENT */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
 
                            {/* SHOWN FIELDS */}
                            {shownFields.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">
                                            Shown ({shownFields.length})
                                        </p>
                                        <button
                                            className="text-xs text-primary hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleHideAll();
                                            }}
                                            data-testid="list-fields-visibility-hide-all"
                                        >
                                            Hide all
                                        </button>
                                    </div>
 
                                    <div className="space-y-0.5">
                                        {shownFields.map(field => (
                                            <div
                                                key={field.id}
                                                className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-colors ${field.required
                                                    ? 'bg-muted cursor-not-allowed opacity-75'
                                                    : 'hover:bg-muted/50 cursor-pointer'
                                                    }`}
                                                onClick={() => !field.required && handleToggle(field.id, field.isSystem, field.required || false)}
                                            >
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs truncate">{field.label}</span>
                                                        {field.required && (
                                                            <span className="text-xs text-red-500" title="Required field">*</span>
                                                        )}
                                                        {field.isSystem && (
                                                            <span className="text-[10px] px-1 py-0.5 bg-muted text-muted-foreground rounded">
                                                                System
                                                            </span>
                                                        )}
                                                    </div>
                                                    {field.type && (
                                                        <span className="text-xs text-muted-foreground capitalize">
                                                            {field.type.replace(/-/g, ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <Switch
                                                    checked={true}
                                                    disabled={field.required}
                                                    onCheckedChange={() => !field.required && handleToggle(field.id, field.isSystem, field.required || false)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-shrink-0"
                                                    data-testid={`list-fields-visibility-switch-${field.id}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
 
                            {/* HIDDEN FIELDS */}
                            {hiddenFields.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">
                                            Hidden ({hiddenFields.length})
                                        </p>
                                        <button
                                            className="text-xs text-primary hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleShowAll();
                                            }}
                                            data-testid="list-fields-visibility-unhide-all"
                                        >
                                            Unhide all
                                        </button>
                                    </div>
 
                                    <div className="space-y-0.5">
                                        {hiddenFields.map(field => (
                                            <div
                                                key={field.id}
                                                className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors gap-2"
                                                onClick={() => handleToggle(field.id, field.isSystem, field.required || false)}
                                            >
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs truncate">{field.label}</span>
                                                        {field.isSystem && (
                                                            <span className="text-[10px] px-1 py-0.5 bg-muted text-muted-foreground rounded">
                                                                System
                                                            </span>
                                                        )}
                                                    </div>
                                                    {field.type && (
                                                        <span className="text-xs text-muted-foreground capitalize">
                                                            {field.type.replace(/-/g, ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <Switch
                                                    checked={false}
                                                    onCheckedChange={() => handleToggle(field.id, field.isSystem, field.required || false)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-shrink-0"
                                                    data-testid={`list-fields-visibility-switch-${field.id}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
 
                            {/* NO RESULTS */}
                            {searchQuery && shownFields.length === 0 && hiddenFields.length === 0 && (
                                <div className="py-6 text-center">
                                    <p className="text-xs text-muted-foreground">No fields found</p>
                                </div>
                            )}
                        </div>
 
                        {/* FIXED FOOTER */}
                        <div className="flex-shrink-0 border-t p-2.5 bg-background">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-primary text-primary-foreground hover:text-primary font-medium px-3 h-8"
                                onClick={handleCreateFieldClick}
                                data-testid="list-fields-visibility-create-btn"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create field
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
