// components/projects/views/list-view/filters/AdvancedFilters.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { v4 as uuid } from "uuid";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Plus, X, Clock } from "lucide-react";

import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";

// Types
export type FilterConditionId =
    | "is" | "is-not" | "contains" | "does-not-contain"
    | "is-empty" | "is-not-empty"
    | "date-is-today" | "date-is-this-week" | "date-is-this-month"
    | "date-is-between" | "date-is-before" | "date-is-after" | "date-equals"
    | "greater-than" | "less-than" | "equals" | "not-equals";

export interface FilterCriteria {
    id: string;
    field: string;
    condition: FilterConditionId;
    value: any;
    operator?: "AND" | "OR";
}

export interface FilterBlock {
    id: string;
    operator: "AND" | "OR";
    children: FilterCriteria[];
}

interface AdvancedFiltersProps {
    open: boolean;
    onClose: () => void;
    onApply: (filterBlock: FilterBlock) => void;
    currentFilterBlock?: FilterBlock | null;
    projectId: string;
    groupBy?: string;
}

// Filter conditions mapping
const filterConditions: Record<FilterConditionId, { title: string }> = {
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
const fieldTypeFilters: Record<string, FilterConditionId[]> = {
    text: ["is", "is-not", "contains", "does-not-contain", "is-empty", "is-not-empty"],
    number: ["equals", "not-equals", "greater-than", "less-than", "is-empty", "is-not-empty"],
    date: ["date-equals", "date-is-today", "date-is-this-week", "date-is-this-month", "date-is-before", "date-is-after", "date-is-between", "is-empty", "is-not-empty"],
    "select-one": ["is", "is-not", "is-empty", "is-not-empty"],
    "select-many": ["contains", "does-not-contain", "is-empty", "is-not-empty"],
    people: ["is", "is-not", "is-empty", "is-not-empty"],
};

export default function AdvancedFiltersNew({
    open,
    onClose,
    onApply,
    currentFilterBlock,
    projectId,
    groupBy
}: AdvancedFiltersProps) {
    const { getTaskCustomFields, projects, getTaskStatusConfigs, getTaskPriorityConfigs } = useProjectsStore();
    const { workspaceMembers, currentWorkspace } = useWorkspaceStore();

    const currentProject = projects.find(p => p.id === projectId);
    const customFields = getTaskCustomFields(projectId);
    const taskStatusConfigs = getTaskStatusConfigs(projectId);
    const taskPriorityConfigs = getTaskPriorityConfigs(projectId);

    // Initialize filter block
    const [filterBlock, setFilterBlock] = useState<FilterBlock>(() => {
        if (currentFilterBlock && currentFilterBlock.children.length > 0) {
            return currentFilterBlock;
        }
        return {
            id: uuid(),
            operator: "AND",
            children: [{
                id: uuid(),
                field: "",
                condition: "is",
                value: "",
                operator: "AND",
            }],
        };
    });

    // Available fields
    const availableFields = [
        { id: 'name', name: 'Task Name', type: 'text' },
        { id: 'status', name: 'Status', type: 'select-one' },
        { id: 'cycle', name: 'Cycle', type: 'select-one' },
        { id: 'assignee', name: 'Assignee', type: 'people' },
        { id: 'priority', name: 'Priority', type: 'select-one' },
        { id: 'dueDate', name: 'Due Date', type: 'date' },
        { id: 'labels', name: 'Labels', type: 'select-many' },
        ...customFields.map(cf => ({ id: cf.id, name: cf.name, type: cf.type })),
    ];

    const [activeTab, setActiveTab] = useState<"advanced" | "saved">("advanced")

    // Get field by ID
    const getFieldById = (fieldId: string) => {
        return availableFields.find(f => f.id === fieldId);
    };

    // Get supported conditions for field
    const getConditionsForField = (fieldId: string): FilterConditionId[] => {
        const field = getFieldById(fieldId);
        if (!field) return ["is", "is-not"];
        return fieldTypeFilters[field.type] || ["is", "is-not"];
    };

    // Get value options for field
    const getValueOptionsForField = (fieldId: string): { value: string, label: string }[] => {
        const field = getFieldById(fieldId);
        if (!field) return [];

        if (fieldId === 'status') {
            return taskStatusConfigs.map(c => ({ value: c.value, label: c.label }));
        }

        if (fieldId === 'priority') {
            return taskPriorityConfigs.map(c => ({ value: c.value, label: c.label }));
        }

        if (fieldId === 'cycle') {
            const cycles = currentProject?.cycles || [];
            return cycles.map(c => ({ value: c.id, label: c.name }));
        }

        if (fieldId === 'labels') {
            const labels = currentWorkspace?.labels || [];
            return labels.map(l => ({ value: l.id, label: l.name }));
        }

        if (fieldId === 'assignee' || field.type === 'people') {
            return (currentProject?.members || []).map(({ userId }) => {
                const wm = workspaceMembers.find(m => m.userId === userId);
                return { value: userId, label: wm?.name || userId };
            });
        }

        const customField = customFields.find(cf => cf.id === fieldId);
        if (customField && (customField.type === 'select-one' || customField.type === 'select-many')) {
            return customField.options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt : opt.value;
                return { value: val, label: lab };
            });
        }

        return [];
    };

    // Update criteria
    const updateCriteria = (criteriaId: string, updates: Partial<FilterCriteria>) => {
        setFilterBlock(prev => ({
            ...prev,
            children: prev.children.map(criteria =>
                criteria.id === criteriaId ? { ...criteria, ...updates } : criteria
            ),
        }));
    };

    // Add criteria
    const addCriteria = () => {
        setFilterBlock(prev => ({
            ...prev,
            children: [
                ...prev.children,
                {
                    id: uuid(),
                    field: "",
                    condition: "is",
                    value: "",
                    operator: "AND",
                },
            ],
        }));
    };

    // Remove criteria
    const removeCriteria = (criteriaId: string) => {
        setFilterBlock(prev => ({
            ...prev,
            children: prev.children.filter(c => c.id !== criteriaId),
        }));
    };

    // Validate
    const isValid = () => {
        return filterBlock.children.some(criteria => {
            const isEmptyCondition = criteria.condition === "is-empty" || criteria.condition === "is-not-empty";
            const isSpecialDateCondition = ["date-is-today", "date-is-this-week", "date-is-this-month"].includes(criteria.condition);
            return criteria.field && criteria.condition && (isEmptyCondition || isSpecialDateCondition || criteria.value);
        });
    };

    // Handle apply
    const handleApply = () => {
        if (!isValid()) {
            alert("Please complete at least one filter criteria");
            return;
        }
        onApply(filterBlock);
        onClose();
    };

    // Render value input
    const renderValueInput = (criteria: FilterCriteria) => {
        const field = getFieldById(criteria.field);
        if (!field) return null;

        // Empty conditions don't need value
        if (criteria.condition === "is-empty" || criteria.condition === "is-not-empty") {
            return (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                    {criteria.condition === "is-empty" ? "Empty" : "Not Empty"}
                </div>
            );
        }

        // Special date conditions
        if (["date-is-today", "date-is-this-week", "date-is-this-month"].includes(criteria.condition)) {
            const today = new Date();
            let displayText = format(today, "MMM d, yyyy");

            if (criteria.condition === "date-is-this-week") {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                displayText = `${format(startOfWeek, "MMM d")} - ${format(endOfWeek, "MMM d, yyyy")}`;
            } else if (criteria.condition === "date-is-this-month") {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                displayText = `${format(startOfMonth, "MMM d")} - ${format(endOfMonth, "MMM d, yyyy")}`;
            }

            return (
                <div className="px-3 py-2 text-xs text-foreground">
                    {displayText}
                </div>
            );
        }

        // Dropdown for select fields
        const options = getValueOptionsForField(criteria.field);
        if (options.length > 0) {
            return (
                <select
                    value={criteria.value}
                    onChange={(e) => updateCriteria(criteria.id, { value: e.target.value })}
                    className="w-full px-3 py-2 text-xs border-b border-input bg-transparent focus:outline-none"
                >
                    <option value="">Select value</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        // Date input with Calendar Popover
        if (field.type === 'date') {
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-left font-normal border-0 border-b border-input rounded-none px-3",
                                !criteria.value && "text-muted-foreground"
                            )}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            {criteria.value ? format(new Date(criteria.value), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={criteria.value ? new Date(criteria.value) : undefined}
                            onSelect={(date) => updateCriteria(criteria.id, { value: date ? date.toISOString() : "" })}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );
        }

        // Number input
        if (field.type === 'number') {
            return (
                <Input
                    type="number"
                    value={criteria.value}
                    onChange={(e) => updateCriteria(criteria.id, { value: e.target.value })}
                    placeholder="Enter number"
                    className="border-0 border-b border-input rounded-none focus-visible:ring-0"
                />
            );
        }

        // Text input
        return (
            <Input
                type="text"
                value={criteria.value}
                onChange={(e) => updateCriteria(criteria.id, { value: e.target.value })}
                placeholder="Enter value"
                className="border-0 border-b border-input rounded-none focus-visible:ring-0"
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-150! max-h-[80vh] overflow-y-auto border-0 border-b-5 border-primary px-4 py-3">
                <DialogHeader>
                    <DialogTitle className="text-base">Filters</DialogTitle>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as "advanced" | "saved")}
                    className="w-full"
                >
                    <TabsList className="bg-transparent p-0 h-auto gap-6 shadow-none ring-0 focus:outline-none focus-visible:outline-none">
                        <TabsTrigger
                            value="advanced"
                            className="
                                bg-transparent px-0 pb-1 text-xs font-medium rounded-none border-0 border-b-2 border-transparent
                                data-[state=active]:border-primary
                                text-primary

                                shadow-none ring-0 outline-none

                                focus:outline-none
                                focus:ring-0
                                focus-visible:outline-none
                                focus-visible:ring-0
                                focus-visible:shadow-none

                                data-[state=active]:shadow-none
                                data-[state=active]:ring-0

                                transition-colors duration-200
                            "
                        >
                            Advanced Filters
                        </TabsTrigger>

                        {/* <TabsTrigger
                            value="saved"
                            className="
                                bg-transparent px-0 pb-1 text-xs font-medium rounded-none border-0 border-b-2 border-transparent
                                data-[state=active]:border-primary
                                text-primary

                                shadow-none ring-0 outline-none

                                focus:outline-none
                                focus:ring-0
                                focus-visible:outline-none
                                focus-visible:ring-0
                                focus-visible:shadow-none

                                data-[state=active]:shadow-none
                                data-[state=active]:ring-0

                                transition-colors duration-200
                            "
                        >
                            Saved Filters
                        </TabsTrigger> */}
                    </TabsList>
                    <div className="border-b border-border"></div>

                    {/* Advanced Filters Tab */}
                    <TabsContent value="advanced" className="pt-4 space-y-4">
                        {/* 👇 MOVE YOUR EXISTING ADVANCED FILTER UI HERE */}

                        {/* Criteria List */}
                        {filterBlock.children.map((criteria, index) => (
                            <div key={criteria.id} className="flex items-center gap-2">
                                {/* Operator label */}
                                <div className="w-16">
                                    {index === 0 ? (
                                        <span className="text-xs font-medium text-muted-foreground">Where</span>
                                    ) : (
                                        <div className="w-8!">
                                            <Select
                                                value={criteria.operator}
                                                onValueChange={(value) =>
                                                    updateCriteria(criteria.id, {
                                                        operator: value as "AND" | "OR",
                                                    })
                                                }
                                            >
                                                <SelectTrigger
                                                    className="
                                                    h-8 px-2 text-xs
                                                    bg-transparent
                                                    border-0 border-b border-input
                                                    rounded-none
                                                    shadow-none
                                                    focus:ring-0
                                                    "
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>

                                                <SelectContent className="min-w-12">
                                                    <SelectItem value="AND" className="justify-center text-xs">
                                                        AND
                                                    </SelectItem>
                                                    <SelectItem value="OR" className="justify-center text-xs">
                                                        OR
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Field Select */}
                                <Select
                                    value={criteria.field}
                                    onValueChange={(newField) => {
                                        updateCriteria(criteria.id, {
                                            field: newField,
                                            condition: undefined, // ✅ reset condition
                                            value: "",
                                        });
                                    }}
                                >
                                    <SelectTrigger className="flex-1 px-3 py-2 text-xs bg-transparent border-0 border-b-2 border-input rounded-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="Field" />
                                    </SelectTrigger>

                                    <SelectContent className="border-0 border-b-4 border-primary">
                                        {availableFields.map((field) => {
                                            // Handle custom field prefix and both dueDate/endDate for Date
                                            const isGrouped = field.id === groupBy ||
                                                (field.id === 'endDate' && groupBy === 'dueDate') ||
                                                `custom-${field.id}` === groupBy;
                                            return (
                                                <SelectItem
                                                    key={field.id}
                                                    value={field.id}
                                                    disabled={isGrouped}
                                                    className={cn("text-xs", isGrouped && "opacity-50 cursor-not-allowed")}
                                                >
                                                    {field.name}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>

                                {/* Condition Select */}
                                <Select
                                    value={criteria.condition ?? undefined}
                                    onValueChange={(value) =>
                                        updateCriteria(criteria.id, {
                                            condition: value as FilterConditionId,
                                            value: "",
                                        })
                                    }
                                    disabled={!criteria.field}
                                >

                                    <SelectTrigger
                                        className="flex-1 px-3 py-2 text-xs bg-transparent border-0 border-b-2 border-input rounded-none shadow-none focus:ring-0 disabled:opacity-50"
                                    >
                                        <SelectValue placeholder="Condition" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {getConditionsForField(criteria.field).map((cond) => (
                                            <SelectItem
                                                key={cond}
                                                value={cond}
                                                className="text-xs"
                                            >
                                                {filterConditions[cond]?.title || cond}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Value Input */}
                                <div className="flex-1">
                                    {renderValueInput(criteria)}
                                </div>

                                {/* Remove Button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeCriteria(criteria.id)}
                                    disabled={filterBlock.children.length === 1}
                                    className="text-muted-foreground hover:text-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={addCriteria}
                            className="
                                w-full justify-start gap-2 px-0 text-muted-foreground text-xs
                                hover:bg-transparent
                                hover:text-primary
                                underline-offset-4 hover:underline
                            "
                        >
                            <Plus className="h-4 w-4 text-primary" />
                            Add Nested Filter
                        </Button>

                    </TabsContent>

                    {/* <div className="h-4 w-px bg-[#D1D1D6]" /> */}

                    {/* Saved Filters Tab */}
                    {/* <TabsContent value="saved" className="pt-4 space-y-4">
                        <div className="text-xs text-muted-foreground text-center py-10">
                            No saved filters yet
                        </div>

                    </TabsContent> */}
                </Tabs>

                <AnimatePresence>
                    {activeTab === "advanced" && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <DialogFooter className="sm:justify-end">
                                {/* <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="bg-muted border-input text-muted-foreground"
                                >
                                    Save & Apply Filter
                                </Button> */}

                                <Button
                                    onClick={handleApply}
                                    disabled={!isValid()}
                                    className="
                                    bg-primary text-primary-foreground text-xs
                                    hover:bg-primary/90
                                    disabled:bg-muted
                                    disabled:text-muted-foreground
                                    disabled:opacity-100
                    "
                                >
                                    Apply Filter
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}
                </AnimatePresence>


            </DialogContent>
        </Dialog>
    );
}
