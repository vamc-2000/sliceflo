// components/projects/views/attachment-view/FileListHeader.tsx
"use client";

import { Plus, Search, SlidersHorizontal, FolderPlus, Funnel, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDropdown } from "./FilterDropdown";
import { useRef, useState } from "react";
import AttachFileModal from "@/components/disucssions/AttachFileModal";
import { useParams } from "next/navigation";
import { uploadFile, getUpload } from "@/lib/api/uploads-api";
import { toast } from "@/components/ui/sonner";
import { useProjectsStore } from "@/stores/projects-store";

interface FileListHeaderProps {
    onAddAttachment: () => void;
    onCreateFolder?: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    totalFiles: number;
    selectedFiles: number;
    onSelectAll?: () => void;
    onDownloadAll?: () => void;
    onDeleteSelected?: () => void;
    activeFilters?: Record<string, any>;
    onActiveFiltersChange?: (filters: Record<string, any>) => void;
    onClearFilters?: () => void;
    attachments: any[];
}

export function FileListHeader({
    onAddAttachment,
    onCreateFolder,
    searchQuery,
    onSearchChange,
    totalFiles,
    selectedFiles,
    onSelectAll,
    onDownloadAll,
    onDeleteSelected,
    activeFilters,
    onActiveFiltersChange,
    onClearFilters,
    attachments,
}: FileListHeaderProps) {
    const params = useParams();
    const projectId = params?.id as string;
    const [isUploading, setIsUploading] = useState(false);
    // const [searchQuery, setSearchQuery] = useState('');
    // const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);

    const { attachUploadsToProject, fetchProjectById } = useProjectsStore();

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => uploadFile(file));
            const results = await Promise.all(uploadPromises);
            const uploadIds = results.map(r => r.id);
            await attachUploadsToProject(projectId, uploadIds);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            toast('error', { title: error?.message || 'Failed to upload files' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddAttachment = () => {
        setIsAttachModalOpen(true);
    };

    const handleAttachFiles = async (files: File[]) => {
        setIsUploading(true);
        try {
            const uploadPromises = files.map(file => uploadFile(file));
            const results = await Promise.all(uploadPromises);

            const uploadIds = results.map(r => r.id);
            await attachUploadsToProject(projectId, uploadIds);

            setIsAttachModalOpen(false);
        } catch (error: any) {
            toast('error', { title: error?.message || 'Failed to upload files' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFilterChange = (type: string, value: string | string[]) => {
        // ✅ When selecting a filter, clear all other filters first
        const clearedFilters: Record<string, any> = {};
        clearedFilters[type] = value;
        onActiveFiltersChange?.(clearedFilters);
    };

    return (
        <div className="flex-none border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between gap-4">
                {/* Left Side - Add Attachment, Search, and Filter */}
                <div className="flex items-center gap-3 flex-1">
                    <Button
                        onClick={handleAddAttachment}
                        data-testid="btn-add-attachments-to-project"
                        className="bg-[#001F3F] hover:bg-[#252b3d] text-white"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Attachment
                    </Button>

                    <AttachFileModal
                        open={isAttachModalOpen}
                        onClose={() => setIsAttachModalOpen(false)}
                        onAttach={handleAttachFiles}
                    />

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search"
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <FilterDropdown
                        onFilterChange={handleFilterChange}
                        onClearFilters={onClearFilters}  // ✅ No error
                        attachments={attachments}
                        activeFilters={activeFilters}
                    />
                </div>

                {/* Right Side - Create Folder Icon, Select all, Download all, Delete */}
                <div className="flex items-center gap-2">            
                    <Button
                        onClick={onCreateFolder}
                        data-testid="btn-create-folder-icon"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-[#E5E5EA] text-[#8E8E93] rounded-sm"
                        title="Create Folder"
                    >
                        <FolderPlus className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSelectAll}
                        data-testid="btn-select-and-deselct-all-files"
                        className="h-9 bg-[#E5E5EA] text-[#8E8E93] rounded-sm"
                    >
                        {selectedFiles > 0 && selectedFiles === totalFiles ? 'Deselect all' : 'Select all'}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDownloadAll}
                        data-testid="btn-download-all-files"
                        className="h-9 bg-[#E5E5EA] text-[#8E8E93] rounded-sm"
                    >
                        Download all
                    </Button>

                    {selectedFiles > 0 && onDeleteSelected && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onDeleteSelected}
                            data-testid="btn-delete-selected-files"
                            // className="h-9 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-0 rounded-sm"
                            className="h-9 bg-[#D04545] text-white hover:bg-red-100 hover:text-red-700 border-0 rounded-sm"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
