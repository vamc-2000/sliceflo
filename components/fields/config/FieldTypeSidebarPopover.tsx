"use client";

import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckCircle,
  ListChecks,
  Text,
  Type,
  Calendar,
  Hash,
  Globe2,
  Users,
  Mail,
  Phone,
  SquareCheck,
} from "lucide-react";

const FIELD_OPTIONS = [
  { id: "select-one", label: "Select One", icon: <CheckCircle className="w-5 h-5" />, group: "regular" },
  { id: "select-many", label: "Select Many", icon: <ListChecks className="w-5 h-5" />, group: "regular" },
  { id: "text", label: "Text", icon: <Text className="w-5 h-5" />, group: "regular" },
  { id: "text-area", label: "Text area(Long text)", icon: <Type className="w-5 h-5" />, group: "regular" },
  { id: "date", label: "Date", icon: <Calendar className="w-5 h-5" />, group: "regular" },
  { id: "number", label: "Number", icon: <Hash className="w-5 h-5" />, group: "regular" },
  { id: "website", label: "Website", icon: <Globe2 className="w-5 h-5" />, group: "regular" },
  { id: "people", label: "People", icon: <Users className="w-5 h-5" />, group: "regular" },
  { id: "email", label: "Email", icon: <Mail className="w-5 h-5" />, group: "regular" },
  { id: "phone", label: "Phone", icon: <Phone className="w-5 h-5" />, group: "regular" },
  { id: "checkbox", label: "Checkbox", icon: <SquareCheck className="w-5 h-5" />, group: "regular" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fieldType: string) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const FieldTypeSidebarPopover: React.FC<Props> = ({ open, onOpenChange, onSelect, anchorRef }) => {
  const [activeTab, setActiveTab] = useState<"regular" | "special">("regular");
  const [search, setSearch] = useState("");

  const filtered = FIELD_OPTIONS.filter(
    (opt) =>
      opt.group === activeTab &&
      opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
   <Popover open={open} onOpenChange={onOpenChange}>
    
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[340px] p-0 rounded-lg shadow-2xl"
        style={{ minHeight: 480, padding: 0 }}
        sideOffset={8}
      >
        <div className="flex flex-col h-full bg-white rounded-md">
          <div className="px-5 pt-4 pb-0">
            <span className="font-semibold text-base">Create field</span>
          </div>
          <div className="border-b my-2" />
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "regular" | "special")}
            className="flex-1 flex flex-col"
          >
            <div className="px-5">
              <TabsList className="w-full flex mb-1 rounded-none bg-transparent border-b border-gray-100 p-0">
                <TabsTrigger
                  value="regular"
                  className="flex-1 rounded-none text-[15px] px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-[#001F3F] data-[state=active]:text-[#001F3F]"
                >
                  Regular
                </TabsTrigger>
                <TabsTrigger
                  value="special"
                  className="flex-1 rounded-none text-[15px] px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-[#001F3F] data-[state=active]:text-[#001F3F]"
                >
                  Special
                </TabsTrigger>
              </TabsList>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full px-3 py-2 mt-3 mb-2 text-[14px] border rounded-md bg-gray-50"
                style={{ boxShadow: "none" }}
              />
            </div>
            <TabsContent value="regular" className="px-0">
              <div className="max-h-[360px] overflow-y-auto pb-2 px-2">
                {filtered.length === 0 && (
                  <div className="text-gray-400 text-center py-7">No field types found</div>
                )}
                {filtered.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSelect(option.id);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-3 py-2 px-3 w-full rounded transition-colors text-left hover:bg-gray-100 focus:bg-gray-100"
                  >
                    <span className="text-[#001F3F]">{option.icon}</span>
                    <span className="flex-1 text-[15px] font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="special" className="px-0">
              <div className="text-gray-400 text-center py-16">No special fields yet</div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FieldTypeSidebarPopover;
