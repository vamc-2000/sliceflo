'use client'

import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Label {
  id: string
  name: string
  color: string
}

interface LabelManagerProps {
  labels: Label[]
  allLabels?: Label[]
  onLabelsChange: (labels: Label[]) => void
  title?: string
  description?: string
  containerClassName?: string
  dropdownWidth?: string
  availableColors?: string[]
  showBorder?: boolean
  borderColor?: string
}

const PlusLabelManager: React.FC<LabelManagerProps> = ({
  labels = [],
  allLabels = [],
  onLabelsChange,
  availableColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#e11d48', '#6b7280', '#84cc16', '#f59e0b', '#10b981'
  ],
  showBorder = true,
  borderColor = "#001F3F"
}) => {
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAllLabels = allLabels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleLabel = (label: Label) => {
    const isSelected = labels.some(l => l.id === label.id)
    if (isSelected) {
      onLabelsChange(labels.filter(l => l.id !== label.id))
    } else {
      onLabelsChange([...labels, label])
    }
  }

  const handleDeleteLabel = (labelId: string) => {
    onLabelsChange(labels.filter(label => label.id !== labelId))
  }

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      const newLabel: Label = {
        id: `temp-${Date.now()}`,
        name: newLabelName.trim(),
        color: newLabelColor
      }
      onLabelsChange([...labels, newLabel])
      setNewLabelName('')
      setNewLabelColor('#3b82f6')
    }
  }

  return (
    <div
      className={`w-[280px] bg-card text-card-foreground overflow-hidden rounded-lg ${showBorder ? 'border-b-[5px] border-b-primary' : ''}`}
    >
      {/* Search */}
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Search labels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {/* Selected labels */}
        {labels.length > 0 && (
          <div className="p-2 border-b">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Selected
            </h4>
            <div className="space-y-1">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-2 rounded"
                  style={{ backgroundColor: `${label.color}15` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                    <span className="text-xs font-medium text-foreground">{label.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors"
                    type="button"
                    aria-label={`Remove ${label.name}`}
                  >
                    {/* <Trash2 size={12} /> */}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All workspace labels to pick from */}
        <div className="p-2">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Select Existing
          </h4>
          <div className="space-y-1">
            {filteredAllLabels.length > 0 ? (
              filteredAllLabels.map((label) => {
                const isSelected = labels.some(l => l.id === label.id)
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label)}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition-all duration-150 ${
                    isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                      <span className="text-xs font-medium text-foreground">{label.name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                  </button>
                )
              })
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-2">No labels found</p>
            )}
          </div>
        </div>

        {/* Create new label */}
        <div className="p-3 border-t bg-muted/30">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Create New
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name"
              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLabel() }}
            />
            <div className="flex flex-wrap gap-1.5">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLabelColor(color)}
                  className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                    newLabelColor === color ? 'border-foreground ring-1 ring-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  type="button"
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <button
              onClick={handleAddLabel}
              disabled={!newLabelName.trim()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-semibold py-1.5 px-3 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-1"
              type="button"
            >
              <Plus size={12} />
              <span>Create Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlusLabelManager
export type { Label, LabelManagerProps }
