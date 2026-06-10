// components/list-view/customFields/DateField.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight, Clock, X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { formatLocalDate, convertSelectedDateToUTC, convertUTCToCalendarDate, getLocalDateParts } from "@/utils/timezone-utils";

interface DateFieldProps {
  onSubmit: (data: {
    name: string;
    type: 'date';
    description: string;
    defaultValue?: string;
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; defaultValue?: string };
}

export function DateField({
  onSubmit,
  onCancel,
  initialData,
}: DateFieldProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [defaultDateType, setDefaultDateType] = useState<'none' | 'today' | 'custom'>(() => {
    if (!initialData?.defaultValue) return 'none';
    return 'custom';
  });
  const [customDate, setCustomDate] = useState<Date>(() => {
    if (initialData?.defaultValue) return convertUTCToCalendarDate(initialData.defaultValue) || new Date();
    return new Date();
  });
  const [customTime, setCustomTime] = useState(() => {
    if (initialData?.defaultValue) {
      const parts = getLocalDateParts(initialData.defaultValue);
      if (parts) {
        return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}`;
      }
    }
    return '13:30';
  });
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showTimeBadge, setShowTimeBadge] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;

    let defaultValue: string | undefined;

    if (defaultDateType === 'today') {
      const now = new Date();
      defaultValue = convertSelectedDateToUTC(now);
    } else if (defaultDateType === 'custom') {
      const [hours, minutes] = customTime.split(':');
      const dateWithTime = new Date(customDate);
      dateWithTime.setHours(parseInt(hours), parseInt(minutes));
      defaultValue = convertSelectedDateToUTC(dateWithTime);
    }
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'date',
      description,
      defaultValue,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setDefaultDateType('none');
    setCustomDate(new Date());
    setCustomTime('13:30');
    setShowMoreSettings(false);
    setShowTimeBadge(false);
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

        {/* Default Date */}
        <div className="space-y-3">
          <label className="text-xs font-medium block">Default date</label>
          <RadioGroup value={defaultDateType} onValueChange={(value: any) => setDefaultDateType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem data-testid="custom-field-date-radio-none" value="none" id="none" />
              <Label htmlFor="none" className="font-normal cursor-pointer">None</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem data-testid="custom-field-date-radio-today" value="today" id="today" />
              <Label htmlFor="today" className="font-normal cursor-pointer">Today</Label>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <RadioGroupItem data-testid="custom-field-date-radio-custom" value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">Custom</Label>
              </div>
              {defaultDateType === 'custom' && (
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      {formatLocalDate(customDate)}
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDate(date);
                          if (!showTimeBadge) {
                            setShowTimeBadge(true);
                          }
                        }
                      }}
                      initialFocus
                    />
                    {/* Clock Icon and Clear in a row */}
                    <div className="px-3 py-2 border-t bg-card flex items-center justify-between">
                      {/* Clock icon with direct time input */}
                      <div className="relative">
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => {
                            setCustomTime(e.target.value);
                            setShowTimeBadge(true);
                          }}
                          className="absolute opacity-0 w-8 h-8 cursor-pointer"
                          id="time-picker-clock-datefield"
                        />
                        <label htmlFor="time-picker-clock-datefield" className="p-1 hover:bg-muted rounded cursor-pointer block">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </label>
                      </div>
                      <button data-testid="custom-field-date-clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomDate(new Date());
                          setCustomTime('13:30');
                          setShowTimeBadge(false);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    </div>
                    {/* Time badge - Inline editable (no clock icon) */}
                    {showTimeBadge && (
                      <div className="px-3 pb-3">
                        <div className="w-full h-10 bg-brand-orange text-white font-medium rounded-md flex items-center justify-between px-3 relative">
                          {/* Inline time input - hide clock icon */}
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => {
                              setCustomTime(e.target.value);
                            }}
                            className="bg-transparent border-0 text-white font-medium outline-none flex-1 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                          />
                          <button data-testid="custom-field-date-remove-time-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Set time to default 13:30
                              setCustomTime('13:30');
                              setShowTimeBadge(false);
                            }}
                            className="p-1 hover:bg-brand-orange/80 rounded ml-2"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </RadioGroup>
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

        {/* More Settings Content (collapsed by default) */}
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
