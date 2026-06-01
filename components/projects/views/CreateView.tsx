"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Trash2, Layout, Filter, Image as ImageIcon, ChevronDown, List, LayoutGrid, Calendar as CalendarIcon, GanttChart, Paperclip, Flag, Loader2, Clock, ChartGantt, SquareKanban, } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuid } from "uuid";
import { useProjectsStore, TailoredView, FilterBlock, FilterCriteria } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import ColorIconPicker, { IconData, iconLibrary } from "@/components/ColorIconPicker";
import { uploadIcon, uploadFile, deleteUpload } from '@/lib/api/uploads-api'
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Filter conditions mapping
const filterConditions: any = {
    "is": { title: "Is" },
    "is-not": { title: "Is Not" },
    "contains": { title: "Contains" },
    "does-not-contain": { title: "Does Not Contain" },
    "is-empty": { title: "Is Empty" },
    "is-not-empty": { title: "Is Not Empty" },
    "date-is-today": { title: "Is Today" },
    "date-is-this-week": { title: "Is This Week" },
    "date-is-this-month": { title: "Is This Month" },
    "date-is-between": { title: "Is Between" },
    "date-is-before": { title: "Is Before" },
    "date-is-after": { title: "Is After" },
    "date-equals": { title: "Is Date" },
    "greater-than": { title: "Greater Than" },
    "less-than": { title: "Less Than" },
    "equals": { title: "Equals" },
    "not-equals": { title: "Not Equals" },
};

// Field types and their supported filters
const fieldTypeFilters: Record<string, string[]> = {
    text: ["is", "is-not", "contains", "does-not-contain", "is-empty", "is-not-empty"],
    number: ["equals", "not-equals", "greater-than", "less-than", "is-empty", "is-not-empty"],
    date: ["date-equals", "date-is-today", "date-is-this-week", "date-is-this-month", "date-is-before", "date-is-after", "date-is-between", "is-empty", "is-not-empty"],
    "select-one": ["is", "is-not", "is-empty", "is-not-empty"],
    "select-many": ["contains", "does-not-contain", "is-empty", "is-not-empty"],
    people: ["is", "is-not", "is-empty", "is-not-empty"],
};

interface CreateViewProps {
    projectId: string;
}

