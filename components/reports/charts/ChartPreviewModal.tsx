// components/reports/charts/ChartPreviewModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartLineMultiple } from "./chart-line-multiple";
import { ChartPieLegend } from "./chart-pie-legend";
import { ChartBarMultiple } from "./chart-bar-multiple";
import { ChartPieDonut } from "./chart-pie-donut";
import { ChartRadarDots } from "./chart-radar-dots";
import { ChartAreaLegend } from "./chart-area-legend";
import { ChartAreaGradient } from "./chart-area-gradient";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { useChartBuilderStore } from "@/stores/chartBuilderStore";
import { useReportStore } from "@/stores/reports-store";
import { useTasksStore } from "@/stores/tasks-store";
import { Button } from "@/components/ui/button";
import { ChartColumn, CornerDownLeft, CornerDownRight, CornerLeftUp, Eye, ListOrdered, Network, Percent, Settings, Tag } from "lucide-react";
import { computeChartData } from "@/lib/chart-utils";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { AxisField } from "@/types/reports.types";
export type ChartType = "line" | "bar" | "pie" | "doughnut" | "radar" | "area" | "areaG" | "custom";

interface ChartPreviewModalProps {
    open: boolean;
    onClose: () => void;
    chartType: ChartType;
}

// Make data optional for TypeScript compatibility
const TypedChartBarMultiple = ChartBarMultiple as React.FC<{ data?: any[]; config?: any }>;

// Use `React.ComponentType<any>` to accept any props
const ChartComponents: Record<ChartType, React.ComponentType<any>> = {
    line: ChartLineMultiple,
    bar: TypedChartBarMultiple,  // Now accepts optional data
    pie: ChartPieLegend,
    doughnut: ChartPieDonut,
    radar: ChartRadarDots,
    area: ChartAreaLegend,
    areaG: ChartAreaGradient,
    custom: () => <div>Custom chart</div>,
};

