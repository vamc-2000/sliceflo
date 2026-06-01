"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCustomField } from "@/stores/projects-store";

interface CustomizeFieldsPanelProps {
  customFields: TaskCustomField[];
  selectedFieldIds: string[];
  allSelected: boolean;
  toggleField: (id: string) => void;
  toggleAll: () => void;
}

const CustomizeFieldsPanel: React.FC<CustomizeFieldsPanelProps> = ({
  customFields,
  selectedFieldIds,
  allSelected,
  toggleField,
  toggleAll,
}) => {
  if (customFields.length === 0) {
    return (
      <p className="mt-3 px-1 text-xs text-muted-foreground">
        No custom fields found for this project.
      </p>
    );
  }

  // Split fields into two columns
  const half = Math.ceil(customFields.length / 2);
  const leftCol = customFields.slice(0, half);
  const rightCol = customFields.slice(half);

  return (
    <div className="mt-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          Select the fields you want to duplicate
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border",
              allSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-card"
            )}
          >
            {allSelected && (
              <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current">
                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </div>
          {allSelected ? "Unselect All" : "Select All"}
        </button>
      </div>

      {/* Two-column checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1">
        {[leftCol, rightCol].map((col, colIdx) => (
          <div key={colIdx} className="space-y-2">
            {col.map((field) => {
              const checked = selectedFieldIds.includes(field.id);
              return (
                <label
                  key={field.id}
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <div
                    onClick={() => toggleField(field.id)}
                    className={cn(
                      "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground bg-card"
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <span className="truncate">{field.name}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

type DuplicateMode = "structure" | "structure_items" | "structure_items_updates";

interface DuplicateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  originalProjectName: string;
  projectId: string;
  customFields?: TaskCustomField[];
  onDuplicate: (
    newName: string,
    mode: DuplicateMode,
    selectedFieldIds?: string[] // (used only in "structure" mode)
  ) => Promise<void>;
}

const DUPLICATE_OPTIONS: {
  value: DuplicateMode;
  label: string;
  description: string;
}[] = [
    {
      value: "structure_items_updates",
      label: "Everything",
      description: "Project structure, items & updates",
    },
    {
      value: "structure_items",
      label: "Tasks Only",
      description: "All properties, fields, and settings will not be duplicated.",
    },
    {
      value: "structure",
      label: "Customize",
      description: "Select the fields you want to duplicate",
    },
  ];

const DuplicateProjectDialog: React.FC<DuplicateProjectDialogProps> = ({
  open,
  onClose,
  originalProjectName,
  projectId,
  customFields,
  onDuplicate,
}) => {
  const [newName, setNewName] = useState(`${originalProjectName} (Copy)`);
  const [mode, setMode] = useState<DuplicateMode>("structure_items_updates");
  const [loading, setLoading] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setNewName(`${originalProjectName} (Copy)`);
      setMode("structure_items_updates");
      setLoading(false);
      // pre-select all fields
      setSelectedFieldIds((customFields ?? []).map((f) => f.id));
    }
  }, [open, originalProjectName, customFields]);

  const allSelected =
    (customFields ?? []).length > 0 &&
    selectedFieldIds.length === (customFields ?? []).length;

  const toggleField = (id: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedFieldIds([]);
    } else {
      setSelectedFieldIds((customFields ?? []).map((f) => f.id));
    }
  };

  const handleDuplicate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await onDuplicate(
        newName.trim(),
        mode,
        mode === "structure" ? selectedFieldIds : undefined  // ← pass only in customize mode
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] border-b-[5px] border-b-primary p-0 overflow-hidden">
        {/* Top content */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-bold">
              Duplicate project
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* New project name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                New project name
              </Label>
              <Input
                placeholder="Project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Choose what to duplicate */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Choose what to duplicate
              </Label>

              <div className="rounded-lg border p-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {DUPLICATE_OPTIONS.map((opt) => {
                    const isActive = mode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMode(opt.value)}
                        className={cn(
                          "h-8 rounded-md px-3 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Description line for Everything & Tasks Only */}
                {mode !== "structure" && (
                  <p className="mt-2 px-1 text-xs text-muted-foreground">
                    {DUPLICATE_OPTIONS.find((opt) => opt.value === mode)?.description}
                  </p>
                )}

                {/* Custom fields panel — only shown in Customize mode */}
                {mode === "structure" && (
                  <CustomizeFieldsPanel
                    customFields={customFields ?? []}
                    selectedFieldIds={selectedFieldIds}
                    allSelected={allSelected}
                    toggleField={toggleField}
                    toggleAll={toggleAll}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions with dark bar like the screenshot */}
        <DialogFooter className="flex items-center justify-between px-6 py-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!newName.trim() || loading}
            className="text-primary-foreground bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicating...
              </>
            ) : (
              "Duplicate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateProjectDialog;