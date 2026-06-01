import { useState } from "react";
import { ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import { Email } from "@/types/mailbox.types";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { MdSnooze } from "react-icons/md";

interface SnoozedMenuProps {
  open: boolean;
  onClose: () => void;
  email: Email | null;
  onSnoozeSelect?: (email: Email) => void;
}

export default function SnoozedButton({ open, onClose, email, onSnoozeSelect }: SnoozedMenuProps) {
  const now = dayjs();
  const options = [
    { label: "Later", rightText: "in 2 hours" },
    { label: "Tomorrow", rightText: now.add(1, "day").format("ddd, h:mm A") },
    { label: "Later this week", rightText: now.day(3).hour(8).minute(0).format("ddd, h:mm A") },
    { label: "This weekend", rightText: now.day(6).hour(8).minute(0).format("ddd, h:mm A") },
    { label: "Next week", rightText: now.add(1, "week").day(1).hour(8).minute(0).format("ddd, h:mm A") },
    { label: "2 weeks", rightText: now.add(2, "week").day(1).hour(8).minute(0).format("MMM D, h:mm A") },
  ];

  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSelect = () => {
    if (email && onSnoozeSelect) onSnoozeSelect(email);
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <PopoverTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="h-12 w-12"
    >
      <MdSnooze className="!h-5 !w-5 text-muted-foreground" />
    </Button>
    </PopoverTrigger>

      <PopoverContent 
        className="w-[310px] p-2 rounded-lg" 
        side="bottom" 
        align="start"
        sideOffset={0}
    >
        <Input
          placeholder='Try "Tomorrow at 2 PM"...'
          className="mb-2 bg-muted rounded-lg h-9 text-sm px-2"
        />

        <ScrollArea className="max-h-[300px]">
          {options.map((opt, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
              onClick={handleSelect}
            >
              <span className="font-medium text-foreground">{opt.label}</span>
              <span className="text-muted-foreground text-sm">{opt.rightText}</span>
            </div>
          ))}

          {/* Custom date & time with submenu */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex justify-between items-center px-2 py-2 rounded-md hover:bg-muted cursor-pointer">
                <span className="font-medium text-foreground">Custom date & time...</span>
                <ChevronRight className="text-foreground" />
              </div>
            </PopoverTrigger>

            <PopoverContent
              className="w-[250px] p-0 rounded-lg"
              side="right"
              align="start"

            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (!d) return;
                  setDate(d);
                  console.log("Selected date:", d);
                  handleSelect();
                }}
              />
            </PopoverContent>
          </Popover>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
