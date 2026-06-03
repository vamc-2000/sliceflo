// components/list-view/customFields/IpAddress.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2 } from "lucide-react";

interface IpAddressFieldProps {
  onSubmit: (data: {
    name: string;
    type: 'ip-address';
    description: string;
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string };
}

export function IpAddressField({ onSubmit, onCancel, initialData }: IpAddressFieldProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'ip-address',
      description,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
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
      {/* Scrollable Content */}
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

        {/* More Settings Accordion */}
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

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
        <Button data-testid="custom-field-cancel-btn"
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-9"
        >
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
