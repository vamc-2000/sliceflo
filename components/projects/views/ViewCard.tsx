"use client";

import React from "react";
import { MoreHorizontal, Lock, Globe } from "lucide-react";
import { format } from "date-fns";
import { TailoredView } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectsStore } from "@/stores/projects-store";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { iconComponentMap } from "@/components/ColorIconPicker";
import { cn } from "@/lib/utils";

interface ViewCardProps {
    view: TailoredView;
    projectName?: string;
    onDelete?: () => void;
    onSelect?: () => void;
}

export const ViewCard: React.FC<ViewCardProps> = ({ view, projectName = "Project", onDelete, onSelect }) => {
    const { projects } = useProjectsStore();
    const creatorId = view.userId;
    const project = projects.find(p => p.id === view.projectId);
    const actualProjectName = projectName || project?.name || "Project";

    const creator = useWorkspaceStore.getState().workspaceMembers.find(m => m.userId === creatorId);

    // Map groupBy ID to human readable label
    const getGroupLabel = (id?: string) => {
        if (!id) return "None";
        const standardLabels: Record<string, string> = {
            'status': 'Status',
            'priority': 'Priority',
            'endDate': 'Due Date',
            'assignee': 'Assignee',
            'name': 'Task Name'
        };

        if (standardLabels[id]) return standardLabels[id];

        // Try custom fields
        const customField = project?.customFields?.find(cf => cf.id === id);
        return customField?.name || id;
    };

    const filterCount = view.filters?.children?.length || 0;

    const accentColor = view.icon?.color || "#e5e7eb";

    // Resolve icon
    const renderIcon = () => {
        if (view.icon) {
            // Case 1: Image/File
            if (view.icon.type === 'file' && view.icon.presignedUrl) {
                return (
                    <img
                        src={view.icon.presignedUrl}
                        alt={view.name}
                        className="w-full h-full object-cover rounded-md"
                    />
                );
            }

            // Case 2: Icon Library
            if (view.icon.type === 'icon' && view.icon.name) {
                const IconComponent = iconComponentMap[view.icon.name];
                if (IconComponent) {
                    return (
                        <IconComponent
                            size={22}
                            color={view.icon.color}
                        />
                    );
                }
            }
        }

        // Case 3: Fallback (First Letter)
        return (
            <div
                className="w-full h-full flex items-center justify-center font-bold text-white uppercase text-sm rounded-md"
                style={{ backgroundColor: accentColor }}
            >
                {view.name?.charAt(0) || "V"}
            </div>
        );
    };

    return (
        <div
            onClick={onSelect}
            className="group relative flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer rounded-xl"
            style={{ borderLeft: `4px solid ${accentColor}` }}
        >
            {/* Left Section: Icon & Name */}
            <div className="flex items-center gap-6 min-w-0">
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 overflow-hidden",
                        !view.icon && "p-0" // Full solid for fallback
                    )}
                    style={{ backgroundColor: view.icon ? `${accentColor}15` : 'transparent' }}
                >
                    {renderIcon()}
                </div>
                <div className="flex flex-col min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                        {view.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-medium">
                        <span className="truncate max-w-[120px]">{view.type.charAt(0).toUpperCase() + view.type.slice(1)} View</span>
                        <span className="text-gray-300">•</span>
                        <span>Grouped by: {getGroupLabel(view.groupBy)}</span>
                        <span className="text-gray-300">•</span>
                        <span>{filterCount} {filterCount === 1 ? 'filter' : 'filters'}</span>
                    </div>
                </div>
            </div>

            {/* Right Section: Metadata & Actions */}
            <div className="flex items-center gap-10 text-xs ml-auto">
                {/* Created Date */}
                <div className="flex flex-col min-w-[120px]">
                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-1">Created on</span>
                    <span className="font-semibold text-gray-700">
                        {view.createdAt ? format(new Date(view.createdAt), "MMM d, yyyy") : "N/A"}
                    </span>
                </div>

                {/* Privacy */}
                <div className="flex flex-col min-w-[90px]">
                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-1">Privacy</span>
                    <div>
                        <Badge variant="secondary" className="bg-gray-100/80 text-gray-600 font-bold rounded-md px-3 py-1 text-xs">
                            Public
                        </Badge>
                    </div>
                </div>

                {/* Created By */}
                <div className="flex flex-col min-w-[80px]">
                    <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-1">Created by</span>
                    <div className="flex items-center gap-2.5">
                        {creator?.profilePicture ? (
                            <img
                                src={creator.profilePicture}
                                alt={creator.name}
                                className="h-7 w-7 rounded-full object-cover border border-gray-200 shadow-sm"
                            />
                        ) : (
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border border-gray-200 shadow-sm">
                                <span className="text-[11px] font-bold text-white uppercase">
                                    {creator?.name?.charAt(0) || "?"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                                <MoreHorizontal className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 p-1">
                            <DropdownMenuItem className="rounded-md cursor-pointer font-medium p-2">
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-md cursor-pointer font-medium p-2">
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-md cursor-pointer font-medium p-2"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
