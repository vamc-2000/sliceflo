"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, GripVertical, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CustomField } from "@/types/workspace.types";


interface Option {
  id: string;
  name: string;
  color: string;
}

//  SelectOne field config structure
interface SelectOneFieldConfig {
  fieldType: "select-one";
  name: string;
  description: string;
  options: Option[];
  sortOrder: "manual" | "alphabetical-az" | "alphabetical-za";
  defaultValue: string;
}

//  Props interface with proper typing
interface SelectOneConfigProps {
  setConfig: (config: SelectOneFieldConfig) => void;
  setCreateButtonDisabled: (disabled: boolean) => void;
  initialData?: CustomField; // ✅ Use CustomField type from workspace
}

const DEFAULT_COLORS = [
  "#007AFF", "#34C759", "#FF3B30", "#FF9500", "#FFCC00",
  "#8E8E93", "#5856D6", "#FF2D55", "#5AC8FA", "#4CD964",
  "#AF52DE", "#A2845E", "#BF5AF2", "#30B0C7"
];

const SelectOneConfig: React.FC<SelectOneConfigProps> = ({ 
  setConfig, 
  setCreateButtonDisabled,
  initialData 
}) => {
  //  Initialize from initialData (CustomField type)
  const [fieldName, setFieldName] = useState(initialData?.name || "");
  const [fieldDescription, setFieldDescription] = useState(initialData?.description || "");
  
  //  Parse options from initialData config
  const [options, setOptions] = useState<Option[]>(
    initialData?.config?.options || [{ id: "1", name: "", color: "#8E8E93" }]
  );
  const [selectedOption, setSelectedOption] = useState(
    initialData?.config?.defaultValue || "1"
  );
  const [sortOrder, setSortOrder] = useState<"manual" | "alphabetical-az" | "alphabetical-za">(
    initialData?.config?.sortOrder || "manual"
  );

  // Load initial data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFieldName(initialData.name || "");
      setFieldDescription(initialData.description || "");
      setOptions(initialData.config?.options || [{ id: "1", name: "", color: "#8E8E93" }]);
      setSelectedOption(initialData.config?.defaultValue || "1");
      setSortOrder(initialData.config?.sortOrder || "manual");
    }
  }, [initialData]);

  //  Update config whenever form changes
  useEffect(() => {
    setConfig({
      fieldType: "select-one",
      name: fieldName,
      description: fieldDescription,
      options,
      sortOrder,
      defaultValue: selectedOption,
    });
  }, [fieldName, fieldDescription, options, sortOrder, selectedOption, setConfig]);

  //  Enable/disable create button
  useEffect(() => {
    const hasValidName = fieldName.trim() !== "";
    const hasValidOptions = options.length > 0 && options.every((opt) => opt.name.trim() !== "");
    setCreateButtonDisabled(!(hasValidName && hasValidOptions));
  }, [options, fieldName, setCreateButtonDisabled]);

  //  Sort options based on selected sort order
  const sortedOptions = useMemo(() => {
    const optionsCopy = [...options];
    switch (sortOrder) {
      case "alphabetical-az":
        return optionsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case "alphabetical-za":
        return optionsCopy.sort((a, b) => b.name.localeCompare(a.name));
      case "manual":
      default:
        return optionsCopy;
    }
  }, [options, sortOrder]);

  const addNewOption = useCallback(() => {
    const newOption: Option = {
      id: Date.now().toString(),
      name: "",
      color: DEFAULT_COLORS[options.length % DEFAULT_COLORS.length],
    };
    setOptions((prev) => [...prev, newOption]);
  }, [options.length]);

  const updateOption = useCallback((id: string, name: string) => {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, name } : opt)));
  }, []);

  const updateOptionColor = useCallback((id: string, color: string) => {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, color } : opt)));
  }, []);

  const deleteOption = useCallback((id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
  }, []);


  const DraggableOption: React.FC<{
    option: Option;
    index: number;
  }> = ({ option, index }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localName, setLocalName] = useState(option.name);
    const [isDragging, setIsDragging] = useState(false);

    const handleInputBlur = useCallback(() => {
      setIsEditing(false);
      updateOption(option.id, localName);
    }, [option.id, localName]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          setIsEditing(false);
          updateOption(option.id, localName);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setIsEditing(false);
          setLocalName(option.name);
        }
      },
      [option.id, option.name, localName]
    );

    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors group",
          isDragging && "opacity-50"
        )}
      >
        <button
          className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => setSelectedOption(option.id)}
          className="flex-shrink-0"
        >
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selectedOption === option.id ? "border-opacity-100" : "border-gray-300"
            )}
            style={{
              borderColor: selectedOption === option.id ? option.color : undefined,
            }}
          >
            {selectedOption === option.id && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            )}
          </div>
        </button>

        <input
          type="text"
          placeholder="Enter option name..."
          value={isEditing ? localName : option.name}
          style={{ color: option.color }}
          className="flex-1 border-none focus:ring-0 focus:outline-none bg-transparent text-[13px]"
          onChange={(e) => setLocalName(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-5 h-5 rounded-full hover:scale-110 transition-transform flex-shrink-0"
              style={{ backgroundColor: option.color }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-3 border-b-[5px] border-[#001F3F] shadow-lg">
            <p className="text-[11px] font-semibold text-gray-500 mb-2">Color</p>
            <div className="grid grid-cols-5 gap-1.5">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateOptionColor(option.id, color)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform",
                    option.color === color ? "border-gray-900" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => deleteOption(option.id)}
          className="text-gray-400 hover:text-red-500 hover:scale-110 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="field-name" className="text-[12px] font-medium">
          Field name
        </Label>
        <Input
          id="field-name"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          placeholder="Enter name..."
          className="text-[13px] h-9"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-description" className="text-[12px] font-medium">
          Description
        </Label>
        <Textarea
          id="field-description"
          value={fieldDescription}
          onChange={(e) => setFieldDescription(e.target.value)}
          placeholder="Add a description..."
          className="text-[13px] min-h-[60px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[12px] font-medium">Dropdown Options</Label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-[12px] text-gray-500 hover:text-gray-700">
                Sort: {sortOrder === "manual" ? "Manual" : sortOrder === "alphabetical-az" ? "A-Z" : "Z-A"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-3 border-b-[5px] border-[#001F3F] shadow-lg">
              <p className="text-[11px] font-semibold text-gray-500 mb-2">Sort</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="manual"
                    checked={sortOrder === "manual"}
                    onChange={(e) => setSortOrder(e.target.value as "manual")}
                    className="w-4 h-4"
                  />
                  <span className="text-[12px]">Manual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="alphabetical-az"
                    checked={sortOrder === "alphabetical-az"}
                    onChange={(e) => setSortOrder(e.target.value as "alphabetical-az")}
                    className="w-4 h-4"
                  />
                  <span className="text-[12px]">Alphabetical A-Z</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="alphabetical-za"
                    checked={sortOrder === "alphabetical-za"}
                    onChange={(e) => setSortOrder(e.target.value as "alphabetical-za")}
                    className="w-4 h-4"
                  />
                  <span className="text-[12px]">Alphabetical Z-A</span>
                </label>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          {sortedOptions.map((option, index) => (
            <DraggableOption key={option.id} option={option} index={index} />
          ))}
        </div>

        <button
          onClick={addNewOption}
          className="w-full py-2 bg-gray-100 text-gray-600 rounded-md flex items-center justify-center gap-2 text-[12px] hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Option
        </button>
      </div>

      <button className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-100 rounded-md text-[12px] text-gray-600 hover:bg-gray-200 transition-colors">
        <span>More settings and permissions</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SelectOneConfig;
