"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";

interface IntegrationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationHubModal({
  isOpen,
  onClose,
}: IntegrationHubModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              ←
            </Button>
            <h2 className="text-lg font-semibold">Integration Hub</h2>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(95vh-64px)]">
          {/* Left Sidebar */}
          <div className="w-60 border-r p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Integration Types
            </p>

            <div className="space-y-1">
              {[
                "Portfolio",
                "Project",
                "Task",
                "Docs",
                "View",
                "Whiteboard",
              ].map((item, index) => (
                <button
                  key={item}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    index === 1
                      ? "bg-muted font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-hidden">
            {/* Tabs */}
            <Tabs defaultValue="slice">
              <TabsList>
                <TabsTrigger value="slice">
                  Integrations by SliceFlo
                </TabsTrigger>
                <TabsTrigger value="used">
                  My used Integrations
                </TabsTrigger>
              </TabsList>

              {/* Search + Filters */}
              <div className="flex items-center justify-between mt-4">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Integrations"
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Use Cases</Button>
                  <Button variant="outline">Tags</Button>
                </div>
              </div>

              {/* Cards Grid */}
              <ScrollArea className="h-[calc(95vh-220px)] mt-6">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    "Marketing",
                    "Operations",
                    "PMO - Project Management",
                    "Personal Use",
                    "Engineering & Product",
                    "Other",
                  ].map((title) => (
                    <div
                      key={title}
                      className="rounded-xl border hover:shadow-md transition cursor-pointer"
                    >
                      <div className="h-36 bg-muted rounded-t-xl" />

                      <div className="p-4 font-medium flex justify-between items-center">
                        {title}
                        <span className="text-muted-foreground">›</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
