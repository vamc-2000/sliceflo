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
        <div className="flex items-center justify-between px-4 py-1 border-b border-gray-200 bg-white">
            {/* Left Section: Breadcrumbs style */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-3">
                    <ProjectIconAvatar project={project} size="lg" className="rounded-md" />
                    <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-400" />

                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100/70 border border-gray-200/50 shadow-sm">
                        <Layout className="h-5 w-5 text-gray-700" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">Views</span>
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 px-3 border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={onFilterClick}
                >
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    <Badge variant="secondary" className="h-5 min-w-[20px] px-1 rounded-sm bg-gray-200 text-gray-700 font-medium">
                        {filterCount}
                    </Badge>
                </Button>

                <Button
                    size="sm"
                    className="h-9 gap-2 px-4 bg-[#001F3F] text-white hover:bg-[#002B5C] shadow-sm rounded-md"
                    onClick={onAddView}
                >
                    <Plus className="h-4 w-4" />
                    <span>Add View</span>
                </Button>
            </div>
        </div>
    );
}
