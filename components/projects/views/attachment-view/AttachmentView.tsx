"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { FileCard } from "./FileCard";
import { FileListHeader } from "./FileListHeader";
import { FileAttachment } from "@/types/attachment.types";
import { Task, TaskAttachment as Attachment } from "@/types/task.types";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import { uploadFile, getUpload } from "@/lib/api/uploads-api";
import { toast } from "@/components/ui/sonner";
import AttachFileModal from "@/components/disucssions/AttachFileModal";
import { FolderCard } from "./FolderCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Loader } from "@/components/Loader";
// import ConfirmationModal from "@/components/mailbox/ConfirmationModal";

export default function AttachmentView() {
    const params = useParams();
    const projectId = params?.id as string;

    // Get project and store actions
    const { projects, attachUploadsToProject, removeUploadsFromProject, fetchProjectById } = useProjectsStore();
    const { tasks, fetchTasks } = useTasksStore();
    const currentProject = projects.find(p => p.id === projectId);
    const { workspaceMembers } = useWorkspaceStore();
    const { user: currentUser } = useAuthStore();

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [attachmentsWithUrls, setAttachmentsWithUrls] = useState<any[]>([]);
    const [isLoadingUrls, setIsLoadingUrls] = useState(false);
    const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileIdsToDelete, setFileIdsToDelete] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Track if we have already fetched urls for the current attachments
    const hasFetchedUrlsRef = useRef(false);
    // Track the attachments we've fetched for to reset the ref if they change
    const prevAttachmentsRef = useRef<any[]>([]);

    // Load project and tasks
    useEffect(() => {
        const loadData = async () => {
            if (!projectId) return;

            setIsInitialLoading(true);
            try {
                // Always fetch project by ID to get full attachment objects
                await Promise.all([
                    fetchProjectById(projectId),
                    fetchTasks(projectId),
                ]);
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadData();
    }, [projectId]);

    // Get attachments from current project and its tasks
    const attachments = useMemo(() => {
        const projectAttachments = (currentProject?.attachments ?? []).map((att: Attachment) => ({
            ...att,
            attachedToName: currentProject?.name || 'Project',
            isProject: true
        }));

        const projectTasks = tasks.filter((t: Task) => t.projectId === projectId);
        const taskAttachments = projectTasks.flatMap((task: Task) =>
            (task.attachments ?? []).map((att: Attachment) => ({
                ...att,
                attachedToName: task.name,
                isProject: false
            }))
        );

        return [...projectAttachments, ...taskAttachments];
    }, [currentProject?.attachments, currentProject?.name, tasks, projectId]);

    // Fetch presigned URLs when attachments change
    useEffect(() => {
        const fetchPresignedUrls = async () => {
            if (attachments.length === 0 || isInitialLoading) {
                setAttachmentsWithUrls([]); // Clear if no attachments
                return;
            }

            // Check if we've already fetched for these exact attachments
            const isSameAttachments = prevAttachmentsRef.current.length === attachments.length &&
                prevAttachmentsRef.current.every((att, i) => att?.id === attachments[i]?.id);

            if (isSameAttachments && hasFetchedUrlsRef.current) {
                return; // Already fetched urls for these attachments
            }

            prevAttachmentsRef.current = attachments;
            hasFetchedUrlsRef.current = false;
            setIsLoadingUrls(true);

            try {
                const validAttachments = attachments.filter(attachment =>
                    attachment && attachment.id && attachment.id !== 'undefined'
                );

                if (validAttachments.length === 0) {
                    setAttachmentsWithUrls([]);
                    hasFetchedUrlsRef.current = true;
                    setIsLoadingUrls(false);
                    return;
                }

                const urlPromises = validAttachments.map(async (attachment) => {
                    try {
                        const uploadData = await getUpload(attachment.id);
                        return {
                            ...attachment,
                            presignedUrl: uploadData.presignedUrl
                        };
                    } catch (error) {
                        console.error(`Failed to get upload for ${attachment.id}:`, error);
                        return {
                            ...attachment,
                            presignedUrl: null
                        };
                    }
                });

                const attachmentsWithPresignedUrls = await Promise.all(urlPromises);
                setAttachmentsWithUrls(attachmentsWithPresignedUrls);
            } catch (error) {
                console.error('Failed to load file previews:', error);
                toast('error', { title: 'Failed to load file previews' });
                // Don't clear if we have some data, but we need to stop loading
            } finally {
                hasFetchedUrlsRef.current = true;
                setIsLoadingUrls(false);
            }
        };

        fetchPresignedUrls();
    }, [attachments, isInitialLoading]);

    // Helper function to map MIME type to FileAttachment type
    const getFileType = (mimeType?: string): "pdf" | "png" | "jpg" | "mp4" | "xlsx" | "doc" | "other" => {
        if (!mimeType) return 'other';
        const type = mimeType.split('/')[1]?.toLowerCase() || '';

        if (type === 'pdf') return 'pdf';
        if (type === 'png') return 'png';
        if (type === 'jpeg' || type === 'jpg') return 'jpg';
        if (type === 'mp4') return 'mp4';
        if (type.includes('spreadsheet') || type === 'xlsx' || type === 'xls') return 'xlsx';
        if (type.includes('document') || type === 'doc' || type === 'docx' || type === 'msword') return 'doc';
        return 'other';
    };

    const getExtension = (mimeType: string): string => {
        if (!mimeType) return '';
        if (mimeType.includes('pdf')) return '.pdf';
        if (mimeType.includes('document') || mimeType.includes('msword')) return '.docx';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '.xlsx';
        if (mimeType.includes('png')) return '.png';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
        if (mimeType.includes('mp4')) return '.mp4';
        return `.${mimeType.split('/')[1] || 'unknown'}`;
    };

    const getMimeTypeFromType = (type: string): string => {
        switch (type) {
            case 'pdf': return 'application/pdf';
            case 'png': return 'image/png';
            case 'jpg': return 'image/jpeg';
            case 'mp4': return 'video/mp4';
            case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'doc': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default: return '';
        }
    };

    // Transform + FILTER API attachments to FileAttachment format
    const transformedFiles: FileAttachment[] = useMemo(() => {
        if (!attachmentsWithUrls.length) return [];

        let files = attachmentsWithUrls
            .filter(attachment => attachment && (attachment.fileName || attachment.name))
            .map(attachment => {
                const uploadedByUser = workspaceMembers.find(m => m.userId === attachment.uploadedBy || m._id === attachment.uploadedBy);
                const userName = uploadedByUser?.name || uploadedByUser?.email?.split('@')[0] || 'User';
                const userAvatar = uploadedByUser?.profilePicture || uploadedByUser?.avatar || '';

                return {
                    id: attachment.id || '',
                    name: attachment.fileName || attachment.name || 'Unnamed file',
                    type: getFileType(attachment.mimeType),
                    size: `${((attachment.fileSize || 0) / 1024).toFixed(2)} KB`,
                    uploadedBy: {
                        id: attachment.uploadedBy || '',
                        name: userName,
                        avatar: userAvatar
                    },
                    uploadedOn: attachment.createdAt
                        ? new Date(attachment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })
                        : 'Unknown',
                    attachedTo: attachment.attachedToName || 'Project',
                    isProjectAttachment: attachment.isProject,
                    tags: [],
                    presignedUrl: attachment.presignedUrl || undefined
                };
            });

        // FILTER by extension from dropdown
        const selectedExts = Array.isArray(activeFilters.attachmentType)
            ? activeFilters.attachmentType as string[]
            : activeFilters.attachmentType ? [activeFilters.attachmentType as string] : [];
        if (selectedExts.length) {
            files = files.filter(file =>
                selectedExts.includes(getExtension(getMimeTypeFromType(file.type)))
            );
        }

        // FILTER by user
        if (activeFilters.user) {
            files = files.filter(file => {
                if (activeFilters.user === 'me') {
                    return file.uploadedBy.id === currentUser?.id;
                }
                return file.uploadedBy.id === activeFilters.user;
            });
        }

        // FILTER by search (existing)
        if (searchQuery) {
            files = files.filter(file =>
                file.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return files;
    }, [attachmentsWithUrls, activeFilters, searchQuery, workspaceMembers, currentProject]);

    const groupedFiles = useMemo(() => {
        return transformedFiles.reduce((acc, file) => {
            const key = file.attachedTo || "others";

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(file);
            return acc;
        }, {} as Record<string, FileAttachment[]>);
    }, [transformedFiles]);

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

    const handleCreateFolder = () => {
        console.log('Create folder clicked');
    };

    const handleSelectAll = () => {
        const visibleFileIds = transformedFiles.map(f => f.id);
        const allVisibleSelected = visibleFileIds.every(id => selectedFiles.includes(id));

        if (allVisibleSelected) {
            // Deselect all visible
            setSelectedFiles(prev => prev.filter(id => !visibleFileIds.includes(id)));
        } else {
            // Select all visible
            setSelectedFiles(prev => {
                const newSelection = [...prev];
                visibleFileIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    const handleFileCheck = (id: string, checked: boolean) => {
        setSelectedFiles(prev =>
            checked ? [...prev, id] : prev.filter(fid => fid !== id)
        );
    };

    const handleFolderCheck = (ids: string[], checked: boolean) => {
        setSelectedFiles(prev => {
            if (checked) {
                const newSelection = [...prev];
                ids.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            } else {
                return prev.filter(id => !ids.includes(id));
            }
        });
    };

    // const handleDownloadAll = () => {
    //     const filesToDownload = selectedFiles.length > 0
    //         ? attachmentsWithUrls.filter(a => selectedFiles.includes(a.id))
    //         : attachmentsWithUrls; // ✅ If nothing selected, download all

    //     if (filesToDownload.length === 0) {
    //         toast.error('No files to download');
    //         return;
    //     }

    //     filesToDownload.forEach((attachment, index) => {
    //         if (attachment?.presignedUrl) {
    //             // ✅ Stagger each download slightly to avoid browser blocking popups
    //             setTimeout(() => {
    //                 const link = document.createElement('a');
    //                 link.href = attachment.presignedUrl;
    //                 link.download = attachment.fileName || 'download';
    //                 link.target = '_blank';
    //                 document.body.appendChild(link);
    //                 link.click();
    //                 document.body.removeChild(link);
    //             }, index * 300);
    //         }
    //     });

    //     toast.success(`Downloading ${filesToDownload.length} file${filesToDownload.length > 1 ? 's' : ''}...`);
    // };

    const handleDownloadAll = async () => {
        const filesToDownload = selectedFiles.length > 0
            ? attachmentsWithUrls.filter(a => selectedFiles.includes(a.id))
            : attachmentsWithUrls;

        if (filesToDownload.length === 0) {
            toast('error', { title: 'No files to download' });
            return;
        }

        toast('success', { title: `Downloading ${filesToDownload.length} file${filesToDownload.length > 1 ? 's' : ''}...` });

        for (let i = 0; i < filesToDownload.length; i++) {
            const attachment = filesToDownload[i];
            if (!attachment?.presignedUrl) continue;

            // ✅ Stagger each download to avoid browser blocking
            await new Promise(resolve => setTimeout(resolve, i * 500));

            try {
                // ✅ Fetch the file as a blob — forces save-to-disk even for S3 URLs
                const response = await fetch(attachment.presignedUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = attachment.fileName || `file-${i + 1}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // ✅ Release blob memory after download
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (error) {
                console.error(`Failed to download ${attachment.fileName}`, error);
                toast('error', { title: `Failed to download ${attachment.fileName || 'file'}` });
            }
        }
    };

    const handleDownload = async (id: string) => {
        const attachment = attachmentsWithUrls.find(a => a.id === id);
        if (!attachment?.presignedUrl) {
            toast('error', { title: 'Download link not available' });
            return;
        }

        try {
            const response = await fetch(attachment.presignedUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = attachment.fileName || attachment.name || 'file';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.error(`Failed to download ${attachment.fileName}`, error);
            toast('error', { title: `Failed to download ${attachment.fileName || 'file'}` });
        }
    };

    const handleView = async (id: string) => {
        const file = transformedFiles.find(f => f.id === id);
        if (file?.presignedUrl) {
            window.open(file.presignedUrl, '_blank');
        } else {
            try {
                const uploadData = await getUpload(id);
                if (uploadData.presignedUrl) {
                    window.open(uploadData.presignedUrl, '_blank');
                } else {
                    toast('error', { title: 'View link not available' });
                }
            } catch (error) {
                console.error('Failed to view file:', error);
                toast('error', { title: 'Failed to view file' });
            }
        }
    };

    const handleDeleteClick = (id: string) => {
        setFileIdsToDelete([id]);
        setIsDeleteModalOpen(true);
    };

    const handleBulkDeleteClick = () => {
        if (selectedFiles.length === 0) return;
        setFileIdsToDelete(selectedFiles);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (fileIdsToDelete.length === 0) return;
        setIsDeleting(true);

        try {
            await removeUploadsFromProject(projectId, fileIdsToDelete);
            toast('success', { title: fileIdsToDelete.length > 1 ? 'Attachments deleted successfully' : 'Attachment deleted successfully' });
            setSelectedFiles(prev => prev.filter(id => !fileIdsToDelete.includes(id)));
        } catch (error) {
            toast('error', { title: fileIdsToDelete.length > 1 ? 'Failed to delete attachments' : 'Failed to delete attachment' })
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setFileIdsToDelete([]);
        }
    };

    const handleShare = (id: string) => {
        console.log('Share file:', id);
    };

    // Show landing page if no attachments
    if (attachments.length === 0 && !isUploading) {
        return (
            <div className="overflow-hidden h-full">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <div className="h-full overflow-auto p-6">
                    <LandingPage
                        title="No Attachments Yet"
                        description="Start uploading files and documents to organize your project assets."
                        extraText="Supported formats: PDF, Images, Documents, Videos, and more"
                        imageSrc="/images/attachment-image.svg"
                        imageAlt="Upload files illustration"
                        buttonText="Upload Files"
                        onButtonClick={handleAddAttachment}
                    />
                </div>

                <AttachFileModal
                    open={isAttachModalOpen}
                    onClose={() => setIsAttachModalOpen(false)}
                    onAttach={handleAttachFiles}
                />
            </div>
        );
    }

    // Set a loading state specifically meant for preventing UI flicker
    // We are actually loading if the initial fetch is happening or if we are actively fetching URLs.
    const isActuallyLoading = isInitialLoading || isLoadingUrls;

    return (
        <div className="h-full overflow-hidden flex flex-col bg-background">

            <FileListHeader
                onAddAttachment={handleAddAttachment}
                onCreateFolder={handleCreateFolder}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalFiles={attachments.length}
                selectedFiles={selectedFiles.length}
                onSelectAll={handleSelectAll}
                onDownloadAll={handleDownloadAll}
                onDeleteSelected={handleBulkDeleteClick}
                activeFilters={activeFilters}
                onActiveFiltersChange={setActiveFilters}
                onClearFilters={() => setActiveFilters({})}
                attachments={attachments}
            />

            <div className="flex-1 overflow-auto px-6 py-4">
                {isActuallyLoading ? ( // ← Show loader during initial load OR URL fetch OR when waiting for presigned urls
                    <div className="flex flex-col items-center justify-center h-full text-center p-12">
                        <Loader
                            message={isInitialLoading ? "Loading project attachments..." : "Generating file previews..."}
                            size="md"
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transformedFiles.length === 0 && attachments.length > 0 ? (
                            <div className="text-center p-12 text-muted-foreground italic">
                                No files match your current search/filters.
                            </div>
                        ) : (
                            Object.entries(groupedFiles).map(([groupName, files]) => {
                                // If there's more than one file in a task group, show a FolderCard
                                // EXCEPTION: We show project-level attachments individually as requested.
                                const isProjectGroup = files.some(f => f.isProjectAttachment);

                                if (files.length > 1 && !isProjectGroup) {
                                    return (
                                        <FolderCard
                                            key={groupName}
                                            taskName={groupName}
                                            files={files}
                                            selectedIds={selectedFiles}
                                            onFileCheck={handleFileCheck}
                                            onFolderCheck={handleFolderCheck}
                                            onDownload={handleDownload}
                                            onDelete={handleDeleteClick}
                                            onShare={handleShare}
                                            onView={handleView}
                                        />
                                    );
                                }

                                return files.map(file => (
                                    <FileCard
                                        key={file.id}
                                        file={file}
                                        checked={selectedFiles.includes(file.id)}
                                        onCheckedChange={handleFileCheck}
                                        onDownload={handleDownload}
                                        onDelete={handleDeleteClick}
                                        onShare={handleShare}
                                        onView={handleView}
                                    />
                                ));
                            })
                        )}
                    </div>
                )}
            </div>
            <ConfirmationModal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={fileIdsToDelete.length > 1 ? "Delete Attachments" : "Delete Attachment"}
                description={fileIdsToDelete.length > 1
                    ? `Are you sure you want to delete ${fileIdsToDelete.length} attachments? This action cannot be undone.`
                    : "Are you sure you want to delete this attachment? This action cannot be undone."}
                confirmLabel="Delete"
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
                loadingLabel={fileIdsToDelete.length > 1 ? "Deleting Attachments..." : "Deleting Attachment"}
            />
        </div>
    );
}
