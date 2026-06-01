"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
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
import { toast } from "@/components/ui/sonner";
import { useProjectsStore, Cycle } from "@/stores/projects-store";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";

interface CreateCycleProps {
    projectId: string;
    onCancel?: () => void;
    onCreated?: () => void;
}

const STATUS_OPTIONS = [
    { value: "planned", label: "Planned" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
];

export function CreateCycle({ projectId, onCancel, onCreated }: CreateCycleProps) {
    const router = useRouter();
    const {
        projects,
        createCycle,
        fetchProjectById,
        fetchParallelCycleConfigs,
        fetchCycles,
    } = useProjectsStore();

    const project = projects.find((p) => p.id === projectId);
    const parallelConfigs = useMemo(() => {
        return (project?.parallelCycleConfigs || []).filter(cfg => cfg && cfg.id !== null);
    }, [project?.parallelCycleConfigs]);

    // ── Form State ─────────────────────────────────────────────────
    const [cycleConfigId, setCycleConfigId] = useState("");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [cycleNumber, setCycleNumber] = useState<number>(0);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"planned" | "active" | "completed">("planned");

    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!project) await fetchProjectById(projectId);
            await fetchParallelCycleConfigs(projectId);
            await fetchCycles(projectId);
        };
        load();
    }, [projectId]);

    // Auto-set first config if available
    useEffect(() => {
        if (parallelConfigs.length > 0 && !cycleConfigId) {
            setCycleConfigId(parallelConfigs[0].id);
        }
    }, [parallelConfigs, cycleConfigId]);

    // Auto-generate slug, dates and status from selected config
    useEffect(() => {
        const config = parallelConfigs.find((c) => c.id === cycleConfigId);
        if (config) {
            // 1. Cycle Number & Slug
            const nextNum = (config.cycleCount ?? 0) + 1;
            setCycleNumber(nextNum);
            const base = `${config.cycleSlugPrefix}-${nextNum}`;
            setSlug(base);
            if (!name) setName(`${config.name} #${nextNum}`);

            // 2. Dates
            const cycles = project?.cycles || [];
            let lastEndDate: Date | null = null;
            if (cycles.length > 0) {
                const dates = cycles
                    .map(c => new Date(c.endDate))
                    .filter(d => !isNaN(d.getTime()));
                if (dates.length > 0) {
                    lastEndDate = new Date(Math.max(...dates.map(d => d.getTime())));
                }
            }

            const gap = config.coolingPeriodDays || 0;
            const duration = config.defaultDurationDays || 14;

            const nextStartDate = lastEndDate
                ? addDays(lastEndDate, gap)
                : new Date();

            nextStartDate.setHours(0, 0, 0, 0);

            const nextEndDate = addDays(nextStartDate, duration);
            nextEndDate.setHours(23, 59, 59, 999);

            setStartDate(nextStartDate);
            setEndDate(nextEndDate);

            // 3. Initial Status based on dates
            const now = new Date();
            if (nextEndDate < now) {
                setStatus("completed");
            } else if (nextStartDate <= now) {
                setStatus("active");
            } else {
                setStatus("planned");
            }
        }
    }, [cycleConfigId, parallelConfigs, project?.cycles]);

    // Update status reactively if user changes dates manually
    useEffect(() => {
        const now = new Date();
        if (endDate < now) {
            setStatus("completed");
        } else if (startDate <= now) {
            setStatus("active");
        } else {
            setStatus("planned");
        }
    }, [startDate, endDate]);

    const handleSubmit = async () => {
        if (!cycleConfigId) {
            toast("error", { title: "Please select a cycle configuration." });
            return;
        }
        if (!name.trim()) {
            toast("error", { title: "Cycle name is required." });
            return;
        }
        if (!startDate || !endDate) {
            toast("error", { title: "Start and end dates are required." });
            return;
        }
        if (endDate <= startDate) {
            toast("error", { title: "End date must be after start date." });
            return;
        }

        setIsSubmitting(true);
        try {
            await createCycle(projectId, {
                cycleConfigId,
                name,
                slug,
                cycleNumber,
                description,
                status,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                sortOrder: 0,
            });
            if (onCreated) {
                onCreated();
            } else {
                router.push(`/project/${projectId}/cycles`);
            }
        } catch (error) {
            console.error(error);
            toast("error", { title: "Failed to create cycle." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const noConfig = parallelConfigs.length === 0;

    return (
        <div className="bg-background flex flex-col w-full min-h-full">
            <div className="flex-1 flex flex-col p-6 space-y-4 w-full">

                {/* No config warning */}
                {noConfig && (
                    <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                            You need a <strong>Cycle Configuration</strong> before creating cycles.
                        </p>
                        <Button
                            size="sm"
                            className="bg-[#001F3F] text-white hover:bg-[#002B5C] shrink-0"
                            onClick={() => router.push(`/project/${projectId}/cycles/cycle-config/create`)}
                        >
                            Create Config
                        </Button>
                    </div>
                )}

                {/* ── Top Info (grey background) ───────────────────────── */}
                <div className="rounded-lg p-4 bg-secondary">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Config selector - only show if multiple exist */}
                        {parallelConfigs.length > 1 ? (
                            <>
                                <div className="space-y-2 col-span-1">
                                    <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle configuration <span className="text-red-400">*</span></label>
                                    <Select value={cycleConfigId} onValueChange={setCycleConfigId} disabled={noConfig}>
                                        <SelectTrigger className="h-10 bg-background border-gray-300">
                                            <SelectValue placeholder={noConfig ? "No config available" : "Select a config"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {parallelConfigs.map((cfg) => (
                                                <SelectItem key={cfg.id} value={cfg.id}>
                                                    {cfg.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle name <span className="text-red-400">*</span></label>
                                    <Input
                                        placeholder="e.g. Sprint 1"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-10 bg-background border-gray-300 focus-visible:ring-[#001F3F]"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2 md:col-span-2 col-span-1">
                                <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle name <span className="text-red-400">*</span></label>
                                <Input
                                    placeholder="e.g. Sprint 1"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-10 bg-background border-gray-300 focus-visible:ring-[#001F3F]"
                                />
                            </div>
                        )}

                        {/* Cycle Number */}
                        <div className="space-y-2 col-span-1">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle number</label>
                            <Input
                                type="number"
                                value={cycleNumber}
                                onChange={(e) => setCycleNumber(parseInt(e.target.value) || 0)}
                                className="h-10 bg-background border-gray-300 focus-visible:ring-[#001F3F]"
                            />
                        </div>

                        {/* Cycle Slug */}
                        <div className="space-y-2 col-span-1">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Cycle slug</label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="h-10 bg-background border-gray-300 focus-visible:ring-[#001F3F]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Start date</label>
                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-10 justify-between text-left font-normal bg-background border-gray-300",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <span>{startDate ? format(startDate, "PP") : "Set date"}</span>
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

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">End date</label>
                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-10 justify-between text-left font-normal bg-background border-gray-300",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <span>{endDate ? format(endDate, "PP") : "Set date"}</span>
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(d) => { if (d) { setEndDate(d); setEndDateOpen(false); } }}
                                        disabled={(d) => d <= startDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#8E8E93] mb-2 h-4">Status</label>
                            <Select value={status} onValueChange={(v) => setStatus(v as any)} disabled>
                                <SelectTrigger className="h-10 bg-background border-gray-300 text-gray-700 opacity-95">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Description ──────────────────────────────────────── */}
                <div className="border-l-4 border-l-[#001F3F] border border-gray-200 rounded-lg p-4 bg-background shadow">
                    <div className="space-y-3">
                        <div>
                            <h1 className="font-semibold text-sm text-[#001F3F]">Cycle description</h1>
                            <p className="font-medium text-xs text-[#8E8E93] leading-relaxed">
                                Add details about this cycle's goals and scope.
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

                {/* ── Footer Actions ────────────────────────────────────── */}
                <div className="flex justify-end gap-x-4 items-center pt-4 pb-12">
                    <Button
                        variant="outline"
                        onClick={() => onCancel ? onCancel() : router.back()}
                        disabled={isSubmitting}
                        className="min-w-40 text-[#8E8E93]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || noConfig}
                        className="min-w-40 bg-[#001F3F] text-white hover:bg-[#002B5C] font-semibold flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            "Create Cycle"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
