"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Label } from "@/types/labels.types";

const AVAILABLE_COLORS = [
  "#007AFF", "#34C759", "#FF3B30", "#FF9500", "#FFCC00", "#8E8E93",
  "#5856D6", "#FF2D55", "#5AC8FA", "#4CD964", "#FF6B6B", "#A2845E",
];

interface LabelDialogProps {
  open: boolean;
  onClose: () => void;
  editingLabel?: Label | null;
  workspaceId: string;
  onSuccess?: (label: Label) => void;
}

export const LabelDialog: React.FC<LabelDialogProps> = ({
  open,
  onClose,
  editingLabel,
  workspaceId,
  onSuccess,
}) => {
  const { addLabel, updateLabel, isLoading } = useWorkspaceStore();
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(AVAILABLE_COLORS[0]);

  const isEditMode = !!editingLabel;

  useEffect(() => {
    if (open) {
      if (editingLabel) {
        setLabelName(editingLabel.name);
        setLabelColor(editingLabel.color);
      } else {
        setLabelName("");
        setLabelColor(AVAILABLE_COLORS[0]);
      }
    }
  }, [open, editingLabel]);

  const handleSave = async () => {
    if (!workspaceId || !labelName.trim()) return;

    try {
      if (isEditMode && editingLabel) {
        await updateLabel(workspaceId, editingLabel.id, {
          name: labelName.trim(),
          color: labelColor,
        });
        onSuccess?.({ ...editingLabel, name: labelName.trim(), color: labelColor });
      } else {
        // addLabel in workspaceStore returns void but updates currentWorkspace
        // We'll rely on the store update or we can modify it to return the label
        await addLabel(workspaceId, {
          name: labelName.trim(),
          color: labelColor,
        });
        // Since addLabel doesn't return the new label, we might need to find it in the store
        // but for now, we'll just close
        onSuccess?.({
          id: "temp", name: labelName.trim(), color: labelColor,
          workspaceId: "",
          tenantId: "",
          createdAt: "",
          updatedAt: ""
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save label:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border border-b-[5px] border-b-primary bg-card shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-bold text-foreground">
              {isEditMode ? "Edit Label" : "Create Label"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="hover:bg-muted rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Label Name */}
          <div className="space-y-2">
            <FormLabel htmlFor="label-name" className="text-[14px] font-bold text-foreground uppercase tracking-wider">
              Label Name
            </FormLabel>
            <Input
              id="label-name"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && labelName.trim()) {
                  handleSave();
                }
              }}
              placeholder="e.g. Priority, Bug, Feature"
              className="text-[15px] h-11 rounded-lg border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <FormLabel className="text-[14px] font-bold text-foreground uppercase tracking-wider">Color Palette</FormLabel>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setLabelColor(color)}
                  className={`w-9 h-9 rounded-full border-4 hover:scale-110 transition-all duration-200 shadow-sm ${labelColor === color
                    ? "border-background ring-4 ring-primary scale-110"
                    : "border-background hover:border-muted"
                    }`}
                  style={{ backgroundColor: color }}
                  type="button"
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[14px] h-10 font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!labelName.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-[14px] h-10 font-bold px-8 rounded-lg shadow-lg active:scale-95 transition-all"
          >
            {isEditMode ? "Update Changes" : "Save Label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
