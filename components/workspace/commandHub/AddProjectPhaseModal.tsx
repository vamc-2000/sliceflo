"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddProjectPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
  parentPhaseName?: string; // passed when adding a sub-phase
  editingPhase?: { name: string; color: string } | null;
}

const COLOR_OPTIONS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#10B981", // Green
  "#FBBF24", // Yellow
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#A855F7", // Violet
  "#92400E", // Brown
];

const AddProjectPhaseModal: React.FC<AddProjectPhaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  parentPhaseName,
  editingPhase,
}) => {
  const [phaseName, setPhaseName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    if (isOpen && editingPhase) {
      setPhaseName(editingPhase.name);
      setSelectedColor(editingPhase.color);
    } else if (isOpen && !editingPhase) {
      setPhaseName("");
      setSelectedColor(COLOR_OPTIONS[0]);
    }
  }, [isOpen, editingPhase]);

  const handleSave = () => {
    if (phaseName.trim()) {
      onSave({
        name: phaseName.trim(),
        color: selectedColor,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setPhaseName("");
    setSelectedColor(COLOR_OPTIONS[0]);
    onClose();
  };

  // Derive title based on context
  const modalTitle = editingPhase
    ? parentPhaseName
      ? "Edit sub-phase"
      : "Edit phase"
    : parentPhaseName
      ? `Add sub-phase`
      : "Add phase";

  const saveBtnLabel = editingPhase
    ? "Update"
    : parentPhaseName
      ? "Add sub-phase"
      : "Add phase";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 border-b-5 border-b-[#001F3F]"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-[18px] font-semibold">
                {modalTitle}
              </DialogTitle>
              {/* Show parent phase name as subtitle when adding sub-phase */}
              {parentPhaseName && (
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Under: <span className="font-medium text-gray-700">{parentPhaseName}</span>
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-3 py-2 space-y-2.5">

          {/* Phase Name */}
          <div className="space-y-1">
            <Label htmlFor="phase-name" className="text-[14px] font-medium">
              {parentPhaseName ? "Sub-phase name" : "Phase name"}
            </Label>
            <Input
              id="phase-name"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              placeholder={parentPhaseName ? "e.g. Planning Draft" : "e.g. Planning"}
              className="text-[14px] h-10"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-[14px] font-medium">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {/* No color / white option */}
              <button
                onClick={() => setSelectedColor("#000000")}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${selectedColor === "#000000"
                    ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                    : "border-gray-300"
                  }`}
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="w-5 h-0.5 bg-gray-400 rotate-45 absolute" />
              </button>

              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${selectedColor === color
                      ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                      : "border-transparent"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-[13px] h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!phaseName.trim()}
            className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-[13px] h-9"
          >
            {saveBtnLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectPhaseModal;