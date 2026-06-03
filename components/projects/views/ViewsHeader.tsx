"use client";

import React from "react";
import { ChevronRight, Filter, Plus, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectIconAvatar } from "@/components/projects/ProjectIconAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ViewsHeaderProps {
    project: any;
    filterCount?: number;
    onAddView?: () => void;
    onFilterClick?: () => void;
}

export function ViewsHeader({
    project,
    filterCount = 10,
    onAddView,
    onFilterClick,
}: ViewsHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            {/* Left Section: Breadcrumbs style */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-3">
                    <ProjectIconAvatar project={project} size="md" className="rounded-md" />
                    <h1 className="text-base font-semibold text-foreground">{project.name}</h1>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />

                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/70 border border-border/50 shadow-sm">
                        <Layout className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                    </div>
                    <span className="text-base font-semibold text-foreground">Views</span>
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-3">
                {/* <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 px-3 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onFilterClick}
                >
                    <Filter className="h-4 w-4" />
                    <span className="text-xs">Filter</span>
                    <Badge variant="secondary" className="h-5 min-w-[20px] px-1 rounded-sm bg-muted text-muted-foreground font-medium">
                        {filterCount}
                    </Badge>
                </Button> */}

                <Button
                    variant="default"
                    size="sm"
                    className="h-8 gap-2 px-3 text-xs shadow-sm rounded-md"
                    onClick={onAddView}
                    data-testid="views-header-add-view-btn"
                >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Add View</span>
                </Button>
            </div>
        </div>
    );
}
