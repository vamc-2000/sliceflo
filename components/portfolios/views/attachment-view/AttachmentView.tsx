"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { FileCard } from "./FileCard";
import { FileListHeader } from "./FileListHeader";
import { FileAttachment } from "@/types/attachment.types";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import { uploadFile, getUpload } from "@/lib/api/uploads-api";
import toast from "react-hot-toast";
import AttachFileModal from "@/components/disucssions/AttachFileModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Loader } from "@/components/Loader";

export default function AttachmentView() {
    const params = useParams();
    const portfolioId = params?.id as string;

    const { portfolios, attachUploadsToPortfolio, removeUploadsFromPortfolio, fetchPortfolioById } = usePortfoliosStore();
    const currentPortfolio = portfolios.find(p => p.id === portfolioId);
    const { workspaceMembers } = useWorkspaceStore();
    const { user: currentUser } = useAuthStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const hasFetchedUrlsRef = useRef(false);
    const prevAttachmentsRef = useRef<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!portfolioId) return;

            setIsInitialLoading(true);
            try {
                await fetchPortfolioById(portfolioId);
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadData();
    }, [portfolioId, fetchPortfolioById]);

    const attachments = useMemo(() => {
        return (currentPortfolio?.attachments ?? []).map((att: any) => ({
            ...att,
            attachedToName: currentPortfolio?.name || 'Portfolio',
            isProject: false
        }));
    }, [currentPortfolio?.attachments, currentPortfolio?.name]);

    useEffect(() => {
        const fetchPresignedUrls = async () => {
            if (attachments.length === 0 || isInitialLoading) {
                setAttachmentsWithUrls([]);
                return;
            }

            const isSameAttachments = prevAttachmentsRef.current.length === attachments.length &&
                prevAttachmentsRef.current.every((att, i) => att?.id === attachments[i]?.id);

            if (isSameAttachments && hasFetchedUrlsRef.current) {
                return;
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
                toast.error('Failed to load file previews');
            } finally {
                hasFetchedUrlsRef.current = true;
                setIsLoadingUrls(false);
            }
        };

        fetchPresignedUrls();
    }, [attachments, isInitialLoading]);

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

    const transformedFiles: FileAttachment[] = useMemo(() => {
        if (!attachmentsWithUrls.length) return [];

        let files = attachmentsWithUrls
            .filter(attachment => attachment && (attachment.fileName || attachment.name))
            .map(attachment => {
                const uploadedByUser = workspaceMembers.find(m => m.userId === attachment.uploadedBy || (m as any)._id === attachment.uploadedBy);
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
                    attachedTo: attachment.attachedToName || 'Portfolio',
                    isProjectAttachment: false,
                    tags: [],
                    presignedUrl: attachment.presignedUrl || undefined
                };
            });

        const selectedExts = Array.isArray(activeFilters.attachmentType)
            ? activeFilters.attachmentType as string[]
            : activeFilters.attachmentType ? [activeFilters.attachmentType as string] : [];
        if (selectedExts.length) {
            files = files.filter(file =>
                selectedExts.includes(getExtension(getMimeTypeFromType(file.type)))
            );
        }

        if (activeFilters.user) {
            files = files.filter(file => {
                if (activeFilters.user === 'me') {
                    return file.uploadedBy.id === currentUser?.id;
                }
                return file.uploadedBy.id === activeFilters.user;
            });
        }

        if (searchQuery) {
            files = files.filter(file =>
                file.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return files;
    }, [attachmentsWithUrls, activeFilters, searchQuery, workspaceMembers, currentUser]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => uploadFile(file));
            const results = await Promise.all(uploadPromises);
            const uploadIds = results.map(r => r.id);
            await attachUploadsToPortfolio(portfolioId, uploadIds);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload files');
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
            await attachUploadsToPortfolio(portfolioId, uploadIds);

            setIsAttachModalOpen(false);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSelectAll = () => {
        const visibleFileIds = transformedFiles.map(f => f.id);
        const allVisibleSelected = visibleFileIds.every(id => selectedFiles.includes(id));

        if (allVisibleSelected) {
            setSelectedFiles(prev => prev.filter(id => !visibleFileIds.includes(id)));
        } else {
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

    const handleDownloadAll = async () => {
        const filesToDownload = selectedFiles.length > 0
            ? attachmentsWithUrls.filter(a => selectedFiles.includes(a.id))
            : attachmentsWithUrls;

        if (filesToDownload.length === 0) {
            toast.error('No files to download');
            return;
        }

        toast.success(`Downloading ${filesToDownload.length} file${filesToDownload.length > 1 ? 's' : ''}...`);

        for (let i = 0; i < filesToDownload.length; i++) {
            const attachment = filesToDownload[i];
            if (!attachment?.presignedUrl) continue;

            await new Promise(resolve => setTimeout(resolve, i * 500));

            try {
                const response = await fetch(attachment.presignedUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = attachment.fileName || `file-${i + 1}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (error) {
                console.error(`Failed to download ${attachment.fileName}`, error);
                toast.error(`Failed to download ${attachment.fileName || 'file'}`);
            }
        }
    };

    const handleDownload = async (id: string) => {
        const attachment = attachmentsWithUrls.find(a => a.id === id);
        if (!attachment?.presignedUrl) {
            toast.error('Download link not available');
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
            toast.error(`Failed to download ${attachment.fileName || 'file'}`);
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
            await removeUploadsFromPortfolio(portfolioId, fileIdsToDelete);
            toast.success(fileIdsToDelete.length > 1 ? 'Attachments deleted successfully' : 'Attachment deleted successfully');
            setSelectedFiles(prev => prev.filter(id => !fileIdsToDelete.includes(id)));
        } catch (error) {
            toast.error(fileIdsToDelete.length > 1 ? 'Failed to delete attachments' : 'Failed to delete attachment');
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setFileIdsToDelete([]);
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
                    toast.error('View link not available');
                }
            } catch (error) {
                console.error('Failed to view file:', error);
                toast.error('Failed to view file');
            }
        }
    };

    const handleShare = (id: string) => {
        console.log('Share file:', id);
    };

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
                        description="Start uploading files and documents to organize your portfolio assets."
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

    const isActuallyLoading = isInitialLoading || isLoadingUrls;

    return (
        <div className="h-full overflow-hidden flex flex-col bg-background">
            <FileListHeader
                onAddAttachment={handleAddAttachment}
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
                {isActuallyLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12">
                        <Loader
                            message={isInitialLoading ? "Loading portfolio attachments..." : "Generating file previews..."}
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
                            transformedFiles.map(file => (
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
                            ))
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