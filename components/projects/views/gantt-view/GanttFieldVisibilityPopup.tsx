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
import { useProjectsStore } from '@/stores/projects-store';
import { FieldTypeSelectContent } from "@/components/projects/views/list-view/common/FieldTypeSelectContent";

interface GanttFieldVisibilityPopupProps {
    projectId: string;
    children?: React.ReactNode;
}

type FieldItem = {
    id: string;
    label: string;
    isCustom: boolean;
    isSystem: boolean;
    type?: string;
    required?: boolean;
};

export function GanttFieldVisibilityPopup({ projectId, children }: GanttFieldVisibilityPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateField, setShowCreateField] = useState(false);

    const {
        columnConfigs,
        toggleColumnVisibility,
        getSystemFields,
        isSystemFieldVisible,
        toggleSystemFieldVisibility,
    } = useTasksStore();
    const { getTaskCustomFields } = useProjectsStore();

    // ✅ ADD — makes switches update immediately
    const systemFieldVisibility = useTasksStore(state => state.systemFieldVisibility);
    const systemFields = getSystemFields();
    const projectCustomFields = getTaskCustomFields(projectId);

    // ── Visibility Logic ───────────────────────────────────────────────────
    const isFieldVisible = (fieldId: string, isSystem: boolean): boolean => {
        const key = `${projectId}-gantt-${fieldId}`;
        const legacyKey = `${projectId}-${fieldId}`;

        // If user has set an explicit visibility, use it
        if (systemFieldVisibility[key] !== undefined) return systemFieldVisibility[key];
        if (isSystem && systemFieldVisibility[legacyKey] !== undefined) return systemFieldVisibility[legacyKey];

        if (isSystem) {
            // Gantt Default: ID, Task Name, and Due Date only
            const ganttDefaults = ["id", "task", "endDate"];
            return ganttDefaults.includes(fieldId);
        } else {
            // Custom fields in Gantt default to HIDDEN
            return false;
        }
    };

    const handleToggle = (fieldId: string, isSystem: boolean, required: boolean) => {
        // Don't allow hiding ID or Task
        if (fieldId === 'id' || fieldId === 'task') return;
        if (required) return;

        toggleSystemFieldVisibility(projectId, fieldId, "gantt");
    };

    const filterBySearch = (label: string) =>
        !searchQuery || label.toLowerCase().includes(searchQuery.toLowerCase());

    // ── System fields (id, task, taskType, status, assignee, startDate, endDate, priority) ──
    // These come from getSystemFields() — no separate hardcoded list needed.
    // This is identical to how List builds its field list.
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

    // ── Custom fields only — no duplicate default fields ──────────────────────
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

    // Same structure as List: system + custom only (no extra hardcoded gantt defaults)
    const allFields: FieldItem[] = [...systemFieldItems, ...customFieldItems];

    const shownFields = allFields.filter(f => isFieldVisible(f.id, f.isSystem));
    const hiddenFields = allFields.filter(f => !isFieldVisible(f.id, f.isSystem));

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

    const handleCreateFieldClick = () => setShowCreateField(true);
    const handleBackToFields = () => setShowCreateField(false);
    const handleFieldCreated = () => { setShowCreateField(false); setIsOpen(false); };

    // ── Shared row renderer — identical to ListFieldVisibilityPopup ───────────
    const renderFieldRow = (field: FieldItem, checked: boolean) => (
        <div
            key={field.id}
            className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-colors ${field.required
                ? 'bg-muted cursor-not-allowed opacity-75'
                : 'hover:bg-muted/50 cursor-pointer'
                }`}
            onClick={() => !field.required && handleToggle(field.id, field.isSystem, field.required || false)}
            data-testid={`gantt-field-visibility-row-${field.id}`}
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
                checked={checked}
                disabled={field.required}
                onCheckedChange={() => !field.required && handleToggle(field.id, field.isSystem, field.required || false)}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
                data-testid={`gantt-field-visibility-switch-${field.id}`}
            />
        </div>
    );

    return (
        <DropdownMenu
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setShowCreateField(false); setSearchQuery(''); }
            }}
        >
            <DropdownMenuTrigger asChild>
                {children || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                    >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-[320px] p-0 flex flex-col h-[450px] border-b-[5px] border-b-primary"
                align="end"
                side="bottom"
            >
                {showCreateField ? (
                    <FieldTypeSelectContent
                        projectId={projectId}
                        onFieldCreated={handleFieldCreated}
                        onBack={handleBackToFields}
                    />
                ) : (
                    <>
                        {/* ── FIXED HEADER ── */}
                        <div className="flex-shrink-0 px-3 py-2.5 border-b space-y-2 bg-background">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold">Fields</h4>
                                <span className="text-xs text-muted-foreground">
                                    {shownFields.length} visible
                                </span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    placeholder="Search fields..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-8 pl-8 pr-2 text-xs border rounded-md outline-none focus:ring-1 focus:ring-primary"
                                    data-testid="gantt-field-visibility-search"
                                />
                            </div>
                        </div>

                        {/* ── SCROLLABLE CONTENT ── */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">

                            {/* SHOWN */}
                            {shownFields.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">
                                            Shown ({shownFields.length})
                                        </p>
                                        <button
                                            className="text-xs text-primary hover:underline"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleHideAll(); }}
                                            data-testid="gantt-field-visibility-hide-all"
                                        >
                                            Hide all
                                        </button>
                                    </div>
                                    <div className="space-y-0.5">
                                        {shownFields.map(f => renderFieldRow(f, true))}
                                    </div>
                                </div>
                            )}

                            {/* HIDDEN */}
                            {hiddenFields.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">
                                            Hidden ({hiddenFields.length})
                                        </p>
                                        <button
                                            className="text-xs text-primary hover:underline"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShowAll(); }}
                                            data-testid="gantt-field-visibility-unhide-all"
                                        >
                                            Unhide all
                                        </button>
                                    </div>
                                    <div className="space-y-0.5">
                                        {hiddenFields.map(f => renderFieldRow(f, false))}
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

                        {/* ── FIXED FOOTER ── */}
                        <div className="flex-shrink-0 border-t p-2.5 bg-background">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-3 h-8"
                                onClick={handleCreateFieldClick}
                                data-testid="gantt-field-visibility-create-btn"
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