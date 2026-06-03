// components/list-view/customFields/Voting.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VotingFieldProps {
  onSubmit: (data: {
    name: string;
    type: 'voting';
    description: string;
    emojiType: string;
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; emojiType?: string };
}

export function VotingField({ onSubmit, onCancel, initialData }: VotingFieldProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [emojiType, setEmojiType] = useState(initialData?.emojiType ?? 'thumbsup');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const emojiTypes = [
    { value: 'thumbsup', emoji: '👍', label: 'Thumbs Up' },
    { value: 'thumbsdown', emoji: '👎', label: 'Thumbs Down' },
    { value: 'heart', emoji: '❤️', label: 'Heart' },
    { value: 'check', emoji: '✓', label: 'Check' },
    { value: 'cross', emoji: '✗', label: 'Cross' },
  ];

  const selectedEmoji = emojiTypes.find(e => e.value === emojiType);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'voting',
      description,
      emojiType,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setEmojiType('thumbsup');
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

        {/* Emoji Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium block">Emoji type</label>
          <Select value={emojiType} onValueChange={setEmojiType}>
            <SelectTrigger data-testid="custom-field-voting-emoji-trigger" className="h-9">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedEmoji?.emoji}</span>
                  <span>{selectedEmoji?.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {emojiTypes.map((type) => (
                <SelectItem data-testid={`custom-field-voting-emoji-option-${type.value}`}  key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{type.emoji}</span>
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
