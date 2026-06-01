// components/list-view/customFields/Number.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Loader2 } from "lucide-react";

interface NumberProps {
  onSubmit: (data: {
    name: string;
    type: 'number';
    description: string;
    numberFormat: 'number' | 'percentage' | 'currency' | 'customLabel' | 'none';
    decimalPlaces: number;
    currency?: string;
    customLabel?: string;
    labelPosition?: 'left' | 'right';
    defaultValue?: number;
  }) => void;
  onCancel: () => void;
  initialData?: {
    name: string;
    description?: string;
    numberFormat?: 'number' | 'percentage' | 'currency' | 'customLabel' | 'none';
    decimalPlaces?: number;
    currency?: string;
    customLabel?: string;
    labelPosition?: 'left' | 'right';
    defaultValue?: number;
  };
}

const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

const NUMBER_FORMAT_OPTIONS = {
  number: { label: 'Number' },
  percentage: { label: 'Percent' },        // ← "Percent" not "Percentage"
  currency: { label: 'Currency' },
  customLabel: { label: 'Custom label' },  // ← "Custom label" not "Custom Label"
  none: { label: 'None' },
};

export function Number({
  onSubmit,
  onCancel,
  initialData,
}: NumberProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [numberFormat, setNumberFormat] = useState<'number' | 'percentage' | 'currency' | 'customLabel' | 'none'>(initialData?.numberFormat ?? 'number');
  const [decimalPlaces, setDecimalPlaces] = useState(initialData?.decimalPlaces ?? 3);
  const [currency, setCurrency] = useState(initialData?.currency ?? 'INR');
  const [customLabel, setCustomLabel] = useState(initialData?.customLabel ?? '');
  const [labelPosition, setLabelPosition] = useState<'left' | 'right'>(initialData?.labelPosition ?? 'left');
  const [defaultValue, setDefaultValue] = useState(initialData?.defaultValue ? String(initialData.defaultValue) : '');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    if (numberFormat === 'customLabel' && !customLabel.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'number',
      description,
      numberFormat,
      decimalPlaces,
      currency: numberFormat === 'currency' ? currency : undefined,
      customLabel: numberFormat === 'customLabel' ? customLabel : undefined,
      labelPosition: numberFormat === 'customLabel' ? labelPosition : undefined,
      defaultValue: defaultValue ? parseFloat(defaultValue) : undefined,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setNumberFormat('number');
    setDecimalPlaces(3);
    setCurrency('INR');
    setCustomLabel('');
    setLabelPosition('left');
    setDefaultValue('');
    setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getFormattedExample = () => {
    switch (numberFormat) {
      case 'none':
        return '1000';   // ← plain, no decimals, no commas as in image

      case 'number': {
        return (1000).toLocaleString('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });  // → 1,000.000
      }

      case 'percentage': {
        return `${(45.5).toFixed(decimalPlaces)}%`;  // → 45.50%
      }

      case 'currency': {
        const currencyObj = CURRENCY_OPTIONS.find(c => c.code === currency);
        return `${currencyObj?.symbol || '$'}${(1000).toLocaleString('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        })}`;
      }

      case 'customLabel': {
        const num = (1000).toLocaleString('en-US', {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });
        return labelPosition === 'right'
          ? `${num} ${customLabel || 'lbs'}`   // → 1000 lbs (image shows Right)
          : `${customLabel || 'lbs'} ${num}`;
      }

      default:
        return '1000';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

        {/* Field Name */}
        <div className="space-y-2">
          <label htmlFor="field-name" className="text-xs font-medium block">Field name</label>
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

        {/* Format Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium block">Format</label>
          <Select value={numberFormat} onValueChange={(value: any) => setNumberFormat(value)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NUMBER_FORMAT_OPTIONS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── CUSTOM LABEL: Label + Decimal side by side ── */}
        {numberFormat === 'customLabel' && (
          <div className="flex gap-3 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-medium block">Label</label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="lbs, ft, gal..."
                className="h-9"
              />
            </div>
            <div className="space-y-2 w-32">
              <label className="text-xs font-medium block">Decimal places</label>
              <Select
                value={String(decimalPlaces)}
                onValueChange={(val) => setDecimalPlaces(parseInt(val))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ── CUSTOM LABEL: Position + Example side by side ── */}
        {numberFormat === 'customLabel' && (
          <div className="flex gap-3 items-end">
            <div className="space-y-2 w-32">
              <label className="text-xs font-medium block">Position</label>
              <Select value={labelPosition} onValueChange={(val: any) => setLabelPosition(val)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-xs font-medium block">Example</label>
              <div
                className="h-9 px-3 flex items-center rounded-md text-xs text-muted-foreground"
                style={{ backgroundColor: '#FEF9EC' }}
              >
                {getFormattedExample()}
              </div>
            </div>
          </div>
        )}

        {/* ── NUMBER/PERCENT/CURRENCY: Decimal + Example side by side ── */}
        {numberFormat !== 'none' && numberFormat !== 'customLabel' && (
          <div className="flex gap-3 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-medium block">Decimal places</label>
              <Select
                value={String(decimalPlaces)}
                onValueChange={(val) => setDecimalPlaces(parseInt(val))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-xs font-medium block">Example</label>
              <div
                className="h-9 px-3 flex items-center rounded-md text-xs text-muted-foreground"
                style={{ backgroundColor: '#FEF9EC' }}
              >
                {getFormattedExample()}
              </div>
            </div>
          </div>
        )}

        {/* ── NONE: Example full width only ── */}
        {numberFormat === 'none' && (
          <div className="space-y-2">
            <label className="text-xs font-medium block">Example</label>
            <div
              className="h-9 px-3 flex items-center rounded-md text-xs text-muted-foreground w-1/2"
              style={{ backgroundColor: '#FEF9EC' }}
            >
              {getFormattedExample()}
            </div>
          </div>
        )}

        {/* ── CURRENCY: currency selector ── */}
        {numberFormat === 'currency' && (
          <div className="space-y-2">
            <label className="text-xs font-medium block">Currency</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* More Settings */}
        <button
          type="button"
          onClick={() => setShowMoreSettings(!showMoreSettings)}
          className="w-full flex items-center justify-between px-3 py-2 bg-muted hover:bg-muted rounded-md transition-colors"
        >
          <span className="text-xs text-muted-foreground">More settings and permissions</span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showMoreSettings ? 'rotate-90' : ''}`} />
        </button>

        {showMoreSettings && (
          <div className="space-y-3 p-3 border rounded-md bg-muted">
            <p className="text-xs text-muted-foreground">Additional settings coming soon...</p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={(!fieldName.trim() || (numberFormat === 'customLabel' && !customLabel.trim())) || loading}
          className="flex-1 h-9"
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
