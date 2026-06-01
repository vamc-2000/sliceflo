"use client";

import { useState } from "react";
import { useProjectsStore, CycleConfig, ParallelCycleConfig } from "@/stores/projects-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Info } from "lucide-react";

interface CycleConfigSettingsProps {
  projectId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CycleConfigSettings({
  projectId,
  isOpen,
  onOpenChange,
}: CycleConfigSettingsProps) {
  const {
    projects,
    updateCycleConfig,
    createParallelCycleConfig,
    deleteParallelCycleConfig
  } = useProjectsStore();

  const project = projects.find((p) => p.id === projectId);
  const config = project?.cycleConfig;
  const parallelConfigs = (project?.parallelCycleConfigs || []).filter(cfg => cfg && cfg.id !== null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleUpdateGeneral = async (updates: Partial<CycleConfig>) => {
    setIsLoading(true);
    try {
      await updateCycleConfig(projectId, updates);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Cycle Configuration</DialogTitle>
          <DialogDescription className="text-xs">
            Configure how cycles work for this project.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full text-sm">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="parallel">Parallel Cycles</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm">Enable Cycles</Label>
                <p className="text-xs text-muted-foreground">
                  Allow creating and managing cycles in this project.
                </p>
              </div>
              <Switch
                checked={config?.enabled}
                onCheckedChange={(checked) => handleUpdateGeneral({ enabled: checked })}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Default Duration (days)</Label>
                <Input
                  type="number"
                  value={config?.defaultDurationDays || 7}
                  onChange={(e) => handleUpdateGeneral({ defaultDurationDays: parseInt(e.target.value) })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Cooling Period (days)</Label>
                <Input
                  type="number"
                  value={config?.coolingPeriodDays || 0}
                  onChange={(e) => handleUpdateGeneral({ coolingPeriodDays: parseInt(e.target.value) })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between space-x-2">
                <Label className="text-sm">Allow Overlapping Cycles</Label>
                <Switch
                  checked={config?.allowOverlappingCycles}
                  onCheckedChange={(checked) => handleUpdateGeneral({ allowOverlappingCycles: checked })}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label className="text-sm">Enforce Cooling Period</Label>
                <Switch
                  checked={config?.enforceCoolingPeriod}
                  onCheckedChange={(checked) => handleUpdateGeneral({ enforceCoolingPeriod: checked })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parallel" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-medium">Parallel Cycle Streams</h4>
                <p className="text-xs text-muted-foreground">
                  Create multiple independent cycle streams (e.g., Mobile vs Web).
                </p>
              </div>
              <Button size="sm" onClick={() => console.log("Create Parallel")} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-1" /> <span className="text-xs">Add Stream</span>
              </Button>
            </div>

            <div className="space-y-2">
              {parallelConfigs.map((pc) => (
                <Card key={pc.id} className="p-2">
                  <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm">{pc.name}</CardTitle>
                      <CardDescription className="text-xs">{pc.cycleCount} cycles</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-8 p-0"
                      onClick={() => deleteParallelCycleConfig(projectId, pc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                </Card>
              ))}
              {parallelConfigs.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/50">
                  <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No parallel cycle streams configured.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
