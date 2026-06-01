"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/sonner";
import { useProjectsStore } from "@/stores/projects-store";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import { Settings2 } from "lucide-react";

interface CreateCycleConfigProps {
    projectId: string;
}

export function CreateCycleConfig({ projectId }: CreateCycleConfigProps) {
    const router = useRouter();
    const { projects, createParallelCycleConfig, fetchProjectById, fetchParallelCycleConfigs } = useProjectsStore();
    const project = projects.find((p) => p.id === projectId);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // ── Form State ─────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [slugPrefix, setSlugPrefix] = useState("");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [defaultDurationDays, setDefaultDurationDays] = useState<string>("");
    const [description, setDescription] = useState("");

    // Config related logic
    const [coolingPeriodMode, setCoolingPeriodMode] = useState<"immediate" | "cooling">("immediate");
    const [coolingPeriodDays, setCoolingPeriodDays] = useState<string>("");

    const [endCondition, setEndCondition] = useState<"never" | "after_cycles" | "specific_date">("never");
    const [maxCycles, setMaxCycles] = useState<number | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoadingData(true);
            if (!projects.find((p) => p.id === projectId)) {
                await fetchProjectById(projectId);
            }
            await fetchParallelCycleConfigs(projectId);
            setIsLoadingData(false);
        };
        load();
    }, [projectId, fetchProjectById, fetchParallelCycleConfigs]);

    const hasConfig = (project?.parallelCycleConfigs || []).some(cfg => cfg && cfg.id !== null);

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (hasConfig && !isSubmitting) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center bg-white w-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200 mb-4">
                    <Settings2 className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Already Exists</h2>
                <p className="text-sm text-gray-500 max-w-md mb-6">
                    A project can only have one cycle configuration. You can edit the existing configuration from the Cycles page.
                </p>
                <Button
                    onClick={() => router.push(`/project/${projectId}/cycles`)}
                    className="bg-[#001F3F] text-white hover:bg-[#002B5C] px-6"
                >
                    Back to Cycles
                </Button>
            </div>
        );
    }

    // Auto-generate slug prefix from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        if (!slugPrefix || slugPrefix === name.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "")) {
            setSlugPrefix(val.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ""));
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast("error", { title: "Cycle name is required." });
            return;
        }
        if (!slugPrefix.trim()) {
            toast("error", { title: "Cycle identifier is required." });
            return;
        }
        if (!startDate) {
            toast("error", { title: "Cycle start date is required." });
            return;
        }
        if (!defaultDurationDays) {
            toast("error", { title: "Cycle duration is required." });
            return;
        }

        const enforceCoolingPeriod = coolingPeriodMode === "cooling";
        const cpd = enforceCoolingPeriod ? parseInt(coolingPeriodDays) || 0 : 0;

        const finalMaxCycles = endCondition === "after_cycles" ? maxCycles : undefined;

        setIsSubmitting(true);
        try {
            await createParallelCycleConfig(projectId, {
                name,
                startDate: startDate.toISOString(),
                enabled: true,
                coolingPeriodDays: cpd,
                defaultDurationDays: parseInt(defaultDurationDays) || 7,
                enforceCoolingPeriod,
                allowOverlappingCycles: false,
                cycleSlugPrefix: slugPrefix,
                nextCycleNumber: 1,
                maxCycles: finalMaxCycles,
                onCycleClose: "move_tasks_to_next_cycle",
            });
            router.push(`/project/${projectId}/cycles`);
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background flex flex-col w-full min-h-full">
            <div className="flex-1 flex flex-col p-6 space-y-4 w-full">

                {/* ── Top row fields ──────────────────────── */}
                <div className="rounded-lg p-4 bg-secondary">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Cycle name */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle name</label>
                            <Input
                                placeholder="e.g. West Bengal"
                                value={name}
                                onChange={handleNameChange}
                                className="h-10 bg-background border-gray-300 focus-visible:ring-[#001F3F]"
                            />
                        </div>

                        {/* Cycle identifier */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle identifier</label>
                            <Input
                                placeholder="e.g. WES"
                                value={slugPrefix}
                                onChange={(e) => setSlugPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                                className="h-10 bg-background border-gray-300 focus-visible:ring-[#001F3F] uppercase"
                                maxLength={6}
                            />
                        </div>

                        {/* Cycle start date */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle start date</label>
                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-10 justify-between text-left font-normal bg-background border-gray-300",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <span>{startDate ? format(startDate, "PPP") : "Set cycle date"}</span>
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(d) => { if (d) { setStartDate(d); setStartDateOpen(false); } }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Cycle duration */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle duration</label>
                            <Select value={defaultDurationDays} onValueChange={setDefaultDurationDays}>
                                <SelectTrigger className="w-full h-10 bg-background border-gray-300 text-sm">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">1 week</SelectItem>
                                    <SelectItem value="14">2 weeks</SelectItem>
                                    <SelectItem value="21">3 weeks</SelectItem>
                                    <SelectItem value="28">4 weeks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Cycle description ──────────────────────── */}
                <div className="border-l-4 border-l-[#001F3F] border border-gray-200 rounded-lg p-4 bg-background shadow">
                    <div className="space-y-3">
                        <div>
                            <h1 className="font-semibold text-sm text-[#001F3F]">Cycle description</h1>
                            <p className="font-medium text-xs text-[#8E8E93] leading-relaxed">
                                Define the initial context and goals of this cycle configuration.
                            </p>
                        </div>
                        <div className="min-h-[150px] border border-gray-200 rounded-md overflow-hidden bg-background relative">
                            <ProseMirrorEditor
                                initialContent={description}
                                onBlur={(content) => setDescription(content)}
                                placeholder="Write cycle description…"
                                className="border-0 shadow-none ring-0 min-h-[150px]"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Labels ──────────────────────────────── */}
                <div className="border-l-4 border-l-[#001F3F] border border-gray-200 rounded-lg p-4 bg-background shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-6">
                            <h1 className="font-semibold text-sm text-[#001F3F]">Labels</h1>
                            <p className="font-medium text-xs text-[#8E8E93] leading-relaxed">
                                Create and manage labels to categorize and organize cycles, making it easier for your team to filter and track work.
                            </p>
                            <div className="flex gap-2 mt-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                                    Label 1
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                                    Label 2
                                    <X className="h-3 w-3 ml-1 cursor-pointer" />
                                </span>
                            </div>
                        </div>
                        <div className="w-xs">
                            <Select>
                                <SelectTrigger className="w-full h-10 bg-background border-gray-300 text-sm">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="l1">Label 1</SelectItem>
                                    <SelectItem value="l2">Label 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Recur cycles ──────────────────────── */}
                <div className="border-l-4 border-l-[#001F3F] border border-gray-200 rounded-lg p-4 bg-background shadow">
                    <div className="space-y-4">
                        <div className="flex-1">
                            <h1 className="font-semibold text-sm text-[#001F3F]">Recur cycles</h1>
                            <p className="font-medium text-xs text-[#8E8E93] leading-relaxed">
                                Automatically create cycles based on a defined schedule.
                            </p>
                        </div>

                        {/* Create next cycle block */}
                        <div className="bg-secondary rounded-lg p-4 mb-4 border border-gray-200">
                            <label className="block text-sm font-semibold text-[#8E8E93] mb-4">Create next cycle</label>
                            <RadioGroup value={coolingPeriodMode} onValueChange={(v: any) => setCoolingPeriodMode(v)} className="space-y-0">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="immediate" id="immediate" />
                                    <label htmlFor="immediate" className="text-xs text-[#001F3F] font-normal cursor-pointer">Immediately after previous ends</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="cooling" id="cooling" />
                                    <label htmlFor="cooling" className="text-xs text-[#001F3F] font-normal cursor-pointer">Add cooling period between cycles</label>
                                </div>
                            </RadioGroup>

                            {coolingPeriodMode === "cooling" && (
                                <div className="mt-4 flex items-center justify-between bg-background p-2 rounded-lg border border-gray-200">
                                    <span className="text-xs text-gray-500">Set a cooling period of:</span>
                                    <Select value={coolingPeriodDays} onValueChange={setCoolingPeriodDays}>
                                        <SelectTrigger className="w-[300px] h-6 bg-background border-gray-300 text-xs">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent >
                                            <SelectItem className="text-xs" value="1">1 day</SelectItem>
                                            <SelectItem className="text-xs" value="2">2 days</SelectItem>
                                            <SelectItem className="text-xs" value="3">3 days</SelectItem>
                                            <SelectItem className="text-xs" value="7">1 week</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* End Condition block */}
                        <div className="bg-secondary rounded-lg p-4 border border-gray-200">
                            <label className="block text-sm font-semibold text-[#8E8E93] mb-4">End Condition</label>
                            <RadioGroup value={endCondition} onValueChange={(v: any) => setEndCondition(v)} className="space-y-0">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="never" id="never" />
                                    <label htmlFor="never" className="text-xs text-[#001F3F] font-normal cursor-pointer">Never ends</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="after_cycles" id="after_cycles" />
                                    <label htmlFor="after_cycles" className="text-xs text-[#001F3F] font-normal cursor-pointer">Ends after</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="no. of cycles"
                                        value={endCondition === "after_cycles" ? maxCycles || "" : ""}
                                        onChange={(e) => setMaxCycles(parseInt(e.target.value) || undefined)}
                                        disabled={endCondition !== "after_cycles"}
                                        className="w-32 h-8 bg-background border-gray-300 text-xs rounded"
                                    />
                                    <span className="text-xs text-[#001F3F]">cycles</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="specific_date" id="specific_date" />
                                    <label htmlFor="specific_date" className="text-xs text-[#001F3F] font-normal cursor-pointer">Ends on specific date</label>
                                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                disabled={endCondition !== "specific_date"}
                                                className={cn(
                                                    "w-36 h-8 justify-between text-left font-normal bg-background border-gray-300 text-xs px-2 rounded",
                                                    !endDate && "text-muted-foreground"
                                                )}
                                            >
                                                <span>{endDate ? format(endDate, "dd/MM/yyyy") : "dd/mm/yyyy"}</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={(d) => { if (d) { setEndDate(d); setEndDateOpen(false); } }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                </div>

                {/* ── Footer Actions ─────────────────────────────────────── */}
                <div className="flex justify-end gap-x-2 items-center p-2">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="min-w-40 text-[#8E8E93]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="min-w-40 bg-[#001F3F] text-white hover:bg-[#002B5C] flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            "Create Config"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
