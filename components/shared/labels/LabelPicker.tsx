"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { LabelDialog } from "./LabelDialog";

interface LabelPickerProps {
  selectedLabelIds: string[];
  onSelect: (labelId: string) => void;
  onRemove: (labelId: string) => void;
  children: React.ReactNode;
}

export const LabelPicker: React.FC<LabelPickerProps> = ({
  selectedLabelIds,
  onSelect,
  onRemove,
  children,
}) => {
  const { currentWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const labels = useMemo(
    () => currentWorkspace?.labels || [],
    [currentWorkspace],
  );

  const filteredLabels = useMemo(() => {
    return labels.filter((label) =>
      label.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [labels, searchQuery]);

  const handleToggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onRemove(labelId);
    } else {
      onSelect(labelId);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 bg-popover border border-border border-b-[5px] border-b-primary"
          align="start"
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search labels..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredLabels.length > 0 ? (
              <div className="p-1 space-y-1">
                {filteredLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id)}
                      className="w-full p-0 focus:outline-none block"
                    >
                      <div
                        className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3 relative"
                        style={{ backgroundColor: label.color || "#c4c4c4" }}
                      >
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 absolute left-2 text-white" />
                        )}
                        <span className="truncate w-full text-center">
                          {label.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No labels found
              </div>
            )}
          </div>
          <div className="p-1 border-t border-border">
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center h-9 gap-2 px-2 rounded-xs bg-muted hover:bg-muted/80 transition-colors text-xs text-primary-text font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new label
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {currentWorkspace?.id && (
        <LabelDialog
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          workspaceId={currentWorkspace.id}
          onSuccess={(newLabel) => {
            // If the label was just created, we might want to select it
            // but since we don't have the REAL ID yet (from my temp label logic),
            // it's better to let the store update and the user select it from the list.
            // Or we could wait for the real ID.
          }}
        />
      )}
    </>
  );
};
