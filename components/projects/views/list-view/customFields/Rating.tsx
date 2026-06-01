// components/list-view/customFields/Rating.tsx

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

interface RatingFieldProps {
  onSubmit: (data: {
    name: string;
    type: 'rating';
    description: string;
    emojiType: string;
    maxRating: number;
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; emojiType?: string; maxRating?: number };
}

export function RatingField({ onSubmit, onCancel, initialData }: RatingFieldProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [emojiType, setEmojiType] = useState(initialData?.emojiType ?? 'smile');
  const [maxRating, setMaxRating] = useState(initialData?.maxRating ?? 3);
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const emojiTypes = [
    { value: 'smile', emoji: '😊' },
    { value: 'star', emoji: '⭐' },
    { value: 'heart', emoji: '❤️' },
    { value: 'thumbs', emoji: '👍' },
    { value: 'fire', emoji: '🔥' },
  ];

  const ratingOptions = [
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
  ];

  const selectedEmoji = emojiTypes.find(e => e.value === emojiType);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'rating',
      description,
      emojiType,
      maxRating,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setEmojiType('smile');
    setMaxRating(3);
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
          <Input
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
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description...."
            rows={2}
            className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Emoji Type and Number Selection - Equal Width */}
        <div className="grid grid-cols-2 gap-4">
          {/* Emoji Type - Dropdown in Preview Box */}
          <div className="space-y-2">
            <label className="text-xs font-medium block">Emoji type</label>
            {/* Dropdown integrated in preview box */}
            <Select value={emojiType} onValueChange={setEmojiType}>
              <SelectTrigger className="h-20 bg-muted border-0 hover:bg-muted transition-colors">
                <SelectValue>
                  <div className="flex items-center justify-center">
                    <span className="text-lg">{selectedEmoji?.emoji}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {emojiTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center justify-center">
                      <span className="text-lg">{type.emoji}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Emoji */}
          <div className="space-y-2">
            <label className="text-xs font-medium block">Number of emoji</label>
            <Select value={maxRating.toString()} onValueChange={(val) => setMaxRating(parseInt(val))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* More Settings Accordion */}
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
