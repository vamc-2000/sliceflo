// components/reports/ReportDetails.tsx
"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useReportStore } from "@/stores/reports-store";
import { Share2, Star, Plus, Expand, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WidgetModal from "./WidgetModal";
import ChartPreviewModal, { ChartType } from "./charts/ChartPreviewModal";
import ReportMoreMenu from "./ReportsDetails/ReportMoreMenu";
import ChartWidget from "./ReportsDetails/ChartWidget";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";

export default function ReportDetails() {
    const { reportId } = useParams();
    const { getReportById, activeReport, loading, toggleFavorite, favoriteLoadingIds, updateReport, duplicateReport, deleteReport } = useReportStore();

    const fetchProjectById = useProjectsStore(state => state.fetchProjectById);
    const projects = useProjectsStore(state => state.projects);
    const fetchTasks = useTasksStore(state => state.fetchTasks);
    const tasks = useTasksStore(state => state.tasks);

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
    const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);
    const [chartPreviewOpen, setChartPreviewOpen] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const textMeasureRef = useRef<HTMLSpanElement>(null);
    const [inputWidth, setInputWidth] = useState(200);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (reportId) {
            getReportById(reportId as string);
        }
    }, [reportId, getReportById]);

    useEffect(() => {
        if (activeReport?.projectId) {
            // fetchProjectById populates taskStatusConfig, taskPriorityConfig, etc.
            fetchProjectById(activeReport.projectId);
            // fetchTasks loads all tasks for the project
            fetchTasks(activeReport.projectId);
        }
    }, [activeReport?.projectId, fetchProjectById, fetchTasks]);

    useLayoutEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (textMeasureRef.current) {
            setInputWidth(textMeasureRef.current.offsetWidth + 20);
        }
    }, [editedName]);

    const handleUpdate = async () => {
        if (!activeReport) return;
        if (!editedName.trim()) {
            setEditedName(activeReport.name);
            setIsEditing(false);
            return;
        }
        if (editedName === activeReport.name) {
            setIsEditing(false);
            return;
        }
        const newName = editedName.trim();

        await updateReport(activeReport.id, {
            name: newName,
        });
        // update local state immediately
        activeReport.name = newName;
        setIsEditing(false);
    };

    const handleDuplicate = async () => {
        if (!activeReport) return;

        const newReport = await duplicateReport(activeReport);

        if (newReport?.id) {
            router.push(`/reports/${newReport.id}`);
        }
    };

    const handleDelete = () => {
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!activeReport) return;

        try {
            setDeleteLoading(true);

            await deleteReport(activeReport.id);
            toast.success("Report deleted successfully");
            setDeleteModalOpen(false);

            router.push("/reports");
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!activeReport) return <div className="p-6">Report not found</div>;

    return (
        <div className="px-4 py-2 flex flex-col h-full">
            <div className="flex items-center justify-between shrink-0">
                {/* Left Side */}
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                value={editedName}
                                style={{ width: inputWidth }}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdate();
                                    if (e.key === "Escape") {
                                        setIsEditing(false);
                                        setEditedName(activeReport.name);
                                    }
                                }}
                                className="
                                    text-[28px] font-semibold text-[#001F3F]
                                    border-b border-gray-300
                                    outline-none bg-transparent
                                    px-1 transition-all duration-150
                                "
                            />

                            {/* Save */}
                            <button
                                onClick={handleUpdate}
                                className="p-1 rounded hover:bg-green-100"
                            >
                                <Check className="w-4 h-4 text-green-600" />
                            </button>

                            {/* Cancel */}
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedName(activeReport.name);
                                }}
                                className="p-1 rounded hover:bg-red-100"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    ) : (
                        <h1
                            className="text-[28px] font-semibold text-[#001F3F] cursor-pointer transition-all duration-200"
                            onClick={() => {
                                setEditedName(activeReport.name);
                                setIsEditing(true);
                            }}
                        >
                            {activeReport.name}
                        </h1>
                    )}

                    <TooltipProvider>
                        <div className="flex items-center gap-3 text-[#001F3F]">
                            {/* More menu */}
                            <ReportMoreMenu
                                onRename={() => {
                                    setEditedName(activeReport.name);
                                    setIsEditing(true);
                                }}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onToggleFavorite={() => {
                                    if (!activeReport) return;
                                    toggleFavorite(activeReport);
                                }}
                                isFavorite={activeReport.isFavorite}
                            />
                        </div>
                    </TooltipProvider>
                </div>
                {/* Right Side Icons */}
                <div className="flex items-center gap-3 text-[#001F3F]">

                    <div className="bg-[#F2F2F7] border border-[#AEAEB2] text-[#AEAEB2] text-center px-4 py-1.5 rounded-full">
                        Refreshed 8 minutes ago
                    </div>
                    {/* Favorite */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                disabled={favoriteLoadingIds.includes(activeReport.id)}
                                onClick={() => {
                                    if (!activeReport) return;
                                    toggleFavorite(activeReport);
                                }}

                                className={`
                                        flex items-center justify-center
                                        p-2 rounded-full
                                        transition-all duration-200
                                        ${activeReport.isFavorite
                                        ? "bg-yellow-100"
                                        : "bg-[#E3EFFF] hover:bg-[#d5e6ff]"
                                    }
                                `}
                            >
                                <Star
                                    className={`
                                            w-4 h-4 transition-all duration-200
                                            ${activeReport.isFavorite
                                            ? "text-yellow-500 fill-yellow-500 scale-110"
                                            : "text-[#001F3F]"
                                        }
                                    `}
                                    strokeWidth={2.5}
                                />
                            </button>
                        </TooltipTrigger>

                        <TooltipContent>
                            {activeReport.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        </TooltipContent>
                    </Tooltip>

                    <button className="bg-[#E3EFFF] p-2 rounded-full hover:bg-[#d5e6ff]">
                        <Share2 className="w-4 h-4 text-[#001F3F]" strokeWidth={2.5} />
                    </button>

                    {activeReport.charts && activeReport.charts.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsWidgetModalOpen(true)}
                                    className="bg-[#E3EFFF] p-2 rounded-full hover:bg-[#d5e6ff] flex items-center justify-center"
                                >
                                    <Plus className="w-4 h-4 text-[#001F3F]" strokeWidth={2.5} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Add Widget
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <button className="bg-[#E3EFFF] p-2 rounded-full hover:bg-[#d5e6ff]">
                        <Expand className="w-4 h-4 text-[#001F3F]" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="mt-6 flex-1 overflow-y-auto">
                {activeReport.charts && activeReport.charts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeReport.charts.map((chart, index) => (
                            <div key={`${chart.id}-${index}`} className="min-h-[350px]">
                                <ChartWidget
                                    chart={chart}
                                    projectId={activeReport.projectId}
                                    projects={projects}
                                    tasks={tasks}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                        <Image
                            src="/images/reports/Charts.svg"
                            alt="No widgets"
                            width={350}
                            height={350}
                        />
                        <button
                            onClick={() => setIsWidgetModalOpen(true)}
                            className="flex items-center gap-2 bg-[#001F3F] text-white px-6 py-2 rounded-lg hover:bg-[#003366] transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" /> Add Widget
                        </button>
                    </div>
                )}
            </div>

            <WidgetModal
                open={isWidgetModalOpen}
                onClose={() => setIsWidgetModalOpen(false)}
                reportId={reportId as string}
                onSelectWidget={(type) => {
                    setIsWidgetModalOpen(false);
                    setChartPreviewOpen(type);
                }}
            />

            {chartPreviewOpen && (
                <ChartPreviewModal
                    open={true}
                    chartType={chartPreviewOpen as ChartType}
                    onClose={() => {
                        setChartPreviewOpen(null);      // ← close chart preview
                        setIsWidgetModalOpen(false);    // ← ensure widget modal also closed
                    }}
                />
            )}

            <ConfirmationModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Report"
                description="Deleting this report is permanent and cannot be undone."
                confirmLabel="Delete"
                loading={deleteLoading}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
