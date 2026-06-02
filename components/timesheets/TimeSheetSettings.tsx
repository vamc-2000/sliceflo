"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "../ui/separator";

import { useTimesheetSettingsStore } from "@/stores/timesheet-settings.store";
import { useState } from "react";

export default function TimeSheetsSettings() {
  const {
    capacityType,
    hours,
    notifyBefore,
    setCapacityType,
    setHours,
    setNotifyBefore,
  } = useTimesheetSettingsStore();

  const [localCapacityType, setLocalCapacityType] = useState(capacityType);
  const [localHours, setLocalHours] = useState(hours);
  const [localNotifyBefore, setLocalNotifyBefore] = useState(notifyBefore);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setCapacityType(localCapacityType);
    setHours(localHours);
    setNotifyBefore(localNotifyBefore);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="btn-timesheet-settings"
          size="icon"
          variant="ghost"
          className="h-9.5 w-9.5 rounded-md border bg-muted text-muted-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 bg-background border-0 border-b-[5px] border-primary rounded-lg pb-3.5 p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-4">Configure</h3>

        <div className="space-y-6">
          {/* My capacity */}
          <div className="flex items-center justify-between">
            <Label>My capacity</Label>

            <div className="flex items-center gap-1 rounded-md bg-gray-200 px-1 py-1">
              <button
                data-testid="btn-capacity-daily"
                onClick={() => setLocalCapacityType("daily")}
                className={`flex h-7.5 w-20 items-center justify-center rounded-md text-sm ${localCapacityType === "daily"
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-500 hover:bg-gray-300"
                  }`}
              >
                Daily
              </button>

              <button
                data-testid="btn-capacity-weekly"
                onClick={() => setLocalCapacityType("weekly")}
                className={`flex h-7.5 w-20 items-center justify-center rounded-md text-sm ${localCapacityType === "weekly"
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-500 hover:bg-gray-300"
                  }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-center justify-between">
            <Label>
              {localCapacityType === "daily" ? "Daily hours" : "Weekly hours"}
            </Label>

            <Input
              data-testid="input-capacity-hours"
              type="number"
              value={localHours}
              onChange={(e) => setLocalHours(e.target.value)}
              className="w-42 text-right"
            />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Save */}
        <div className="flex justify-end">
          <Button data-testid="btn-save-settings" onClick={handleSave} className="w-24">Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
