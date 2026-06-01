"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, LayoutTemplate } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import ColorIconPicker, { IconData, iconComponentMap } from "@/components/ColorIconPicker";
import { cn } from "@/lib/utils";

interface WorkItemTypeData {
  name: string;
  pluralName: string;
  description: string;
  icon?: IconData | null;
}

interface AddWorkItemTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkItemTypeData) => void | Promise<void>;
  editingType?: Partial<WorkItemTypeData> | null;
  onUpload?: (file: File) => Promise<{ id: string; url?: string }>;
  onDelete?: (uploadId: string) => Promise<void>;
}

const AddWorkItemTypeModal: React.FC<AddWorkItemTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingType,
  onUpload,
  onDelete,
}) => {
  const [formData, setFormData] = useState<WorkItemTypeData>({
    name: "",
    pluralName: "",
    description: "",
    icon: null,
  });

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen && editingType) {
      setFormData({
        name: editingType.name || "",
        pluralName: editingType.pluralName || "",
        description: editingType.description || "",
        icon: editingType.icon ? {
          type: 'icon',
          icon: editingType.icon.icon || editingType.icon.name, // ✅ Handle both formats
          color: editingType.icon.color,
        } : null,
      });
    } else {
      setFormData({
        name: "",
        pluralName: "",
        description: "",
        icon: null,
      });
    }
  }, [isOpen, editingType]);

  const handleChange = (field: keyof WorkItemTypeData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIconSelect = (iconData: IconData) => {
    setFormData((prev) => ({ ...prev, icon: iconData }));
  };

  const handleSave = () => {
    if (formData.name.trim()) {
      onSave({
        name: formData.name.trim(),
        pluralName: formData.pluralName.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
      });
      onClose(); // Let parent handle closing for popover
    }
  };

  const renderIcon = () => {
    if (!formData.icon) {
      return <LayoutTemplate className="w-6 h-6 text-white" />;
    }

    if (formData.icon.type === 'file' && formData.icon.image) {
      return <img src={formData.icon.image} alt="Selected" className="w-full h-full object-cover rounded-md" />;
    }

    if (formData.icon.type === 'icon' && formData.icon.icon && iconComponentMap[formData.icon.icon]) {
      const IconComponent = iconComponentMap[formData.icon.icon];
      return <IconComponent size={24} color={formData.icon.color === 'transparent' ? '#000000' : '#ffffff'} />;
    }

    return <LayoutTemplate className="w-6 h-6 text-white" />;
  };

  const getIconBackgroundColor = () => {
    if (formData.icon?.color && formData.icon.color !== 'transparent') {
      return formData.icon.color;
    }
    return '#a855f7'; // Default purple
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-[600px] gap-0 border-b-5 border-b-[#001F3F]"
        aria-describedby={undefined}
      >
        {/* <VisuallyHidden>
          <DialogTitle>
            {editingType ? "Edit work item" : "Create work item"}
          </DialogTitle>
        </VisuallyHidden> */}

        <DialogHeader className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-semibold">
              {editingType ? "Edit work item" : "Create work item"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="w-full flex flex-col gap-0 bg-white">
          {/* <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-[18px] font-semibold text-[#0F172A]">
              {editingType ? "Edit work item" : "Create work item"}
            </h2>
          </div> */}

          <div className="p-4 space-y-6">
            <div className="flex gap-4">
              {/* Icon Selection */}
              <div className="space-y-2">
                <Label className="text-[14px] font-medium text-gray-500">Icon</Label>
                <div
                  onClick={() => setIsIconPickerOpen(true)}
                  className="w-10 h-10 rounded-md flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                  style={{ backgroundColor: getIconBackgroundColor() }}
                >
                  {renderIcon()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Singular Name */}
                <div className="space-y-2">
                  <Label htmlFor="singular-name" className="text-[14px] font-medium text-gray-500">Singular name</Label>
                  <div className="relative">
                    <Input
                      id="singular-name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Person"
                      className="h-10 pr-12 text-[14px]"
                      maxLength={16}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                      {formData.name.length}/16
                    </span>
                  </div>
                </div>

                {/* Plural Name */}
                <div className="space-y-2">
                  <Label htmlFor="plural-name" className="text-[14px] font-medium text-gray-500">Plural name</Label>
                  <div className="relative">
                    <Input
                      id="plural-name"
                      value={formData.pluralName}
                      onChange={(e) => handleChange("pluralName", e.target.value)}
                      placeholder="People"
                      className="h-10 pr-12 text-[14px]"
                      maxLength={16}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                      {formData.pluralName.length}/16
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[14px] font-medium text-gray-500">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your work item"
                className="min-h-[120px] text-[14px] resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-[14px] h-10 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="bg-[#F1F5F9] hover:bg-[#E2E8F0]  text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-100 disabled:text-gray-300 text-[14px] h-10 px-6 font-medium shadow-none border-none data-[state=active]:bg-[#001F3F] data-[state=active]:text-white"
              style={{
                backgroundColor: formData.name.trim() ? '#001F3F' : '#F1F5F9',
                color: formData.name.trim() ? 'white' : '#94A3B8',
              }}
            >
              {editingType ? "Update" : "Create work item"}
            </Button>
          </div>

          <ColorIconPicker
            isOpen={isIconPickerOpen}
            onClose={() => setIsIconPickerOpen(false)}
            onSelect={handleIconSelect}
            currentColor={formData.icon?.color || '#a855f7'}
            currentIcon={formData.icon?.type === 'icon' ? formData.icon.icon : formData.icon?.image}
            currentType={formData.icon?.type || 'icon'}
            onUpload={onUpload}
            onDelete={onDelete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkItemTypeModal;
