"use client";

import { use, useEffect, useState } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loader } from "@/components/Loader";
import { CyclesHeader } from "@/components/projects/cycles/CyclesHeader";
import { CycleList } from "@/components/projects/cycles/CycleList";
import { CycleConfigSettings } from "@/components/projects/cycles/CycleConfigSettings";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";


export default function ProjectCyclesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const {
        projects,
        fetchProjectById,
        fetchCycles,
        fetchCycleConfig,
        fetchParallelCycleConfigs,
    } = useProjectsStore();

    const router = useRouter();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const project = projects.find((p) => p.id === id);
    const cycles = project?.cycles || [];
    const parallelConfigs = (project?.parallelCycleConfigs || []).filter((cfg) => cfg && cfg.id !== null);
    const hasConfig = parallelConfigs.length > 0;

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchProjectById(id);
            await Promise.all([
                fetchCycles(id),
                fetchCycleConfig(id),
                fetchParallelCycleConfigs(id),
            ]);
            setIsLoading(false);
        };
        loadData();
    }, [id, fetchProjectById, fetchCycles, fetchCycleConfig, fetchParallelCycleConfigs]);

    if (!project || isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader message="Loading cycles…" size="md" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            <div className="flex-none">
                <div className="w-full">
                    <Breadcrumbs />
                </div>
                <CyclesHeader
                    project={project}
                    hasConfig={hasConfig}
                    onConfigClick={() => setIsConfigOpen(true)}
                />
            </div>

            <div className="flex-1 overflow-auto bg-white p-3">
                {/* No config yet → landing page prompts to create config first */}
                {!hasConfig ? (
                    <LandingPage
                        title="Plan smarter with Cycles"
                        description="Break projects into focused timeframes, align around deadlines, and move forward with clarity."
                        extraText=""
                        imageSrc="/images/projects/cycles-landing.svg"
                        imageAlt="Cycles illustration"
                        buttonText="Create your first Cycle"
                        onButtonClick={() => router.push(`/project/${id}/cycles/cycle-config/create`)}
                        imageHeight={200}
                    />
                ) : (
                    /* Config exists → always show cycle list (handles empty state + New Cycle internally) */
                    <CycleList projectId={id} />
                )}
            </div>

            <CycleConfigSettings
                projectId={id}
                isOpen={isConfigOpen}
                onOpenChange={setIsConfigOpen}
            />
        </div>
    );
}
