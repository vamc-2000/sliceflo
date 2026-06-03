// components/list-view/customFields/Location.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, MapPin, Loader2 } from "lucide-react";

interface LocationProps {
  onSubmit: (data: {
    name: string;
    type: 'location';
    description: string;
    required: boolean;
    defaultValue?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; defaultValue?: { address?: string } };
}

export function LocationField({ onSubmit, onCancel, initialData }: LocationProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [enableDefault, setEnableDefault] = useState(!!(initialData?.defaultValue?.address));
  const [defaultLocation, setDefaultLocation] = useState(initialData?.defaultValue?.address ?? '');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'location',
      description,
      required: false,
      defaultValue: enableDefault && defaultLocation.trim()
        ? {
            latitude: 0,
            longitude: 0,
            address: defaultLocation.trim(),
          }
        : undefined,
    });
      if (!initialData) {
        // Reset
    setFieldName('');
    setDescription('');
    setEnableDefault(false);
    setDefaultLocation('');
    setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

        {/* Field Name */}
        <div className="space-y-2">
          <label htmlFor="field-name" className="text-xs font-medium block">
            Field name
          </label>
          <Input data-testid="custom-field-name-input"
            disabled={!!initialData}
            id="field-name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Enter name..."
            className="h-9"
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
            placeholder="Add a description...."
            rows={2}
            className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Default Location Toggle */}
        <div className="flex items-center gap-3">
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enableDefault}
            onClick={() => setEnableDefault(prev => !prev)}
            className={`
              relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full 
              border-2 border-transparent transition-colors duration-200
              ${enableDefault ? 'bg-blue-600' : 'bg-muted'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-4 w-4 rounded-full bg-card shadow
                transform transition-transform duration-200
                ${enableDefault ? 'translate-x-4' : 'translate-x-0'}
              `}
            />
          </button>
          <span className="text-xs text-foreground">Default Location</span>
        </div>

        {/* Default Location Input — shown only when toggle is ON */}
        {enableDefault && (
          <div className="space-y-2">
            <label className="text-xs font-medium block">
              Default Location
            </label>
            <div className="relative">
              <Input
                value={defaultLocation}
                onChange={(e) => setDefaultLocation(e.target.value)}
                placeholder="Add a location...."
                className="h-9 pr-9"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* More Settings */}
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

        {showMoreSettings && (
          <div className="space-y-3 p-3 border rounded-md bg-muted">
            <p className="text-xs text-muted-foreground">Additional settings coming soon...</p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
        <Button data-testid="custom-field-cancel-btn" type="button" variant="outline" onClick={onCancel} className="flex-1 h-9">
          Cancel
        </Button>
        <Button data-testid="custom-field-submit-btn"
          type="button"
          onClick={handleSubmit}
          disabled={(!fieldName.trim()) || loading}
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