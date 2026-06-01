
"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface AddStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string; backgroundColor: string }) => void;
  editingStatus?: { name: string; color: string; backgroundColor: string } | null;
}

const COLOR_OPTIONS = [
  { color: "#EF4444", bg: "#FEE2E2" }, // Red
  { color: "#F97316", bg: "#FFEDD5" }, // Orange
  { color: "#22C55E", bg: "#DCFCE7" }, // Green
  { color: "#FBBF24", bg: "#FEF3C7" }, // Yellow
  { color: "#06B6D4", bg: "#CFFAFE" }, // Cyan
  { color: "#3B82F6", bg: "#DBEAFE" }, // Blue
  { color: "#8B5CF6", bg: "#EDE9FE" }, // Purple
  { color: "#EC4899", bg: "#FCE7F3" }, // Pink
  { color: "#6B7280", bg: "#F3F4F6" }, // Gray
];

const AddStatusUpdateModal: React.FC<AddStatusUpdateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStatus,
}) => {
  const [updateName, setUpdateName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].color);
  const [selectedBg, setSelectedBg] = useState(COLOR_OPTIONS[0].bg);

  useEffect(() => {
    if (isOpen && editingStatus) {
      setUpdateName(editingStatus.name);
      setSelectedColor(editingStatus.color);
      setSelectedBg(editingStatus.backgroundColor);
    } else if (isOpen && !editingStatus) {
      // Reset for new status
      setUpdateName("");
      setSelectedColor(COLOR_OPTIONS[0].color);
      setSelectedBg(COLOR_OPTIONS[0].bg);
    }
  }, [isOpen, editingStatus]);

  const handleColorSelect = (color: string, bg: string) => {
    setSelectedColor(color);
    setSelectedBg(bg);
  };

  const handleSave = () => {
    if (updateName.trim()) {
      onSave({
        name: updateName.trim(),
        color: selectedColor,
        backgroundColor: selectedBg,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setUpdateName("");
    setSelectedColor(COLOR_OPTIONS[0].color);
    setSelectedBg(COLOR_OPTIONS[0].bg);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 border-b-5 border-b-[#001F3F]"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-semibold">
              {editingStatus ? "Edit Update" : "Add Update"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-3 py-2 space-y-2.5">
          {/* Update Name */}
          <div className="space-y-1">
            <Label htmlFor="update-name" className="text-[14px] font-medium">
              Update Name
            </Label>
            <Input
              id="update-name"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
              placeholder="e.g. On track"
              className="text-[14px] h-10"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-[14px] font-medium">Color</Label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleColorSelect("#000000", "#FFFFFF")}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${selectedColor === "#000000" ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300" : "border-gray-300"
                  }`}
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="w-5 h-0.5 bg-gray-400 rotate-45 absolute"></div>
              </button>

              {/* Color options */}
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.color}
                  onClick={() => handleColorSelect(option.color, option.bg)}
                  className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${selectedColor === option.color
                      ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                      : "border-transparent"
                    }`}
                  style={{ backgroundColor: option.color }}
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
            disabled={!updateName.trim()}
            className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-[13px] h-9"
          >
            {editingStatus ? "Update" : "Add update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStatusUpdateModal;
