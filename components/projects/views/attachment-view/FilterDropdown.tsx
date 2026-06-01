"use client";

import { Funnel } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useProjectsStore } from '@/stores/projects-store';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';

interface FilterDropdownProps {
    onFilterChange?: (type: string, value: string) => void;
    onClearFilters?: () => void;
    attachments?: any[];
    activeFilters?: Record<string, any>;
}

export function FilterDropdown({ onFilterChange, onClearFilters, attachments = [], activeFilters }: FilterDropdownProps) {
    const params = useParams();
    const projectId = params?.id as string;
    const { projects } = useProjectsStore();
    const currentProject = projects.find(p => p.id === projectId);
    const projectMembers = currentProject?.members || [];

    const { workspaceMembers } = useWorkspaceStore();

    const mappedMembers = projectMembers.map(pm => {
        const user = workspaceMembers.find(wm => wm.userId === pm.userId || (wm as any)._id === pm.userId);
        return {
            id: pm.userId,
            name: user?.name || user?.email?.split('@')[0] || pm.userId,
            email: user?.email || '',
            avatar: user?.profilePicture || user?.avatar,
            role: pm.role
        };
    });

    const [search, setSearch] = useState("");

    const tagColors: Record<string, string> = {
        "Tag option 1": "bg-[#dafbe1] text-[#34C759] border border-[#34C759] hover:bg-[#dafbe1]",
        "Tag option 2": "bg-[#fbdaff] text-[#CB30E0] border border-[#CB30E0] hover:bg-[#fbdaff]",
        "Tag option 3": "bg-[#ffd8d5] text-[#FF3B30] border border-[#FF3B30] hover:bg-[#ffd8d5]",
    };

    const tags = ["Tag option 1", "Tag option 2", "Tag option 3"];

    const filteredTags = tags.filter((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
    );

    const getExtension = (mimeType: string): string => {
        if (!mimeType) return '';
        // Common mappings; extend as needed based on getFileImage logic
        if (mimeType.includes('pdf')) return '.pdf';
        if (mimeType.includes('document') || mimeType.includes('msword')) return '.docx';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '.xlsx';
        if (mimeType.includes('png')) return '.png';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
        if (mimeType.includes('mp4')) return '.mp4';
        // Fallback: extract from filename if available, or use mimeType.split('/')[1]
        return `.${mimeType.split('/')[1] || 'unknown'}`;
    };

    const uniqueExtensions = Array.from(
        new Set(attachments.map(att => getExtension(att.mimeType)).filter(Boolean))
    ).sort();  // e.g., ['.docx', '.pdf', '.png']

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="h-9 bg-[#E5E5EA] text-[#8E8E93] rounded-md"
                >
                    <Funnel className="h-4 w-4 mr-2 " />
                    Filter
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56 text-[#001F3F] border-0 border-b-[5px] border-[#001F3F]">

                {/* Attachment Type Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={`rounded-none cursor-pointer transition-colors ${activeFilters?.attachmentType && activeFilters.attachmentType.length > 0
                            ? 'border-l-2 border-[#001F3F] pl-2 text-[#001F3F]'
                            : ''
                            }`}
                    >
                        Attachment Type
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="border-0 border-b-[5px] border-[#001F3F]">
                        {uniqueExtensions.map(ext => (
                            <DropdownMenuItem
                                key={ext}
                                onClick={() => onFilterChange?.('attachmentType', ext)}
                                className={`rounded-none cursor-pointer transition-colors ${(Array.isArray(activeFilters?.attachmentType)
                                        ? activeFilters.attachmentType.includes(ext)
                                        : activeFilters?.attachmentType === ext)
                                        ? 'border-l-2 border-[#001F3F] pl-2 text-[#001F3F]'
                                        : ''
                                    }`}
                            >
                                {ext}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>

                </DropdownMenuSub>

                {/* User Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={`rounded-none cursor-pointer transition-colors ${activeFilters?.user
                            ? 'border-l-2 border-[#001F3F] pl-2 text-[#001F3F]'
                            : ''
                            }`}
                    >
                        User
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56 border-0 border-b-[5px] border-[#001F3F] max-h-75 overflow-y-auto">
                        {mappedMembers.map(member => (
                            <DropdownMenuItem
                                key={member.id}
                                onClick={() => onFilterChange?.("user", member.id)}
                                className={`cursor-pointer rounded-none transition-colors ${activeFilters?.user === member.id
                                    ? 'border-0 border-l-2 border-[#001F3F] text-[#001F3F]'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${activeFilters?.user === member.id
                                            ? 'bg-white text-[#001F3F]'
                                            : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="truncate">{member.name}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}

                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Tags Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        Labels
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent className="w-56 p-2 space-y-2 border-0 border-b-[5px] border-[#001F3F]">
                        {/* Search Input */}
                        <div className="mb-2">
                            <Input
                                placeholder="Search tags..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8"
                            />
                        </div>

                        <Separator />

                        {/* Tags List */}
                        <div className="max-h-40 overflow-y-auto space-y-2 ">
                            {filteredTags.length > 0 ? (
                                filteredTags.map((tag) => (
                                    <DropdownMenuItem
                                        key={tag}
                                        onClick={() => onFilterChange?.("tag", tag)}
                                        className={`w-full rounded-md px-3 py-2 text-xs font-medium 
                                            flex items-center justify-center text-center
                                            ${tagColors[tag] || "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"}
                                        `}
                                    >
                                        {tag}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <div className="text-xs text-muted-foreground px-2 py-1">
                                    No tags found
                                </div>
                            )}
                        </div>
                        <div className="bg-[#001F3F] text-white text-center rounded p-1.5 text-xs">
                            + Add new Tag
                        </div>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={onClearFilters}
                    className="text-[#8E8E93]"
                >
                    Clear all filters
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}