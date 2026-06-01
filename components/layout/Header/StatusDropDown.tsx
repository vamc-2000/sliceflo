'use client'

import { JSX, useState } from 'react'
import {
  ChevronDown,
  CheckCircle,
  X,
  Clock,
  Circle
} from 'lucide-react'
import Image from 'next/image'
import iconMap from "@/lib/iconMap"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const StatusDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const Trash = iconMap["trash"]
  const [showInput, setShowInput] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('Available')
  const [customStatus, setCustomStatus] = useState('')
  const [customStatusOptions, setCustomStatusOptions] = useState<{ label: string; icon: JSX.Element }[]>([])

  const statusOptions = [
    {
      label: 'Available',
      icon: <CheckCircle className="text-green-500 w-[18px] h-[18px]" />
    },
    {
      label: 'Busy',
      icon: <X className="text-red-600 w-[18px] h-[18px]" />
    },
    {
      label: 'Do not disturb',
      icon: <Image src="/images/profile/donotdisturb.svg" alt="" width={20} height={20} />
    },
    {
      label: 'Be right back',
      icon: <Clock className="text-yellow-500 w-[18px] h-[18px]" />
    },
    {
      label: 'Away',
      icon: <Clock className="text-orange-500 w-[18px] h-[18px]" />
    },
    {
      label: 'Appear offline',
      icon: <Image src="/images/profile/Offline.svg" alt="" width={20} height={20} />
    },
    {
      label: 'Out of office',
      icon: <Image src="/images/profile/outofoffice.svg" alt="" width={20} height={20} />
    },
  ]

  const handleAddCustomStatus = () => {
    if (!customStatus.trim()) return
    setCustomStatusOptions([
      ...customStatusOptions,
      {
        label: customStatus.trim(),
        icon: <Circle className="w-3 h-3 fill-primary text-primary" />,
      },
    ])
    setCustomStatus('')
    setShowInput(false)
  }

  const allStatuses = [...statusOptions, ...customStatusOptions]

  return (
    <div className="inline-flex items-center  gap-1">
      <Badge
        variant="secondary"
        className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium cursor-default"
      >
        <div className="w-3 h-3 flex items-center justify-center">
          {allStatuses.find((s) => s.label === selectedStatus)?.icon}
        </div>
        <span className="hidden sm:inline">{selectedStatus}</span>
      </Badge>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-40 p-0 border-0 border-b-4 border-[#001F3F]  overflow-hidden"
          align="end"
          side="bottom"
          sideOffset={4}
        >
          <div className="max-h-80 overflow-y-auto">

            {allStatuses.map((status, index) => {
              const isCustom = customStatusOptions.some((s) => s.label === status.label)
              return (
                <div key={index}>
                  <div
                    onClick={() => {
                      // FIXED: Allow clicking on all statuses, not just non-custom
                      setSelectedStatus(status.label)
                      setIsOpen(false)
                    }}
                    className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {status.icon}
                      </div>
                      <span className="text-xs">{status.label}</span>
                    </div>
                    {isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCustomStatusOptions((prev) =>
                            prev.filter((s) => s.label !== status.label)
                          )
                        }}
                        className="h-8 w-8"
                      >
                        <Trash size={16} className="text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  {index < allStatuses.length - 1 && index === statusOptions.length - 1 && customStatusOptions.length > 0 && (
                    <Separator className="my-1" />
                  )}
                </div>
              )
            })}
          </div>


          <Separator />

          {/* <div className="p-3">
            {showInput ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Type custom status name"
                  className="text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomStatus()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCustomStatus}
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setShowInput(false)
                      setCustomStatus('')
                    }}
                    variant="outline"
                    className="flex-1 text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowInput(true)}
                className="w-full text-sm bg-[#001F3F] hover:bg-[#001F3F]/90 text-white"
                size="sm"
              >
                <span className="text-lg leading-none mr-1">+</span>
                Add custom status
              </Button>

            )}
          </div> */}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default StatusDropdown
