"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
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
    [currentWorkspace]
  );

  const filteredLabels = useMemo(() => {
    return labels.filter((label) =>
      label.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        <PopoverContent className="w-64 p-0 bg-popover border border-border border-b-[5px] border-b-primary" align="start">
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
              <div className="p-1">
                {filteredLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-muted transition-colors text-left ${isSelected ? "bg-muted" : ""
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-[13px] text-foreground">{label.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-[12px] text-muted-foreground">
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
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted transition-colors text-left text-[13px] text-primary font-medium"
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
