"use client";

import React from "react";
import { ChevronRight, Settings2, Plus, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectIconAvatar } from "@/components/projects/ProjectIconAvatar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface CyclesHeaderProps {
    project: any;
    hasConfig: boolean;
    onConfigClick?: () => void;
}

export function CyclesHeader({
    project,
    hasConfig,
    onConfigClick,
}: CyclesHeaderProps) {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const cycleId = params.cycleId as string;
    const cycle = project?.cycles?.find((c: any) => c.id === cycleId);

    const handleConfigClick = () => {
        if (!hasConfig) {
            router.push(`/project/${projectId}/cycles/cycle-config/create`);
        } else {
            onConfigClick?.();
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            {/* Left Section */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-3">
                    <ProjectIconAvatar project={project} size="md" className="rounded-md" />
                    <h1 className="text-base font-semibold text-foreground">{project.name}</h1>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />

                {cycle ? (
                    <div className="flex items-center gap-2">
                        <Link href={`/project/${projectId}/cycles`} className="flex items-center gap-2 hover:opacity-80" data-testid="cycles-header-back-link">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/70 border border-border/50 shadow-sm">
                                <CalendarRange className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                            </div>
                            <span className="text-base font-semibold text-muted-foreground">Cycles</span>
                        </Link>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base font-semibold text-foreground">{cycle.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/70 border border-border/50 shadow-sm">
                            <CalendarRange className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                        </div>
                        <span className="text-base font-semibold text-foreground">Cycles</span>
                    </div>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 px-3 text-xs"
                    onClick={handleConfigClick}
                >
                    <Settings2 className="h-4 w-4" />
                    <span className="text-xs">{hasConfig ? "Config" : "Setup Config"}</span>
                </Button> */}

                <Link href={`/project/${projectId}/cycles/create`}>
                    <Button
                        variant="default"
                        size="sm"
                        className="h-8 gap-2 px-3 text-xs shadow-sm rounded-md"
                        disabled={!hasConfig}
                        data-testid="cycles-header-new-btn"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-xs">New Cycle</span>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
