"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Plus, Search } from 'lucide-react';
import { usePortfoliosStore } from '@/stores/portfolios-store';
import { cn } from '@/lib/utils';

interface PortfolioFieldVisibilityPopupProps {
    portfolioId: string;
    viewType?: "list" | "table" | "gantt";
    children?: React.ReactNode;
}

export const ALL_PORTFOLIO_FIELDS = [
    { id: "id", label: "ID", required: true, type: "number" },
    { id: "name", label: "Project", required: true, type: "text" },
    { id: "phase", label: "Phase", type: "dropdown" },
    { id: "status", label: "Status", type: "status" },
    { id: "leader", label: "Leader", type: "user" },
    { id: "members", label: "Members", type: "users" },
    { id: "viewers", label: "Viewers", type: "users" },
    { id: "priority", label: "Priority", type: "dropdown" },
    { id: "startDate", label: "Start Date", type: "date" },
    { id: "endDate", label: "Due Date", type: "date" },
    { id: "progress", label: "Progress", required: false },
];

export function PortfolioFieldVisibilityPopup({ portfolioId, viewType = "list", children }: PortfolioFieldVisibilityPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        fieldVisibility,
        toggleFieldVisibility,
        setFieldVisibility,
    } = usePortfoliosStore();

    const key = `${portfolioId}-${viewType}`;
    const defaultVisible = viewType === "gantt" 
        ? ["id", "name", "phase"] 
        : ALL_PORTFOLIO_FIELDS.map(f => f.id);

    const visibleFieldIds = fieldVisibility[key] || defaultVisible;

    const isVisible = (fieldId: string) => visibleFieldIds.includes(fieldId);

    const filteredFields = ALL_PORTFOLIO_FIELDS.filter(f =>
        f.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const shownFields = filteredFields.filter(f => isVisible(f.id));
    const hiddenFields = filteredFields.filter(f => !isVisible(f.id));

    const handleHideAll = () => {
        const requiredIds = ALL_PORTFOLIO_FIELDS.filter(f => f.required).map(f => f.id);
        setFieldVisibility(portfolioId, requiredIds, viewType);
    };

    const handleShowAll = () => {
        setFieldVisibility(portfolioId, ALL_PORTFOLIO_FIELDS.map(f => f.id), viewType);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setSearchQuery('');
        }}>
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
                className="w-[320px] p-0 flex flex-col h-[450px] border-b-5 border-b-[#001F3F]"
                align="end"
                side="bottom"
            >
                {/* FIXED HEADER */}
                <div className="flex-shrink-0 px-3 py-2.5 border-b space-y-2 bg-background">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Fields</h4>
                        <span className="text-xs text-muted-foreground">
                            {visibleFieldIds.length} visible
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
                                        className={cn(
                                            "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors",
                                            field.required ? "bg-gray-50 cursor-not-allowed opacity-75" : "hover:bg-muted/50 cursor-pointer"
                                        )}
                                        onClick={() => !field.required && toggleFieldVisibility(portfolioId, field.id, viewType)}
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm truncate">{field.label}</span>
                                                {field.required && (
                                                    <span className="text-xs text-red-500" title="Required field">*</span>
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
                                            onCheckedChange={() => !field.required && toggleFieldVisibility(portfolioId, field.id, viewType)}
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
                                        onClick={() => toggleFieldVisibility(portfolioId, field.id, viewType)}
                                    >
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm truncate">{field.label}</span>
                                            {field.type && (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {field.type.replace(/-/g, ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <Switch
                                            checked={false}
                                            onCheckedChange={() => toggleFieldVisibility(portfolioId, field.id, viewType)}
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
