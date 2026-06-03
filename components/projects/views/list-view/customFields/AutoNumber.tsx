// components/list-view/customFields/AutoNumber.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, Loader2 } from "lucide-react";

interface AutoNumberFieldProps {
    onSubmit: (data: {
        name: string;
        type: 'auto-number';
        description: string;
        prefix: string;
        startFrom: number;
    }) => void;
    onCancel: () => void;
}

export function AutoNumberField({ onSubmit, onCancel }: AutoNumberFieldProps) {
  const [loading, setLoading] = useState(false);
    const [fieldName, setFieldName] = useState('');
    const [description, setDescription] = useState('');
    const [prefix, setPrefix] = useState('');
    const [startFrom, setStartFrom] = useState<number>(1);
    const [showMoreSettings, setShowMoreSettings] = useState(false);

    const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
            name: fieldName,
            type: 'auto-number',
            description,
            prefix,
            startFrom,
        });
      // Reset form
        setFieldName('');
        setDescription('');
        setPrefix('');
        setStartFrom(1);
        setShowMoreSettings(false);
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
                    <label htmlFor="field-name" className="text-xs font-medium block">Field name</label>
                    <Input data-testid="custom-field-name-input"
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

                {/* Prefix */}
                <div className="space-y-2">
                    <label htmlFor="prefix" className="text-xs font-medium block">
                        Prefix
                    </label>
                    <Input data-testid="custom-field-autonumber-prefix"
                        id="prefix"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder=""
                        className="h-9"
                    />
                </div>

                {/* startFrom */}
                {/* <div className="space-y-2">
                    <label htmlFor="start-from" className="text-xs font-medium block">
                        Start from
                    </label>
                    <Input
                        id="start-from"
                        type="number"
                        min={1}
                        value={startFrom}
                        onChange={(e) => setStartFrom(Number(e.target.value))}
                        className="h-9"
                    />
                </div> */}

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
              Creating...
            </span>
          ) : (
            <>Create</>
          )}
        </Button>
            </div>
        </div>
    );
}
