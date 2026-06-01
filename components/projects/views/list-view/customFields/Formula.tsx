// components/list-view/customFields/Formula.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Plus, Minus, X as Multiply, Divide, Loader2 } from "lucide-react";

interface FormulaFieldProps {
  availableFields: Array<{ id: string; name: string; type: string }>;
  onSubmit: (data: {
    name: string;
    type: 'formula';
    description: string;
    expression: {
      field1: string;
      operator: '+' | '-' | '*' | '/';
      field2: string;
    };
  }) => void;
  onCancel: () => void;
  initialData?: {
    name: string;
    description?: string;
    expression?: { field1: string; operator: '+' | '-' | '*' | '/'; field2: string };
  };
}

export function FormulaField({ availableFields, onSubmit, onCancel, initialData }: FormulaFieldProps) {
  const [loading, setLoading] = useState(false);
  const [fieldName, setFieldName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [field1, setField1] = useState(initialData?.expression?.field1 ?? '');
  const [operator, setOperator] = useState<'+' | '-' | '*' | '/'>(initialData?.expression?.operator ?? '+');
  const [field2, setField2] = useState(initialData?.expression?.field2 ?? '');
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  // Filter only number fields for formula calculations
  const numberFields = availableFields.filter(
    field => field.type === 'number' || field.type === 'budget' || field.type === 'autonumber'
  );

  const operators = [
    { value: '+' as const, label: '+', icon: Plus, name: 'Add' },
    { value: '-' as const, label: '-', icon: Minus, name: 'Subtract' },
    { value: '*' as const, label: '×', icon: Multiply, name: 'Multiply' },
    { value: '/' as const, label: '÷', icon: Divide, name: 'Divide' },
  ];

  const handleOperatorClick = (op: '+' | '-' | '*' | '/') => {
    setOperator(op);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;
    if (!field1 || !field2) return;
    setLoading(true);
    try {
      await onSubmit({
      name: fieldName,
      type: 'formula',
      description,
      expression: {
        field1,
        operator,
        field2,
      },
    });
      if (!initialData) {
        // Reset form
    setFieldName('');
    setDescription('');
    setField1('');
    setOperator('+');
    setField2('');
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

        {/* Expression Builder */}
        <div className="space-y-2">
          <label className="text-xs font-medium block">Expression</label>
          
          <div className="flex items-center gap-2">
            {/* First Field Selector */}
            <Select value={field1} onValueChange={setField1}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {numberFields.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No number fields available
                  </div>
                ) : (
                  numberFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Operator Button */}
            <Select value={operator} onValueChange={(val) => setOperator(val as any)}>
              <SelectTrigger className="h-9 w-16 px-2">
                <SelectValue>
                  <span className="text-base font-semibold">
                    {operators.find(op => op.value === operator)?.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold">{op.label}</span>
                      <span className="text-xs text-muted-foreground">{op.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Second Field Selector */}
            <Select value={field2} onValueChange={setField2}>
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {numberFields.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No number fields available
                  </div>
                ) : (
                  numberFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Formula Preview */}
          {field1 && field2 && (
            <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
              <span className="font-medium">Preview: </span>
              {numberFields.find(f => f.id === field1)?.name || 'Field 1'}{' '}
              {operator}{' '}
              {numberFields.find(f => f.id === field2)?.name || 'Field 2'}
            </div>
          )}
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
          disabled={(!fieldName.trim() || !field1 || !field2) || loading}
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
