// components/list-view/customFields/TshirtSize.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, ChevronRight, Loader2 } from "lucide-react";
import { ColorPalette, DEFAULT_COLOR, PRESET_COLORS } from "./ColorPalette";

interface TshirtSizeOption {
    value: string;
    color: string;
}

interface TshirtSizeFieldProps {
    onSubmit: (data: {
        name: string;
        type: 'tshirt-size';
        description: string;
        options: TshirtSizeOption[];
    }) => void;
    onCancel: () => void;
    initialData?: { name: string; description?: string; options?: { value: string; color: string }[] };
}

const TSHIRT_OPTIONS = [
    { value: 'XS', color: '#FF9500' },
    { value: 'S', color: '#FFCC00' },
    { value: 'M', color: '#34C759' },
    { value: 'L', color: '#007AFF' },
    { value: 'XL', color: '#AF52DE' },
];

const getRandomUnusedColor = (existingColors: string[]): string => {
  const pool = PRESET_COLORS.filter(c => c !== 'transparent' && !existingColors.includes(c));
  if (pool.length === 0) {
    return DEFAULT_COLOR;
  }
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

export function TshirtSizeField({ onSubmit, onCancel, initialData }: TshirtSizeFieldProps) {
  const [loading, setLoading] = useState(false);
    const [fieldName, setFieldName] = useState(initialData?.name ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [options, setOptions] = useState<TshirtSizeOption[]>(
        initialData?.options?.length
            ? initialData.options.map(o => ({ value: o.value, color: o.color }))
            : TSHIRT_OPTIONS.map(opt => ({ value: opt.value, color: opt.color }))
    );
    const [showMoreSettings, setShowMoreSettings] = useState(false);
    const [activeColorPicker, setActiveColorPicker] = useState<number | null>(null);


    const addOption = () => {
        const existingColors = options.map(o => o.color);
        setOptions([...options, { value: '', color: getRandomUnusedColor(existingColors) }]);
    };

    const updateOption = (index: number, newValue: string) => {
        setOptions(options.map((opt, i) => i === index ? { ...opt, value: newValue } : opt));
    };

    const updateOptionColor = (index: number, color: string) => {
        setOptions(options.map((opt, i) => i === index ? { ...opt, color } : opt));
        setActiveColorPicker(null);
    };

    const deleteOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    }

    const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
        if (options.length === 0) return;
    setLoading(true);
    try {
      await onSubmit({
            name: fieldName,
            type: 'tshirt-size',
            description,
            options,
        });
      if (!initialData) {
        // Reset form
        setFieldName('');
        setDescription('');
        setOptions(TSHIRT_OPTIONS.map(opt => ({
            value: opt.value,
            color: opt.color,
        })));
        setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="flex flex-col h-full relative">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
                {/* Field Name */}
                <div className="space-y-2">
                    <label htmlFor="field-name" className="text-xs font-medium block">
                        Field name
                    </label>
                    <Input
            disabled={!!initialData}
                        id="field-name"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="Enter name..."
                        className="h-9"
                    />
                </div>

                {/* Dropdown Options with Sort Dropdown */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Dropdown Options</label>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveColorPicker(
                                            activeColorPicker === index ? null : index
                                        )}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10
                h-4 w-4 rounded-full border-2 border-background flex-shrink-0"
                                        style={{
                                            backgroundColor: option.color === 'transparent' ? 'white' : option.color,
                                            boxShadow: `0 0 0 1.5px ${option.color === 'transparent' ? '#d1d5db' : option.color}`,
                                        }}
                                    />
                                    <Input
                                        value={option.value}
                                        onChange={(e) => updateOption(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="h-9 pl-9 pr-3"
                                        style={{ color: option.color === 'transparent' ? undefined : option.color }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => deleteOption(index)}
                                    className="p-2 hover:bg-muted rounded flex-shrink-0"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={addOption}
                        className="w-full py-2 text-xs flex items-center justify-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        Add Option
                    </Button>
                </div>
                {/* More Settings Accordion - ALWAYS VISIBLE */}
                <button
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

            {/* Color Palette — same pattern as SelectOne */}
            {activeColorPicker !== null && (() => {
                const option = options[activeColorPicker];
                if (!option) return null;
                const otherColors = options.filter((_, idx) => idx !== activeColorPicker).map(o => o.color);
                return (
                    <ColorPalette
                        currentColor={option.color}
                        excludeColors={otherColors}
                        onSelect={(color) => updateOptionColor(activeColorPicker, color)}
                        onClose={() => setActiveColorPicker(null)}
                    />
                );
            })()}

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-9"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={(!fieldName.trim() || options.length === 0) || loading}
                    className="flex-1 h-9"
                >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <>{initialData ? 'Update Field' : 'Create'}</>
          )}
        </Button>
            </div>
        </div>
    );
}
