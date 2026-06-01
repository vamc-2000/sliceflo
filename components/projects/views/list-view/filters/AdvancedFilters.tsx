// components/projects/views/list-view/filters/AdvancedFilters.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { v4 as uuid } from "uuid";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";

// Types
export type FilterConditionId =
  | "is" | "is-not" | "contains" | "does-not-contain"
  | "is-empty" | "is-not-empty"
  | "date-is-today" | "date-is-this-week" | "date-is-this-month"
  | "date-is-between" | "date-is-before" | "date-is-after"
  | "greater-than" | "less-than" | "equals" | "not-equals";

export interface FilterCriteria {
  id: string;
  field: string;
  condition: FilterConditionId;
  value: any;
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
  "greater-than": { title: "Greater Than" },
  "less-than": { title: "Less Than" },
  "equals": { title: "Equals" },
  "not-equals": { title: "Not Equals" },
};

// Field types and their supported filters
const fieldTypeFilters: Record<string, FilterConditionId[]> = {
  text: ["is", "is-not", "contains", "does-not-contain", "is-empty", "is-not-empty"],
  number: ["equals", "not-equals", "greater-than", "less-than", "is-empty", "is-not-empty"],
  date: ["date-is-today", "date-is-this-week", "date-is-this-month", "date-is-before", "date-is-after", "date-is-between", "is-empty", "is-not-empty"],
  "select-one": ["is", "is-not", "is-empty", "is-not-empty"],
  "select-many": ["contains", "does-not-contain", "is-empty", "is-not-empty"],
  people: ["is", "is-not", "is-empty", "is-not-empty"],
};

export default function AdvancedFilters({
  open,
  onClose,
  onApply,
  currentFilterBlock,
  projectId
}: AdvancedFiltersProps) {
  const { getTaskCustomFields, projects } = useProjectsStore();
  const { workspaceMembers } = useWorkspaceStore();

  const currentProject = projects.find(p => p.id === projectId);
  const customFields = getTaskCustomFields(projectId);

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
      }],
    };
  });

  // Available fields
  const availableFields = [
    { id: 'name', name: 'Task Name', type: 'text' },
    { id: 'status', name: 'Status', type: 'select-one' },
    { id: 'priority', name: 'Priority', type: 'select-one' },
    { id: 'endDate', name: 'Due Date', type: 'date' },
    { id: 'assignee', name: 'Assignee', type: 'people' },
    ...customFields.map(cf => ({ id: cf.id, name: cf.name, type: cf.type })),
  ];

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
  const getValueOptionsForField = (fieldId: string): string[] => {
    const field = getFieldById(fieldId);
    if (!field) return [];

    if (fieldId === 'assignee' || field.type === 'people') {
      return (currentProject?.members || []).map(({ userId }) => {
        const wm = workspaceMembers.find(m => m.userId === userId);
        return wm?.name || userId;
      });
    }

    const customField = customFields.find(cf => cf.id === fieldId);
    if (customField && (customField.type === 'select-one' || customField.type === 'select-many')) {
      return customField.options.map(opt => typeof opt === 'string' ? opt : opt.value);
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
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    // Date input
    if (field.type === 'date') {
      return (
        <Input
          type="date"
          value={criteria.value}
          onChange={(e) => updateCriteria(criteria.id, { value: e.target.value })}
          className="border-0 border-b border-input rounded-none focus-visible:ring-0"
        />
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Operator Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Match:</span>
            <Button
              size="sm"
              variant={filterBlock.operator === "AND" ? "default" : "outline"}
              onClick={() => setFilterBlock(prev => ({ ...prev, operator: "AND" }))}
            >
              All (AND)
            </Button>
            <Button
              size="sm"
              variant={filterBlock.operator === "OR" ? "default" : "outline"}
              onClick={() => setFilterBlock(prev => ({ ...prev, operator: "OR" }))}
            >
              Any (OR)
            </Button>
          </div>

          {/* Criteria List */}
          {filterBlock.children.map((criteria, index) => (
            <div key={criteria.id} className="flex items-center gap-2 p-3 border rounded-lg">
              {/* Operator label */}
              <div className="w-16 text-xs font-medium text-muted-foreground">
                {index === 0 ? "Where" : filterBlock.operator}
              </div>

              {/* Field Select */}
              <select
                value={criteria.field}
                onChange={(e) => {
                  const newField = e.target.value;
                  const newCondition = getConditionsForField(newField)[0];
                  updateCriteria(criteria.id, { field: newField, condition: newCondition, value: "" });
                }}
                className="flex-1 px-3 py-2 text-xs border-b border-input bg-transparent focus:outline-none"
              >
                <option value="">Select field</option>
                {availableFields.map(field => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>

              {/* Condition Select */}
              <select
                value={criteria.condition}
                onChange={(e) => updateCriteria(criteria.id, { condition: e.target.value as FilterConditionId, value: "" })}
                disabled={!criteria.field}
                className="flex-1 px-3 py-2 text-xs border-b border-input bg-transparent focus:outline-none disabled:opacity-50"
              >
                {getConditionsForField(criteria.field).map(cond => (
                  <option key={cond} value={cond}>
                    {filterConditions[cond]?.title || cond}
                  </option>
                ))}
              </select>

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

          {/* Add Criteria Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={addCriteria}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Filter Criteria
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!isValid()}>
            Apply Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