export default function ChartPreviewModal({
    open,
    onClose,
    chartType,
}: ChartPreviewModalProps) {
    const projects = useProjectsStore((state) => state.projects);
    const fetchProjects = useProjectsStore((state) => state.fetchProjects);
    const fetchProjectById = useProjectsStore(state => state.fetchProjectById);
    const { reportConfig, setReportConfig, fetchConfig, setSelectedChartType, getValidXAxis, getValidYAxis, resetDisplayOptions } = useChartBuilderStore();
    const { getValidCategory, getValidValue, } = useChartBuilderStore();
    const { displayOptions, setShowLegend, setShowLabels, setAsPercentage, } = useChartBuilderStore();
    const { getAxesByProjectId } = useChartBuilderStore();
    const { updateChartConfig, activeReport, updateReport } = useReportStore();
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const tasks = useTasksStore(state => state.tasks);
    const fetchTasks = useTasksStore(state => state.fetchTasks);

    const [showFilter, setShowFilter] = useState<string>("all");

    useEffect(() => {
        if (reportConfig.projectId) {
            fetchProjectById(reportConfig.projectId);
        }
    }, [reportConfig.projectId, fetchProjectById]);

    useEffect(() => {
        setShowFilter("all");
    }, [reportConfig.xAxis, reportConfig.projectId]);

    const xAxisFields = getValidXAxis();
    const yAxisFields = getValidYAxis();
    const categoryFields = getValidCategory();
    const valueFields = getValidValue();
    // Get aggregation options for the currently selected yAxis field
    const selectedYAxisField = yAxisFields.find(f => f.field === reportConfig.yAxis);
    const aggregationOptions = selectedYAxisField?.aggregations || [];


    useEffect(() => {
        const load = async () => {
            if (!open) return;

            setIsEditingTitle(false);
            // ✅ Reset so previous chart settings don't bleed in
            setShowLegend(false);
            setShowLabels(false);
            setAsPercentage(false);
            setReportConfig({
                title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Preview`,
                xAxis: "",
                yAxis: "count",
                category: "",
                value: "",
                aggregation: "count",
                groupBy: "none",
            });

            resetDisplayOptions();
            fetchProjects();
            fetchConfig();
            setSelectedChartType(chartType as any);

            const projectId = activeReport?.projectId || "";

            if (projectId) {
                setReportConfig({
                    projectId,
                });

                await getAxesByProjectId(projectId);
            }
        };

        load();
    }, [open, chartType, activeReport]);

    useEffect(() => {
        if (open) {
            setReportConfig({
                title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Preview`,
            });
        }
    }, [open, chartType]);

    useEffect(() => {
        const field = yAxisFields.find(f => f.field === reportConfig.yAxis);
        if (field?.aggregations?.length) {
            // Auto-select first aggregation if current one is not valid
            if (!field.aggregations.includes(reportConfig.aggregation as any)) {
                setReportConfig({ aggregation: field.aggregations[0] });
            }
        }
    }, [reportConfig.yAxis, yAxisFields]);

    useEffect(() => {
        if (reportConfig.projectId) {
            fetchTasks(reportConfig.projectId);
        }
    }, [reportConfig.projectId, fetchTasks]);

    let customChartData = undefined;
    const currentXAxis = reportConfig.xAxis;
    const currentYAxis = reportConfig.yAxis;
    const currentAggregation = reportConfig.aggregation;
    const currentGroupBy = reportConfig.groupBy || "none";
    const currentProjectId = reportConfig.projectId;

    if (currentProjectId && currentXAxis) {
        const project = projects.find((p) => p.id === currentProjectId);
        if (project) {
            customChartData = computeChartData({
                tasks: tasks.filter(t => t.projectId === currentProjectId),
                project,
                xAxis: currentXAxis,
                yAxis: currentYAxis,
                aggregation: currentAggregation,
                groupBy: currentGroupBy,
                showFilter,
            });
        }
    }

    // Dynamic Options for the "Show" Dropdown based on xAxis selection
    const activeProject = projects.find((p) => p.id === reportConfig.projectId);
    let showOptions: { label: string; value: string; color?: string }[] = [];
    if (activeProject) {
        if (reportConfig.xAxis === "status" && activeProject.taskStatusConfig) {
            showOptions = activeProject.taskStatusConfig.map((c) => ({ label: c.label, value: c.label, color: c.color }));
        } else if (reportConfig.xAxis === "priority" && activeProject.taskPriorityConfig) {
            showOptions = activeProject.taskPriorityConfig.map((c) => ({ label: c.label, value: c.label, color: c.color }));
        } else if (reportConfig.xAxis === "taskType" && activeProject.taskTypeConfig) {
            showOptions = activeProject.taskTypeConfig.map((c) => ({ label: c.label, value: c.label, color: c.color }));
        }
    }

    if (showOptions.length > 0) {
        showOptions.unshift({ label: "All fields", value: "all" });
    }

    const handleAddWidget = async () => {
        if (!activeReport) return;

        try {
            const getDatasetsFromCustomData = () => {
                if (!customChartData || customChartData.length === 0) return undefined;

                // Get datasets keys (all keys except the xAxis and fill)
                const keys = Object.keys(customChartData[0]).filter(k => k !== currentXAxis && k !== "fill");

                return keys.map((key, index) => ({
                    label: key,
                    data: customChartData.map((d: any) => d[key] || 0),
                    backgroundColor: customChartData.map((d: any) => d.fill || `var(--chart-${(index % 5) + 1})`)
                }));
            };

            const newChart: any = {
                type: chartType,
                title: reportConfig.title || `${chartType} Chart`,
                xAxis: reportConfig.xAxis,
                yAxis: reportConfig.yAxis,
                aggregation: reportConfig.aggregation || 'count',
                groupBy: reportConfig.groupBy || "none",
                displayOptions: { ...displayOptions },
                position: { x: 0, y: 0, w: 4, h: 3 }, // default widget size
                data: customChartData ? {
                    labels: customChartData.map((d: any) => d[currentXAxis]),
                    datasets: getDatasetsFromCustomData(),
                    displayOptions: { ...displayOptions },
                    groupBy: reportConfig.groupBy || "none"
                } : undefined,
                colors: customChartData && customChartData.map((d: any) => d.fill).filter(Boolean).length > 0 ? customChartData.map((d: any) => d.fill) : undefined
            };

            const currentCharts = activeReport.charts || [];

            const payload = {
                name: activeReport.name,
                description: activeReport.description || "",
                projectId: activeReport.projectId,
                charts: [newChart]
            };

            await updateReport(activeReport.id, payload);

            // API response now in activeReport — get the last chart (newly added)
            const freshReport = useReportStore.getState().activeReport;
            const savedChart = freshReport?.charts?.[freshReport.charts.length - 1];

            if (savedChart?.id) {
                updateChartConfig(activeReport.id, savedChart.id, {
                    groupBy: reportConfig.groupBy || "none",
                    displayOptions: { ...displayOptions },
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to add widget:", error);
        }
    };

    const ChartComponent = ChartComponents[chartType] || (() => <div>Unknown chart</div>);

    const CHART_GROUPS = [
        {
            category: "Pie",
            items: [
                {
                    id: "pie",
                    icon: (
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <path d="M20 6 A 14 14 0 0 1 34 20 L 20 20 Z" fill="#FDBA74" />
                            <path d="M34 20 A 14 14 0 0 1 20 34 L 20 20 Z" fill="#C084FC" />
                            <path d="M20 34 A 14 14 0 0 1 6 20 A 14 14 0 0 1 20 6 L 20 20 Z" fill="#38BDF8" />
                        </svg>
                    )
                },
                {
                    id: "doughnut",
                    icon: (
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <path d="M20 6 A 14 14 0 0 1 34 20 L 27 20 A 7 7 0 0 0 20 13 Z" fill="#FDBA74" />
                            <path d="M34 20 A 14 14 0 0 1 20 34 L 20 27 A 7 7 0 0 0 27 20 Z" fill="#C084FC" />
                            <path d="M20 34 A 14 14 0 0 1 6 20 A 14 14 0 0 1 20 6 L 20 13 A 7 7 0 0 0 13 20 A 7 7 0 0 0 20 27 Z" fill="#38BDF8" />
                        </svg>
                    )
                }
            ]
        },
        {
            category: "Line",
            items: [
                {
                    id: "line",
                    icon: (
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <path d="M6 20 L 14 28 L 22 20 L 28 24 L 34 14" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 28 L 14 36 L 22 28 L 28 32 L 34 20" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                },
                {
                    id: "area",
                    icon: (
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <path d="M6 20 L 14 28 L 22 20 L 28 24 L 34 14 L 34 36 L 6 36 Z" fill="#C084FC" fillOpacity="0.4" stroke="#C084FC" strokeWidth="1" strokeLinejoin="round" />
                            <path d="M6 28 L 14 36 L 22 28 L 28 32 L 34 20 L 34 36 L 6 36 Z" fill="#38BDF8" fillOpacity="0.6" stroke="#38BDF8" strokeWidth="1" strokeLinejoin="round" />
                        </svg>
                    )
                },
            ]
        },
        {
            category: "Bar",
            items: [
                {
                    id: "bar",
                    icon: (
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <rect x="8" y="20" width="6" height="16" rx="1" fill="#C084FC" />
                            <rect x="18" y="10" width="6" height="26" rx="1" fill="#38BDF8" />
                            <rect x="28" y="26" width="6" height="10" rx="1" fill="#FDBA74" />
                        </svg>
                    )
                },
                {
                    id: "radar",
                    icon: (
                        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                            <polygon points="20,4 34,14 34,30 20,38 6,30 6,14" stroke="#64748B" fill="none" strokeWidth="1" />
                            <polygon points="20,16 28,26 12,26" stroke="#38BDF8" fill="#38BDF8" fillOpacity="0.5" strokeWidth="1" />
                        </svg>
                    )
                }
            ]
        }
    ];

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="w-full max-w-5xl! h-full max-h-[85vh]! p-0! gap-0">  {/* Wider + no padding */}
                <DialogTitle className="sr-only">  {/* Screen reader only */}
                    {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Preview
                </DialogTitle>
                <div className="flex items-center justify-between px-6 py-3 border-b text-xl font-semibold text-[#001F3F]">
                    {isEditingTitle ? (
                        <Input
                            autoFocus
                            value={reportConfig.title}
                            onChange={(e) => setReportConfig({ title: e.target.value })}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                            className="!text-xl font-semibold text-[#001F3F] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0 w-fit min-w-[180px] max-w-[400px] bg-transparent"
                        />
                    ) : (
                        <div
                            onClick={() => setIsEditingTitle(true)}
                            className="cursor-text hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                            title="Click to edit title"
                        >
                            {reportConfig.title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Preview`}
                        </div>
                    )}
                </div>

                {/* TWO-COLUMN LAYOUT */}
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: CHART PREVIEW */}
                    <div className="w-[65%] border-r overflow-hidden ">
                        <div className="w-full h-full pb-0! overflow-auto">
                            <ChartComponent data={customChartData} config={{ ...reportConfig, displayOptions }} />
                        </div>
                    </div>

                    {/* RIGHT: CONFIGURATION PANEL */}
                    <div className="w-1/3 bg-background border-l p-0 flex flex-col h-full overflow-hidden">
                        <Tabs defaultValue="settings" className="flex flex-col h-full p-0">
                            {/* 🔹 Tab Header */}
                            <div className="px-4 pt-1 pb-1 flex justify-start gap-6">  {/* Flex + gap */}
                                <TabsList className="flex border-none bg-transparent p-0 gap-6 h-10 rounded-none">  {/* Flex layout */}
                                    <TabsTrigger
                                        value="settings"
                                        className="relative px-0 py-0 text-[#001F3F] data-[state=active]:text-[#001F3F] data-[state=active]:border-[#001F3F] hover:text-[#001F3F] data-[state=active]:border-b-2 border-0 hover:bg-transparent hover:border-0 h-auto rounded-none bg-transparent"
                                    >
                                        Settings
                                    </TabsTrigger>

                                    {/* <TabsTrigger
                                        value="data"
                                        className="relative px-0 py-0 text-[#001F3F] data-[state=active]:text-[#001F3F] data-[state=active]:border-[#001F3F] hover:text-[#001F3F] data-[state=active]:border-b-2 border-0 hover:bg-transparent hover:border-0 h-auto rounded-none bg-transparent"
                                    >
                                        Data
                                    </TabsTrigger> */}
                                </TabsList>
                            </div>

                            {/* 🔹 Tab Content Area */}
                            <div className="flex-1 overflow-auto px-2 py-0">
                                {/* ================= SETTINGS TAB ================= */}
                                <TabsContent value="settings" className="space-y-1 mt-0">
                                    {/* Select Project */}
                                    <div className="w-full">
                                        {/* Label row with icon */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <Label className="text-sm font-medium block text-[#8E8E93] px-1 flex-1">
                                                Widget data source
                                            </Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 border-none bg-transparent hover:bg-transparent shadow-none"
                                                onClick={() => {/* settings action */ }}
                                            >
                                                <Settings className="h-4 w-4 text-[#8E8E93]" />
                                            </Button>
                                        </div>

                                        {/* Full width dropdown unchanged */}
                                        <div className="w-full">
                                            <Select
                                                value={reportConfig.projectId || activeReport?.projectId || ""}
                                                onValueChange={async (value) => {
                                                    setReportConfig({ projectId: value });
                                                    await getAxesByProjectId(value);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select project, portfolio..." />
                                                </SelectTrigger>
                                                <SelectContent className="w-85 p-0 shadow-none border">
                                                    <Tabs defaultValue="projects" className="flex flex-col h-full">
                                                        {/* Tabs Header */}
                                                        <div className="border-b border-gray-200 px-4">
                                                            <TabsList className="flex gap-6 bg-transparent p-0 h-auto border-0 shadow-none">

                                                                <TabsTrigger
                                                                    value="projects"
                                                                    className="px-0 pt-3 pb-2 bg-transparent data-[state=active]:bg-transparent rounded-none border-0 border-b-2 border-transparent text-[#001F3F] data-[state=active]:border-[#001F3F] data-[state=active]:text-[#001F3F] data-[state=active]:shadow-none hover:bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                >
                                                                    Projects
                                                                </TabsTrigger>
                                                                <TabsTrigger
                                                                    value="portfolios"
                                                                    className="px-0 pt-3 pb-2 bg-transparent data-[state=active]:bg-transparent rounded-none border-0 border-b-2 border-transparent text-[#001F3F] data-[state=active]:border-[#001F3F] data-[state=active]:text-[#001F3F] data-[state=active]:shadow-none hover:bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                >
                                                                    Portfolios
                                                                </TabsTrigger>
                                                            </TabsList>
                                                        </div>

                                                        {/* Projects Tab */}
                                                        <TabsContent value="projects" className="mt-0">
                                                            <div className="max-h-60 overflow-auto px-2 py-0 space-y-1">
                                                                {projects
                                                                    .filter((project): project is typeof project & { id: string } => Boolean(project.id))
                                                                    .map((project) => (
                                                                        <SelectItem key={project.id} value={project.id}>
                                                                            {project.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </div>
                                                        </TabsContent>

                                                        {/* Portfolios Tab */}
                                                        <TabsContent value="portfolios" className="mt-0">
                                                            <div className="max-h-60 overflow-auto p-4 text-sm text-muted-foreground">
                                                                No portfolios yet.
                                                            </div>
                                                        </TabsContent>
                                                    </Tabs>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        {/* Left: Icon + Label */}
                                        <div className="flex items-center gap-3">
                                            <Network className="h-4 w-4 text-[#001F3F]" />
                                            <Label className="text-sm font-medium text-[#001F3F]">Include Subtasks</Label>
                                        </div>
                                        {/* Right: Switch */}
                                        <Switch defaultChecked={false} className="h-4 w-8 data-[state=unchecked]:bg-[#8E8E93] data-[state=checked]:bg-[#001F3F]" />
                                    </div>

                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="chart-types" className="border border-[#AEAEB2] rounded-md">
                                            <AccordionTrigger className="px-2 py-2 text-sm font-medium text-[#001F3F] hover:no-underline">
                                                Chart Types
                                            </AccordionTrigger>
                                            <AccordionContent className="px-1 -m-px">
                                                <div className="px-3 py-0 bg-background flex flex-col gap-2">
                                                    {CHART_GROUPS.map((group) => (
                                                        <div key={group.category} className="space-y-0">
                                                            <div className="text-sm text-[#001F3F]">{group.category}</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {group.items.map((item) => (
                                                                    <button
                                                                        key={item.id}
                                                                        onClick={() => setSelectedChartType(item.id as any)}
                                                                        className={`
                                                                            w-12 h-12 flex items-center justify-center rounded-md border transition-all
                                                                            ${chartType === item.id
                                                                                ? "border-[#001F3F] bg-[#001F3F]/5 shadow-sm"
                                                                                : "border-[#AEAEB2] hover:border-[#001F3F]"
                                                                            }
                                                                        `}
                                                                    >
                                                                        {item.icon}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    <div className="space-y-2 pt-1">  {/* Equal 1rem gaps */}
                                        {/* Widget display label */}
                                        <Label className="text-sm font-medium block text-[#8E8E93] px-1">
                                            Widget display
                                        </Label>

                                        {/* Toggle 1 */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[#001F3F]">
                                                <Percent className="h-4 w-4 " />
                                                <Label className="text-sm font-medium">As Percentages</Label>
                                            </div>
                                            <Switch
                                                checked={displayOptions.asPercentage}
                                                onCheckedChange={setAsPercentage}
                                                className="h-4 w-8 data-[state=unchecked]:bg-[#8E8E93] data-[state=checked]:bg-[#001F3F]"
                                            />
                                        </div>

                                        {/* Toggle 2 */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[#001F3F]">
                                                <Tag className="h-4 w-4 rotate-135" />
                                                <Label className="text-sm font-medium">Show Labels</Label>
                                            </div>
                                            <Switch
                                                checked={displayOptions.showLabels}
                                                onCheckedChange={setShowLabels}
                                                className="h-4 w-8 data-[state=unchecked]:bg-[#8E8E93] data-[state=checked]:bg-[#001F3F]"
                                            />
                                        </div>

                                        {/* Toggle 3 */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3 text-[#001F3F]">
                                                <ListOrdered className="h-4 w-4 " />
                                                <Label className="text-sm font-medium">Show Legend</Label>
                                            </div>
                                            <Switch
                                                // defaultChecked={false} 
                                                checked={displayOptions.showLegend}
                                                onCheckedChange={setShowLegend}
                                                className="h-4 w-8 data-[state=unchecked]:bg-[#8E8E93] data-[state=checked]:bg-[#001F3F]"
                                            />
                                        </div>
                                    </div>

                                    {/* ================= DYNAMIC AXIS UI ================= */}
                                    {/* CARTESIAN */}
                                    {(chartType === "line" ||
                                        chartType === "bar" ||
                                        chartType === "area") && (
                                            <div className="grid gap-4 ">
                                                {/* X Axis */}
                                                <div className="space-y-0">
                                                    <Label className="text-sm font-medium block text-[#8E8E93]">
                                                        X-Axis
                                                    </Label>

                                                    <div className="flex items-center justify-between gap-3 h-10 mb-1">
                                                        <div className="flex items-center gap-2 text-[#001F3F]">
                                                            <CornerDownRight className="h-4 w-4  shrink-0 rotate-0 " />
                                                            <Label className="text-sm font-medium whitespace-nowrap shrink-0">Measure</Label>
                                                        </div>

                                                        <div className="flex-1 max-w-50">
                                                            <Select
                                                                value={reportConfig.xAxis}
                                                                onValueChange={(value) =>
                                                                    setReportConfig({ xAxis: value })
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Choose field" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {xAxisFields.length === 0 ? (
                                                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                                                            No fields available
                                                                        </div>
                                                                    ) : (
                                                                        xAxisFields.map(field => (
                                                                            <SelectItem key={field.field} value={field.field}>
                                                                                {field.label}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 h-10">
                                                        <div className="flex items-center gap-2 text-[#001F3F]">
                                                            <Eye className="h-4 w-4 shrink-0" />
                                                            <Label className="text-sm font-medium whitespace-nowrap shrink-0">Show</Label>
                                                        </div>

                                                        <div className="flex-1 max-w-50">
                                                            <Select disabled={showOptions.length === 0} value={showFilter} onValueChange={setShowFilter}>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Choose field" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {showOptions.length === 0 ? (
                                                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                                                            No fields available
                                                                        </div>
                                                                    ) : (
                                                                        showOptions.map((opt) => (
                                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                                <div className="flex items-center gap-2">
                                                                                    {opt.color && (
                                                                                        <div
                                                                                            className="w-2.5 h-2.5 rounded-full"
                                                                                            style={{ backgroundColor: opt.color }}
                                                                                        />
                                                                                    )}
                                                                                    {opt.label}
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Y Axis */}
                                                <div>
                                                    <Label className="text-sm font-medium block text-[#8E8E93]">
                                                        Y-Axis
                                                    </Label>

                                                    <div className="flex items-center justify-between gap-3 h-10 mb-1">
                                                        <div className="flex items-center gap-2 text-[#001F3F]">
                                                            <CornerLeftUp className="h-4 w-4  shrink-0 rotate-0 " />
                                                            <Label className="text-sm font-medium whitespace-nowrap shrink-0">Measure</Label>
                                                        </div>

                                                        <div className="flex-1 max-w-50">

                                                            <Select
                                                                value={reportConfig.yAxis}
                                                                onValueChange={(value) =>
                                                                    setReportConfig({ yAxis: value })
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full h-10">
                                                                    <SelectValue placeholder="Choose field" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {yAxisFields.length === 0 ? (
                                                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                                                            No fields available
                                                                        </div>
                                                                    ) : (
                                                                        yAxisFields.map(field => (
                                                                            <SelectItem key={field.field} value={field.field}>
                                                                                {field.label}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>


                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Aggregation — only show when there are options */}
                                                    {aggregationOptions.length > 0 && (
                                                        <div className="flex items-center justify-between gap-3 h-10">
                                                            <div className="flex items-center gap-2 text-[#001F3F]">
                                                                <ChartColumn className="h-4 w-4 shrink-0" />
                                                                <Label className="text-sm font-medium whitespace-nowrap shrink-0">
                                                                    Aggregation
                                                                </Label>
                                                            </div>
                                                            <div className="flex-1 max-w-50">
                                                                <Select
                                                                    value={reportConfig.aggregation}
                                                                    onValueChange={(value) =>
                                                                        setReportConfig({ aggregation: value })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Choose aggregation" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {aggregationOptions.map((agg) => (
                                                                            <SelectItem key={agg} value={agg}>
                                                                                {agg.charAt(0).toUpperCase() + agg.slice(1)}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* GROUP BY */}
                                                    <div className="flex items-center justify-between gap-3 h-10 mt-1">
                                                        <div className="flex items-center gap-2 text-[#001F3F]">
                                                            <Network className="h-4 w-4 shrink-0" />
                                                            <Label className="text-sm font-medium whitespace-nowrap shrink-0">
                                                                Group by
                                                            </Label>
                                                        </div>
                                                        <div className="flex-1 max-w-50">
                                                            <Select
                                                                value={reportConfig.groupBy || "none"}
                                                                onValueChange={(value) =>
                                                                    setReportConfig({ groupBy: value })
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Choose group" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">None</SelectItem>
                                                                    {xAxisFields.map((field) => (
                                                                        <SelectItem key={field.field} value={field.field}>
                                                                            {field.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    {/* PIE / DOUGHNUT / RADAR */}
                                    {(chartType === "pie" ||
                                        chartType === "doughnut" ||
                                        chartType === "radar") && (
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-medium block text-[#8E8E93] px-1">
                                                    Widget data
                                                </Label>
                                                {/* Category */}
                                                <div className="flex items-center justify-between gap-3 h-10">
                                                    <Label className="text-sm font-medium whitespace-nowrap shrink-0">
                                                        Category
                                                    </Label>
                                                    <div className="flex-1 max-w-50">
                                                        <Select
                                                            value={reportConfig.category}
                                                            onValueChange={(value) =>
                                                                setReportConfig({ xAxis: value })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full h-10">
                                                                <SelectValue placeholder="Choose field" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {categoryFields.map((field: AxisField) => (
                                                                    <SelectItem key={field.field} value={field.field}>
                                                                        {field.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Value */}
                                                <div className="flex items-center justify-between gap-3 h-10">
                                                    <Label className="text-sm font-medium whitespace-nowrap shrink-0 mb-0">  {/* Inline fixes */}
                                                        Value Field
                                                    </Label>
                                                    <div className="flex-1 max-w-50 justify-between">  {/* Fixed max-w */}
                                                        <Select
                                                            value={reportConfig.value}
                                                            onValueChange={(value) =>
                                                                setReportConfig({ xAxis: value })
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Choose field" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {valueFields.map((field: AxisField) => (
                                                                    <SelectItem key={field.field} value={field.field}>
                                                                        {field.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                </TabsContent>

                                {/* ================= DATA TAB ================= */}
                                {/* <TabsContent value="data" className="mt-0">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold">Data Preview</h3>

                                        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                                            Here you can show:
                                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                                <li>API raw response preview</li>
                                                <li>Aggregated dataset</li>
                                                <li>Table view of chart data</li>
                                            </ul>
                                        </div>
                                    </div>
                                </TabsContent> */}
                            </div>

                            {/* 🔹 Fixed Bottom Buttons */}
                            <div className="flex justify-end gap-2 pr-2 pb-2">
                                <button className="btn-ghost border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-md transition-all duration-200" onClick={onClose}>
                                    Cancel
                                </button>
                                <button onClick={handleAddWidget} className="btn-primary bg-[#001F3F] hover:bg-[#001F3F] text-white p-2 rounded-md ml-2">
                                    Add widget
                                </button>
                            </div>

                        </Tabs>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
}
