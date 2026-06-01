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

interface DraftFieldVisibilityPopupProps {
    visibleFields: Record<string, boolean>;
    onToggle: (fieldId: string) => void;
}

type FieldItem = {
    id: string;
    label: string;
    isSystem: boolean;
    type?: string;
    required?: boolean;
};

export function DraftFieldVisibilityPopup({ visibleFields, onToggle }: DraftFieldVisibilityPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { getSystemFields } = useTasksStore();

    const systemFields = getSystemFields();

    const isFieldVisible = (fieldId: string) => {
        const field = systemFields.find(f => f.id === fieldId);
        return visibleFields[fieldId] ?? (field?.defaultVisible ?? true);
    };

    const handleToggle = (fieldId: string, required: boolean) => {
        if (required) return;
        onToggle(fieldId);
    };

    const filterBySearch = (label: string) => {
        if (!searchQuery) return true;
        return label.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const systemFieldItems: FieldItem[] = systemFields
        .filter(f => filterBySearch(f.name))
        .map(f => ({
            id: f.id,
            label: f.name,
            isSystem: true,
            type: f.type,
            required: f.required,
        }));

    const shownFields = systemFieldItems.filter(f => isFieldVisible(f.id));
    const hiddenFields = systemFieldItems.filter(f => !isFieldVisible(f.id));

    const handleHideAll = () => {
        shownFields.forEach(field => {
            if (!field.required) {
                handleToggle(field.id, field.required || false);
            }
        });
    };

    const handleShowAll = () => {
        hiddenFields.forEach(field => {
            handleToggle(field.id, field.required || false);
        });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setSearchQuery('');
            }
        }}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[320px] p-0 flex flex-col h-[450px] border-b-5 border-b-[#001F3F]"
                align="end"
                side="bottom"
            >
                {/* FIXED HEADER */}
                <div className="flex-shrink-0 px-3 py-2.5 border-b space-y-2 bg-background">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Fields</h4>
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
                            className="w-full h-8 pl-8 pr-2 text-sm border rounded-md outline-none focus:ring-1 focus:ring-primary"
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
                                >
                                    Hide all
                                </button>
                            </div>

                            <div className="space-y-0.5">
                                {shownFields.map(field => (
                                    <div
                                        key={field.id}
                                        className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-colors ${field.required
                                            ? 'bg-gray-50 cursor-not-allowed opacity-75'
                                            : 'hover:bg-muted/50 cursor-pointer'
                                            }`}
                                        onClick={() => !field.required && handleToggle(field.id, field.required || false)}
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm truncate">{field.label}</span>
                                                {field.required && (
                                                    <span className="text-xs text-red-500" title="Required field">*</span>
                                                )}
                                                {field.isSystem && (
                                                    <span className="text-[10px] px-1 py-0.5 bg-gray-200 text-gray-600 rounded">
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
                                            onCheckedChange={() => !field.required && handleToggle(field.id, field.required || false)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-shrink-0"
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
                                >
                                    Unhide all
                                </button>
                            </div>

                            <div className="space-y-0.5">
                                {hiddenFields.map(field => (
                                    <div
                                        key={field.id}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors gap-2"
                                        onClick={() => handleToggle(field.id, field.required || false)}
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm truncate">{field.label}</span>
                                                {field.isSystem && (
                                                    <span className="text-[10px] px-1 py-0.5 bg-gray-200 text-gray-600 rounded">
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
                                            onCheckedChange={() => handleToggle(field.id, field.required || false)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-shrink-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NO RESULTS */}
                    {searchQuery && shownFields.length === 0 && hiddenFields.length === 0 && (
                        <div className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">No fields found</p>
                        </div>
                    )}
                </div>

                {/* FIXED FOOTER */}
                {/* <div className="flex-shrink-0 border-t p-2.5 bg-background">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-[#001F3F] text-white hover:text-[#001F3F] font-medium px-3 h-8"
                        onClick={() => {
                            // UI placeholder to match design
                            console.log('Create field clicked');
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create field
                    </Button>
                </div> */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
