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

interface AddPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { label: string; value: string; description: string; color: string; order: number }) => void;
  editingPriority?: {
    label: string;
    value: string;
    description?: string;
    color: string;
    order: number;
  } | null;
  nextOrder?: number;
}

const COLOR_OPTIONS = [
  { color: "#EF4444", label: "Red" },
  { color: "#F97316", label: "Orange" },
  { color: "#22C55E", label: "Green" },
  { color: "#FBBF24", label: "Yellow" },
  { color: "#06B6D4", label: "Cyan" },
  { color: "#3B82F6", label: "Blue" },
  { color: "#8B5CF6", label: "Purple" },
  { color: "#EC4899", label: "Pink" },
  { color: "#9CA3AF", label: "Gray" },
  { color: "#F59E0B", label: "Amber" },
  { color: "#10B981", label: "Emerald" },
  { color: "#6B7280", label: "Slate" },
];

const AddPriorityModal: React.FC<AddPriorityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPriority,
  nextOrder = 1,
}) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[5].color); // Default blue

  useEffect(() => {
    if (isOpen && editingPriority) {
      setLabel(editingPriority.label);
      setDescription(editingPriority.description ?? "");
      setSelectedColor(editingPriority.color);
    } else if (isOpen && !editingPriority) {
      setLabel("");
      setDescription("");
      setSelectedColor(COLOR_OPTIONS[5].color);
    }
  }, [isOpen, editingPriority]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      value: label.trim().toLowerCase().replace(/\s+/g, "_"),
      description: description.trim(),
      color: selectedColor,
      order: editingPriority?.order ?? nextOrder,
    });
    handleClose();
  };

  const handleClose = () => {
    setLabel("");
    setDescription("");
    setSelectedColor(COLOR_OPTIONS[5].color);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 border-b-5 border-b-[#001F3F]"
        aria-describedby={undefined}
      >
        {/* Header */}
        <DialogHeader className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-semibold">
              {editingPriority ? "Edit Priority" : "Add Priority"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-3 py-2 space-y-2.5">

          {/* Label */}
          <div className="space-y-1">
            <Label htmlFor="priority-label" className="text-[14px] font-medium">
              Priority Name
            </Label>
            <Input
              id="priority-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Critical"
              className="text-[14px] h-10"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="priority-description" className="text-[14px] font-medium">
              Description
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </Label>
            <Input
              id="priority-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Needs immediate attention"
              className="text-[14px] h-10"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-[14px] font-medium">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {/* No color / clear option */}
              <button
                onClick={() => setSelectedColor("#000000")}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform relative ${
                  selectedColor === "#000000"
                    ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: "#FFFFFF" }}
                title="None"
              >
                <div className="w-5 h-0.5 bg-gray-400 rotate-45 absolute" />
              </button>

              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.color}
                  onClick={() => setSelectedColor(option.color)}
                  title={option.label}
                  className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${
                    selectedColor === option.color
                      ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: option.color }}
                />
              ))}
            </div>

            {/* Preview badge */}
            {label.trim() && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[12px] text-gray-500">Preview:</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                  style={{
                    backgroundColor: selectedColor + "20",
                    color: selectedColor,
                    border: `1px solid ${selectedColor}40`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  />
                  {label.trim()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
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
            disabled={!label.trim()}
            className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-[13px] h-9"
          >
            {editingPriority ? "Update" : "Add priority"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPriorityModal;