'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'

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

const LabelManager: React.FC<LabelManagerProps> = ({
  labels = [],
  allLabels = [],
  onLabelsChange,
  title = "Labels",
  description = "Create and manage labels to categorize and organize tasks, making it easier for your team to filter and track work.",
  containerClassName = "",
  dropdownWidth = "w-[300px]",
  availableColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#e11d48', '#6b7280', '#84cc16', '#f59e0b', '#10b981'
  ],
  showBorder = true,
  borderColor = "#001F3F"
}) => {
  const [labelsDropdownOpen, setLabelsDropdownOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')
  const [searchTerm, setSearchTerm] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLabelsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
      setLabelsDropdownOpen(false)
    }
  }

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

  const getDropdownButtonText = () => {
    return 'Select Label'
  }

  const filteredAllLabels = allLabels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const containerClasses = `
    border border-border rounded-lg p-4 bg-card mb-2 text-foreground
    ${showBorder ? `border-l-4` : ''} 
    ${containerClassName}
  `.trim()

  const containerStyle = showBorder ? { borderLeftColor: borderColor === '#001F3F' ? 'var(--primary)' : borderColor } : {}

  return (
    <div className={containerClasses} style={containerStyle}>
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-6">
          <h3 className="font-semibold text-sm text-foreground mb-0">{title}</h3>
          <p className="text-xs font-medium text-muted-foreground mb-3 leading-relaxed">
            {description}
          </p>
          
          {/* Display selected labels */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="group inline-flex items-center px-3 py-1 rounded-full text-xs text-white gap-1 relative animate-in fade-in zoom-in duration-200"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="ml-1 text-xs hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                    type="button"
                    aria-label={`Delete ${label.name} label`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div ref={dropdownRef} className={`${dropdownWidth} relative`}>
          <button
            onClick={() => setLabelsDropdownOpen(!labelsDropdownOpen)}
            className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring hover:bg-muted transition-colors text-foreground"
            type="button"
            aria-expanded={labelsDropdownOpen}
            aria-haspopup="true"
          >
            <span className="text-muted-foreground">{getDropdownButtonText()}</span>
            <ChevronDown 
              size={16} 
              className="text-muted-foreground transition-transform duration-200"
              style={{ transform: labelsDropdownOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {labelsDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 bg-popover border border-border rounded-lg mt-1 shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
              style={{
                borderBottom: borderColor === '#001F3F' ? '4px solid var(--primary)' : `4px solid ${borderColor}`,
              }}
            >
              {/* Search Bar */}
              <div className="p-2 border-b border-border">
                <input
                  type="text"
                  placeholder="Search labels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {/* Existing labels selection */}
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
                            className={`w-full flex items-center justify-between p-2 rounded text-left transition-all duration-200 ${
                              isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                            type="button"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: label.color }}
                              />
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

                {/* Create Section */}
                <div className="p-3 border-t border-border bg-muted/30">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Create New
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name"
                      className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddLabel()
                      }}
                    />
                    
                    <div className="flex flex-wrap gap-1.5">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewLabelColor(color)}
                          className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                            newLabelColor === color ? 'border-foreground ring-1 ring-ring' : 'border-border'
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
                      className="w-full text-primary-foreground text-[11px] font-semibold py-1.5 px-3 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                      style={{ backgroundColor: borderColor === '#001F3F' ? 'var(--primary)' : borderColor }}
                      type="button"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Plus size={12} />
                        <span>Create Label</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LabelManager
export type { Label, LabelManagerProps }