export function CreateView({ projectId }: CreateViewProps) {
    const router = useRouter();
    const { addTailoredView, projects, getTaskCustomFields, getTaskStatusConfigs, getTaskPriorityConfigs } = useProjectsStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
    const { user } = useProfileStore();
    const project = projects.find(p => p.id === projectId);

    const [name, setName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [description, setDescription] = useState("");
    const [viewType, setViewType] = useState<string>("");
    const [groupBy, setGroupBy] = useState<string>("");

    // Icon State
    const [viewIcon, setViewIcon] = useState<string | null>(null);
    const [viewIconType, setViewIconType] = useState<'icon' | 'file'>('icon');
    const [viewIconId, setViewIconId] = useState<string | null>(null);
    const [selectedIconData, setSelectedIconData] = useState<IconData | null>(null);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [filters, setFilters] = useState<FilterCriteria[]>([]);

    const customFields = getTaskCustomFields(projectId);
    const availableFields = [
        { id: 'name', name: 'Task Name', type: 'text' },
        { id: 'status', name: 'Status', type: 'select-one' },
        { id: 'assignee', name: 'Assignee', type: 'people' },
        { id: 'priority', name: 'Priority', type: 'select-one' },
        { id: 'endDate', name: 'Due Date', type: 'date' },
        { id: 'labels', name: 'Labels', type: 'select-many' },
        ...customFields.map(cf => ({ id: cf.id, name: cf.name, type: cf.type })),
    ];

    const groupByOptions = React.useMemo(() => {
        const options = [
            { label: 'Status', option: 'status' },
            { label: 'Priority', option: 'priority' },
            { label: 'Assignee', option: 'assignee' },
            { label: 'Due Date', option: 'dueDate' },
            { label: 'None', option: 'none' },
        ];
        // Custom fields are currently disabled for grouping in ListView, so they shouldn't show here either
        return options;
    }, []);

    // Handle icon upload
    const handleIconUpload = async (file: File): Promise<{ id: string; url?: string }> => {
        try {
            const result = await uploadFile(file);
            setViewIconId(result.id);
            return result;
        } catch (error: any) {
            toast('error', { title: error?.message || 'Failed to upload icon' });
            throw error;
        }
    };

    // Handle icon delete
    const handleIconDelete = async (uploadId: string): Promise<void> => {
        try {
            await deleteUpload(uploadId);
            if (viewIconId === uploadId) {
                setViewIconId(null);
                setViewIcon(null);
                setSelectedIconData(null);
            }
        } catch (error: any) {
            toast('error', { title: error?.message || 'Failed to delete icon' });
        }
    };

    // Handle icon selection
    const handleIconSelect = (iconData: IconData) => {
        setSelectedIconData(iconData);
        setViewIconType(iconData.type);

        if (iconData.type === "icon") {
            setViewIcon(iconData.icon ?? null);
            setViewIconId(iconData.iconId ?? null);
        } else {
            setViewIcon(iconData.image ?? null);
            setViewIconId(iconData.imageId ?? null);
        }
    };

    // Render icon display
    const renderIcon = () => {
        if (!viewIcon) {
            return <ImageIcon size={20} className="text-gray-400" />
        }

        if (viewIconType === 'file') {
            return (
                <img
                    src={viewIcon}
                    alt="View icon"
                    className="w-full h-full object-cover"
                />
            )
        }

        const iconObj = iconLibrary.find(i => i.name === viewIcon)
        if (iconObj) {
            const IconComponent = iconObj.icon
            return (
                <IconComponent
                    size={20}
                    color={selectedIconData?.color || '#001F3F'}
                />
            )
        }

        return <span className="text-xs">{viewIcon}</span>
    }

    const addFilter = () => {
        setFilters([...filters, {
            id: uuid(),
            field: "",
            condition: "is",
            value: "",
            operator: "AND"
        }]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const updateFilter = (id: string, updates: Partial<FilterCriteria>) => {
        setFilters(filters.map(f => {
            if (f.id === id) {
                const updated = { ...f, ...updates };
                // Reset condition and value if field changes
                if (updates.field && updates.field !== f.field) {
                    updated.condition = "is" as any;
                    updated.value = "";
                }
                return updated;
            }
            return f;
        }));
    };

    // Helper to get field details
    const getFieldById = (fieldId: string) => {
        return availableFields.find(f => f.id === fieldId);
    };

    // Get supported conditions for field
    const getConditionsForField = (fieldId: string): string[] => {
        const field = getFieldById(fieldId);
        if (!field) return ["is", "is-not"];
        return fieldTypeFilters[field.type] || ["is", "is-not"];
    };

    // Get value options for field
    const getValueOptionsForField = (fieldId: string): any[] => {
        const field = getFieldById(fieldId);
        if (!field) return [];

        if (fieldId === 'status') {
            const taskStatuses = getTaskStatusConfigs(projectId);
            return (taskStatuses || []).map(s => ({
                label: s.label,
                value: s.value,
                color: s.color,
                type: 'status'
            }));
        }

        if (fieldId === 'priority') {
            const taskPriorities = getTaskPriorityConfigs(projectId);
            return (taskPriorities || []).map(p => ({
                label: p.label,
                value: p.value,
                color: p.color,
                type: 'priority'
            }));
        }

        if (fieldId === 'assignee' || field.type === 'people') {
            return (project?.members || []).map(({ userId, role }) => {
                const wm = workspaceMembers.find(m => m.userId === userId);
                return {
                    label: wm?.name || userId,
                    value: userId,
                    avatar: wm?.profilePicture || null,
                    role: role,
                    type: 'people'
                };
            });
        }

        if (fieldId === 'labels') {
            return (currentWorkspace?.labels || []).map(label => ({
                label: label.name,
                value: label.id || label.name,
                color: label.color,
                type: 'labels'
            }));
        }

        const customField = customFields.find(cf => cf.id === fieldId);
        if (customField && (customField.type === 'select-one' || customField.type === 'select-many')) {
            return customField.options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.value;
                const color = typeof opt === 'string' ? null : opt.color;
                return { label: label || val, value: val, color, type: 'custom-select' };
            });
        }

        return [];
    };

    const renderValueInput = (filter: FilterCriteria) => {
        const field = getFieldById(filter.field);
        if (!field) return null;

        // Empty conditions don't need value input
        if (filter.condition === "is-empty" || filter.condition === "is-not-empty") {
            return (
                <div className="px-3 py-2 text-xs text-gray-400 italic bg-gray-50 border border-gray-200 rounded h-10 flex items-center">
                    Value not required
                </div>
            );
        }

        // Special date conditions
        if (["date-is-today", "date-is-this-week", "date-is-this-month"].includes(filter.condition)) {
            const today = new Date();
            let displayText = format(today, "MMM d, yyyy");

            if (filter.condition === "date-is-this-week") {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                displayText = `${format(startOfWeek, "MMM d")} - ${format(endOfWeek, "MMM d, yyyy")}`;
            } else if (filter.condition === "date-is-this-month") {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                displayText = `${format(startOfMonth, "MMM d")} - ${format(endOfMonth, "MMM d, yyyy")}`;
            }

            return (
                <div className="px-3 py-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded h-10 flex items-center">
                    {displayText}
                </div>
            );
        }

        const options = getValueOptionsForField(filter.field);
        if (options.length > 0) {
            return (
                <Select
                    value={filter.value}
                    onValueChange={(val) => updateFilter(filter.id, { value: val })}
                >
                    <SelectTrigger className="h-10 bg-gray-50 border-gray-200 focus:ring-0">
                        <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                    {opt.type === 'status' && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                    )}
                                    {opt.type === 'labels' && opt.color && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                    )}
                                    {opt.type === 'priority' && (
                                        <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${opt.color}20` }}>
                                            <Flag className="h-3 w-3" style={{ color: opt.color }} />
                                        </div>
                                    )}
                                    {opt.type === 'people' && (
                                        <div className="flex items-center gap-2">
                                            {opt.avatar ? (
                                                <img src={opt.avatar} alt={opt.label} className="w-5 h-5 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white uppercase">{opt.label?.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {opt.type === 'custom-select' && opt.color && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-xs">{opt.label}</span>
                                        {opt.type === 'people' && opt.role && (
                                            <span className="text-[10px] text-gray-400 -mt-1">{opt.role}</span>
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (field.type === 'date') {
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal h-10 bg-gray-50 border-gray-200",
                                !filter.value && "text-muted-foreground"
                            )}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            {filter.value ? format(new Date(filter.value), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={filter.value ? new Date(filter.value) : undefined}
                            onSelect={(date) => updateFilter(filter.id, { value: date ? date.toISOString() : "" })}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );
        }

        if (field.type === 'number') {
            return (
                <Input
                    type="number"
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Enter number"
                    className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-0"
                />
            );
        }

        return (
            <Input
                placeholder="Enter value"
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-0"
            />
        );
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        // Auto-generate identifier from first 3 characters (alphanumeric only)
        const autoId = value.slice(0, 3).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        setIdentifier(autoId);
    };

    const handleCreate = async () => {
        if (!name) {
            toast('error', { title: "Please enter a view name" });
            return;
        }
        if (!viewType) {
            toast('error', { title: "Please select a view type" });
            return;
        }

        setLoading(true);
        try {
            let finalIconId = viewIconId;

            // Handle icon library upload if needed
            if (selectedIconData && selectedIconData.type === "icon" && !viewIconId) {
                const iconUploadResult = await uploadIcon({
                    icon: {
                        name: selectedIconData.icon || "default",
                        color: selectedIconData.color,
                    },
                });
                finalIconId = iconUploadResult.id;
            }

            const newTailoredView: TailoredView = {
                id: uuid(),
                name,
                identifier,
                description,
                type: viewType as any,
                projectId,
                iconId: finalIconId, // API reference
                icon: selectedIconData ? {
                    iconId: finalIconId || "",
                    type: viewIconType,
                    name: viewIcon || identifier.charAt(0),
                    color: selectedIconData.color,
                } : null,
                color: selectedIconData?.color || "#001F3F",
                filters: {
                    id: uuid(),
                    operator: "AND",
                    children: filters
                },
                groupBy: groupBy,
                userId: user?.id || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await addTailoredView(newTailoredView);
            toast('success', { title: "View created successfully!" });
            router.push(`/project/${projectId}/views/${newTailoredView.id}`);
        } catch (err: any) {
            toast('error', { title: err?.message || "Failed to create view" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white flex flex-col w-full">
            <div className="flex-1 flex flex-col">
                <div className="w-full p-6 bg-white">
                    <div className="space-y-6">
                        {/* View Info Section */}
                        <div style={{ backgroundColor: '#F2F2F7' }} className="rounded-lg p-4">
                            <div className="flex items-start gap-4">
                                {/* Icon Section */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-gray-500 mb-2 h-4">Icon</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsIconPickerOpen(true)}
                                        className="w-10 h-10 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors overflow-hidden group relative"
                                    >
                                        {renderIcon()}
                                    </button>
                                </div>

                                {/* View Name */}
                                <div className="w-80">
                                    <label className="block text-xs font-medium text-gray-500 mb-2 h-4">View name</label>
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={handleNameChange}
                                        placeholder="e.g. Marketing"
                                        className="h-10 bg-white border-gray-300 focus-visible:ring-[#001F3F]"
                                    />
                                </div>

                                {/* View Identifier */}
                                <div className="w-80">
                                    <label className="block text-xs font-medium text-gray-500 mb-2 h-4">View identifier</label>
                                    <Input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="e.g. MAR"
                                        className="h-10 bg-white border-gray-300 uppercase focus-visible:ring-[#001F3F]"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* View Description */}
                        <div className="border-l-4 border-l-[#001F3F] border border-gray-200 rounded-lg p-4 bg-white mb-6 shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-black">View description</h1>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                        Add a detailed description for this tailored view to help your team understand its purpose.
                                    </p>
                                    <div className="min-h-[150px] border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                        <ProseMirrorEditor
                                            initialContent={description}
                                            onBlur={(content) => setDescription(content)}
                                            placeholder="Write something..."
                                            className="border-0 shadow-none ring-0 min-h-[150px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* View Type Selection */}
                        <div className="border border-gray-200 border-l-4 border-l-[#001F3F] rounded-lg p-4 bg-white mb-6 shadow">
                            <div className="flex justify-between items-center">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-black">Select view type</h1>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Select the layout type (List, Board, etc.) in which you want to apply the filters.
                                    </p>
                                </div>
                                <div className="flex-none">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="w-xs justify-between bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-3 font-normal"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {viewType === 'list' && <List className="h-4 w-4 text-gray-500" />}
                                                    {viewType === 'kanban' && <SquareKanban className="h-4 w-4 text-gray-500" />}
                                                    {viewType === 'gantt' && <ChartGantt className="h-4 w-4 text-gray-500" />}
                                                    {viewType === 'attachments' && <Paperclip className="h-4 w-4 text-gray-500" />}
                                                    <span className={!viewType ? "text-gray-400" : ""}>
                                                        {viewType ? (
                                                            viewType === 'list' ? 'List' :
                                                                viewType === 'kanban' ? 'Kanban' :
                                                                    viewType === 'gantt' ? 'Gantt' :
                                                                        viewType === 'attachments' ? 'Attachments' : viewType
                                                        ) : "Select"}
                                                    </span>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[320px]">
                                            <DropdownMenuItem onClick={() => setViewType("list")} className="gap-2 cursor-pointer">
                                                <List className="h-4 w-4 text-gray-500" />
                                                <span>List</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setViewType("kanban"); setGroupBy("status"); }} className="gap-2 cursor-pointer">
                                                <SquareKanban className="h-4 w-4 text-gray-500" />
                                                <span>Kanban</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setViewType("gantt"); setGroupBy("none"); }} className="gap-2 cursor-pointer">
                                                <ChartGantt className="h-4 w-4 text-gray-500" />
                                                <span>Gantt</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                        {/* Group By Selection */}
                        <div className={cn(
                            "border border-gray-200 border-l-4 border-l-[#001F3F] rounded-lg p-4 bg-white mb-6 shadow transition-opacity",
                            viewType === 'gantt' && "opacity-50 grayscale-[0.5]"
                        )}>
                            <div className="flex justify-between items-center">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-black flex items-center gap-2">
                                        Group by
                                        {viewType === 'gantt' && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                Not Supported
                                            </span>
                                        )}
                                    </h1>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {viewType === 'gantt'
                                            ? `Grouping is not yet supported for ${viewType} view. It will default to "None".`
                                            : "Select the field you want to group your tasks by in this view."
                                        }
                                    </p>
                                </div>
                                <div className={cn("flex-none", viewType === 'gantt' && "pointer-events-none")}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="w-xs justify-between bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-3 font-normal"
                                                disabled={viewType === 'gantt'}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={!groupBy ? "text-gray-400" : ""}>
                                                        {groupBy ? (
                                                            groupByOptions.find(o => o.option === groupBy)?.label || groupBy
                                                        ) : "Select field"}
                                                    </span>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[320px]">
                                            {groupByOptions.map(option => (
                                                <DropdownMenuItem
                                                    key={option.option}
                                                    onClick={() => setGroupBy(option.option)}
                                                    className="gap-2 cursor-pointer"
                                                >
                                                    <span>{option.label}</span>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div className="border border-gray-200 border-l-4 border-l-[#001F3F] rounded-lg p-4 bg-white shadow">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-black">Filters</h1>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Customize your view by applying specific task filters that will be saved for this view.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {filters.length === 0 ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addFilter}
                                            className="gap-2 text-gray-600 bg-white border-gray-300 hover:bg-gray-50"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Add filter</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFilters([])}
                                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 font-semibold"
                                        >
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                {filters.map((filter, index) => (
                                    <div key={filter.id} className="flex items-center gap-3">
                                        <div className="w-20">
                                            {index === 0 ? (
                                                <div className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-500 font-medium h-10 flex items-center justify-center">
                                                    Where
                                                </div>
                                            ) : (
                                                <Select
                                                    value={filter.operator || "AND"}
                                                    onValueChange={(val) => updateFilter(filter.id, { operator: val as any })}
                                                >
                                                    <SelectTrigger className="h-10 bg-gray-50 border-gray-200 focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AND">AND</SelectItem>
                                                        <SelectItem value="OR">OR</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <Select
                                            value={filter.field}
                                            onValueChange={(val) => updateFilter(filter.id, { field: val })}
                                        >
                                            <SelectTrigger className="w-48 h-10 bg-gray-50 border-gray-200">
                                                <SelectValue placeholder="Filter field" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableFields.map(f => {
                                                    const isGrouped = f.id === groupBy ||
                                                        (f.id === 'endDate' && groupBy === 'dueDate') ||
                                                        `custom-${f.id}` === groupBy;

                                                    return (
                                                        <SelectItem
                                                            key={f.id}
                                                            value={f.id}
                                                            disabled={isGrouped}
                                                            className={cn(isGrouped && "opacity-50 cursor-not-allowed")}
                                                        >
                                                            {f.name}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={filter.condition}
                                            onValueChange={(val) => updateFilter(filter.id, { condition: val as any, value: "" })}
                                        >
                                            <SelectTrigger className="w-40 h-10 bg-gray-50 border-gray-200">
                                                <SelectValue placeholder="Condition" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getConditionsForField(filter.field).map(cond => (
                                                    <SelectItem key={cond} value={cond}>
                                                        {filterConditions[cond]?.title || cond}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="flex-1">
                                            {renderValueInput(filter)}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFilter(filter.id)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                {filters.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addFilter}
                                        className="gap-2 text-gray-600 bg-white border-gray-300 hover:bg-gray-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add filter</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-32 border-gray-300 text-gray-600 font-semibold h-11"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                className="w-40 bg-[#001F3F] text-white hover:bg-[#002B5C] font-semibold h-11"
                                onClick={handleCreate}
                                disabled={
                                    loading ||
                                    !name ||
                                    !viewType ||
                                    (viewType === 'kanban' && (groupBy === 'none' || !groupBy)) ||
                                    (!groupBy && viewType !== 'gantt') ||
                                    filters.length === 0 ||
                                    filters.some(f => !f.field || !f.condition || (f.condition !== 'is-empty' && f.condition !== 'is-not-empty' && !f.value))
                                }
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : (
                                    "Create View"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ColorIconPicker
                isOpen={isIconPickerOpen}
                onClose={() => setIsIconPickerOpen(false)}
                onSelect={handleIconSelect}
                currentIcon={viewIcon}
                currentColor={selectedIconData?.color || '#001F3F'}
                currentType={viewIconType}
                onUpload={handleIconUpload}
                onDelete={handleIconDelete}
            />
        </div>
    );
}
