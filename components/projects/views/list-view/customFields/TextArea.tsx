// components/list-view/customFields/TextArea.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2 } from "lucide-react";

interface TextAreaProps {
  onSubmit: (data: {
    name: string;
    type: 'textarea';
    description: string;
    defaultValue?: string;
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; defaultValue?: string };
}

export function TextArea({
  onSubmit,
  onCancel,
  initialData,
}: TextAreaProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [defaultValue, setDefaultValue] = useState(initialData?.defaultValue ?? '');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'textarea',
      description,
      defaultValue: defaultValue || undefined,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setDefaultValue('');
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

        {/* Default Value */}
        <div className="space-y-2">
          <label htmlFor="default-value" className="text-xs font-medium block">
            Default text to display
          </label>
          <textarea
            id="default-value"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Text"
            maxLength={250}
            rows={3}
            className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            {defaultValue.length}/250 characters
          </p>
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
          disabled={(!fieldName.trim()) || loading}
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
