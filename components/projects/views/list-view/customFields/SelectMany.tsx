// components/list-view/customFields/SelectMany.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ChevronRight, ArrowUpDown, Loader2 } from "lucide-react";
import { ColorPalette, DEFAULT_COLOR, PRESET_COLORS } from "./ColorPalette";

interface SelectManyProps {
  onSubmit: (data: {
    name: string;
    type: 'select-many';
    description: string;
    options: { value: string; color: string }[];
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; options?: { value: string; color: string }[] };
}

const getRandomUnusedColor = (existingColors: string[]): string => {
  const pool = PRESET_COLORS.filter(c => c !== 'transparent' && !existingColors.includes(c));
  if (pool.length === 0) {
    return DEFAULT_COLOR;
  }
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

export function SelectMany({
  onSubmit,
  onCancel,
  initialData,
}: SelectManyProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [options, setOptions] = useState(() => {
    if (initialData?.options?.length) {
      return initialData.options.map(o => ({
        id: crypto.randomUUID(),
        label: o.value,
        color: o.color || DEFAULT_COLOR
      }));
    }
    return [{ id: crypto.randomUUID(), label: '', color: getRandomUnusedColor([]) }];
  });
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    const validOptions = options.filter(opt => opt.label.trim() !== '');
    if (!fieldName.trim() || validOptions.length === 0) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'select-many',
      description,
      options: validOptions.map(opt => ({
        value: opt.label.trim(),
        color: opt.color,
      })),

    });
      if (!initialData) {
        setFieldName('');
    setDescription('');
    setOptions([{ id: crypto.randomUUID(), label: '', color: getRandomUnusedColor([]) }]);
    setActiveColorPicker(null);
    setSortAsc(null);
    setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    const existingColors = options.map(o => o.color);
    setOptions([...options, {
      id: crypto.randomUUID(),
      label: '',
      color: getRandomUnusedColor(existingColors)
    }]);
    setSortAsc(null);
  };

  const removeOption = (id: string) => {
    if (options.length > 1) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOptionLabel = (id: string, value: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, label: value } : opt));
    setSortAsc(null);
  };

  const updateOptionColor = (id: string, color: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, color } : opt));
    setActiveColorPicker(null);
  };

  const handleCheckboxClick = (optionId: string) => {
    setActiveColorPicker(prev => prev === optionId ? null : optionId);
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {/* Field Name */}
        <div className="space-y-2">
          <label htmlFor="field-name" className="text-xs font-medium block">Field Name</label>
          <Input data-testid="custom-field-name-input"
            disabled={!!initialData}
            id="field-name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Enter name..."
            className="h-8"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-xs font-medium block">
            Description
          </label>
          <textarea data-testid="custom-field-description-input"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Dropdown Options</label>
            <button data-testid="custom-field-sort-options-btn"
              type="button"
              onClick={() => {
                setSortAsc(prev => {
                  const nextAsc = prev === null ? true : !prev;
                  setOptions(opts => [...opts].sort((a, b) =>
                    nextAsc
                      ? a.label.localeCompare(b.label)
                      : b.label.localeCompare(a.label)
                  ));
                  return nextAsc;
                });
              }}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              title={sortAsc === null ? 'Sort A→Z' : sortAsc ? 'Sort Z→A' : 'Sort A→Z'}
            >
              <ArrowUpDown className={`h-4 w-4 ${sortAsc !== null ? 'text-blue-500' : ''}`} />
            </button>
          </div>
          <div className="space-y-2">
            {/* AFTER — checkbox button inside input, same pattern as SelectOne */}
            {options.map((option) => (
              <div key={option.id} className="relative flex items-center gap-1.5">
                <div className="relative flex-1">

                  {/* Checkbox button inside input — Moved to right */}
                  <button data-testid={`custom-field-color-picker-trigger-${option.id}`}
                    type="button"
                    onClick={() => handleCheckboxClick(option.id)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10
                   h-4 w-4 rounded-xs flex-shrink-0
                   flex items-center justify-center"
                    style={{
                      backgroundColor: option.color === 'transparent' ? 'white' : option.color,
                      boxShadow: `0 0 0 1.5px ${option.color === 'transparent' ? '#d1d5db' : option.color}`,
                    }}
                  >
                    {/* Checkmark inside */}
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      viewBox="0 0 10 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <Input data-testid="custom-field-option-input"
                    value={option.label}
                    onChange={(e) => updateOptionLabel(option.id, e.target.value)}
                    placeholder="Option name"
                    className="h-9 pl-3 pr-9"
                    style={{
                      color: option.color === 'transparent' ? undefined : option.color,
                    }}
                  />
                </div>

                {options.length > 1 && (
                  <Button data-testid="custom-field-remove-option-btn"
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(option.id)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button data-testid="custom-field-add-option-btn"
            type="button"
            variant="secondary"
            size="sm"
            onClick={addOption}
            className="w-full h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>
        {/* More Settings Accordion - ALWAYS VISIBLE */}
        <button data-testid="custom-field-more-settings-btn"
          type="button"
          onClick={() => setShowMoreSettings(!showMoreSettings)}
          className="w-full flex items-center justify-between px-3 py-2 bg-muted hover:bg-muted rounded-md transition-colors"
        >
          <span className="text-xs text-muted-foreground">More settings and permissions</span>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${showMoreSettings ? 'rotate-90' : ''}`}
          />
        </button>

        {/* More Settings Content */}
        {showMoreSettings && (
          <div className="space-y-3 p-3 border rounded-md bg-muted">
            <p className="text-xs text-muted-foreground">
              Additional settings coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Color Palette — same as SelectOne */}
      {activeColorPicker && (() => {
        const option = options.find(o => o.id === activeColorPicker);
        if (!option) return null;
        const otherColors = options.filter(o => o.id !== activeColorPicker).map(o => o.color);
        return (
          <ColorPalette
            currentColor={option.color}
            excludeColors={otherColors}
            onSelect={(color) => updateOptionColor(option.id, color)}
            onClose={() => setActiveColorPicker(null)}
          />
        );
      })()}
    
      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
        <Button data-testid="custom-field-cancel-btn"
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-8"
        >
          Cancel
        </Button>
        <Button data-testid="custom-field-submit-btn"
          type="button"
          onClick={handleSubmit}
          disabled={(!fieldName.trim() || options.filter(o => o.label.trim()).length === 0) || loading}
          className="flex-1 h-8"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <>{initialData ? 'Update Field' : 'Create Field'}</>
          )}
        </Button>
      </div>
    </div>
  );
}



