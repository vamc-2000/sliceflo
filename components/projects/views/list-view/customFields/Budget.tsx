// components/list-view/customFields/Budget.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetFieldProps {
  onSubmit: (data: {
    name: string;
    type: 'budget';
    description: string;
    currency: string;
  }) => void;
  onCancel: () => void;
  initialData?: { name: string; description?: string; currency?: string };
}

export function BudgetField({ onSubmit, onCancel, initialData }: BudgetFieldProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR - Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP - British Pound (£)', symbol: '£' },
    { value: 'INR', label: 'INR - Indian Rupee (₹)', symbol: '₹' },
    { value: 'JPY', label: 'JPY - Japanese Yen (¥)', symbol: '¥' },
    { value: 'AUD', label: 'AUD - Australian Dollar (A$)', symbol: 'A$' },
    { value: 'CAD', label: 'CAD - Canadian Dollar (C$)', symbol: 'C$' },
    { value: 'CNY', label: 'CNY - Chinese Yuan (¥)', symbol: '¥' },
  ];

  const selectedCurrency = currencies.find(c => c.value === currency);

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'budget',
      description,
      currency,
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setCurrency('USD');
    setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatExample = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

        {/* Currency and Example */}
        <div className="grid grid-cols-2 gap-4">
          {/* Currency Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-medium block">Currency</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger data-testid="custom-field-budget-currency-trigger" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem data-testid={`custom-field-budget-currency-option-${curr.value}`} key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Example Preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium block">Example</label>
            <div className="h-9 bg-orange-100 text-orange-800 rounded-md px-3 flex items-center text-xs font-medium">
              {formatExample(1000000)}
            </div>
          </div>
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
