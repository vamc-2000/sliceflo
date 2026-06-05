'use client';

import type { DiscussionType, MessageAttachment, CreateMessagePayload, MessageAuthor } from '@/types/discussions.types';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, ThumbsUp, ThumbsDown, ArrowUp, Pen, Paperclip, Pin, Trash2, Download, Delete, FoldVertical, Plus, Check, X } from "lucide-react";
import { FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, File, } from "lucide-react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { formatDiscussionDate, formatRelativeDate } from "@/utils/date";

import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';
import { useDiscussionStore } from '@/stores/discussions-store';
import { useWorkspaceStore } from "@/stores/workspace-store";

import MoreMenu from './MoreMenu';
import AttachFileModal from './AttachFileModal';
import { useMentions } from "@/hooks/useMentions";
import { getAvatarColor, getInitials } from "@/utils/avatar-utils";
import ConfirmationModal from '../ConfirmationModal';
import { toast } from '../ui/sonner';

interface LocalReply {
    id: string;
    // userId: string;
    authorId: string;
    user: string;
    author: string;
    createdAt: string;
    mention: string;
    text: string;
    editable: boolean;
    edited: boolean;
    attachments: MessageAttachment[];
}

interface Thread {
    id: string;
    discussionId: string;
    user: string;
    avatar: string;
    createdAt: string;
    text: string;
    replies: LocalReply[];
    isPinned?: boolean;
    attachments?: MessageAttachment[];
}

interface MentionableMember {
    id: string;
    name: string;
    profilePictureUrl?: string;
}

interface ThreadCardProps {
    thread: Thread;
    entityType: DiscussionType;
    entityId: string;
    projectId?: string;
    collapsed: boolean;
    onToggleCollapse: () => void;
    mentionableMembers: MentionableMember[];
}

export const getFileIconSrc = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "/images/discussions/imgs.png";
    if (mimeType.includes("pdf")) return "/images/discussions/pdf.svg";
    if (mimeType.includes("word")) return "/images/discussions/word.svg";
    if (mimeType.includes("ppt")) return "/images/discussions/ppt.svg";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
        return "/images/discussions/excel.svg";
    if (mimeType.includes("zip") || mimeType.includes("rar"))
        return "/file-icons/zip.svg";

    return "/file-icons/default.svg";
};

export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function ThreadCard({
    thread,
    entityType,
    entityId,
    projectId,
    collapsed,
    onToggleCollapse,
    mentionableMembers,
}: ThreadCardProps) {
    const { user: profileUser } = useProfileStore();
    const { user } = useAuthStore();
    const {
        discussions,
        createMessage,
        updateMessage,
        deleteDiscussion,
        deleteReply,
        deleteDiscussionAttachment,
        isMessagesLoading,
    } = useDiscussionStore();
    const toggleDiscussionPin = useProfileStore((s) => s.toggleDiscussionPin);

    const pinnedThreadId =
        profileUser?.discussionSettings?.[entityType]?.[entityId]?.pinnedThreadId ?? null;

    const isPinned = pinnedThreadId === thread.id || pinnedThreadId === (thread as any)._id;

    const [replyAttachments, setReplyAttachments] = useState<Record<string, File[]>>({});
    const [threadReplyInputs, setThreadReplyInputs] = useState<Record<string, string>>({});
    const [activeAttachThreadId, setActiveAttachThreadId] = useState<string | null>(null);
    const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [replyInput, setReplyInput] = useState("");
    const [newThreadText, setNewThreadText] = useState("");
    const [replyMentions, setReplyMentions] = useState<any[]>([]);
    const [editMentions, setEditMentions] = useState<any[]>([]);
    const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);
    const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
    const [emojiPickerForReaction, setEmojiPickerForReaction] = useState<string | null>(null);
    const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);
    const [isDeletingReply, setIsDeletingReply] = useState(false);

    const [deleteAttachmentState, setDeleteAttachmentState] = useState<{
        attachmentId: string;
        replyId?: string;
    } | null>(null);
    const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);

    const attachmentCount = replyAttachments[thread.id]?.length ?? 0;
    const profileImageUrl = profileUser?.profilePictureUrl || "";

    const workspaceMembers = useWorkspaceStore((s) => s.workspaceMembers);
    const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
    const fetchWorkspaceMembers = useWorkspaceStore((s) => s.fetchWorkspaceMembers);

    const initials = getInitials(user?.name);

    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [emojiAnchor, setEmojiAnchor] = useState<null | "main" | string | "thread-new">(null);
    const repliesEndRef = useRef<HTMLDivElement>(null);

    const replyInputRef = useRef<HTMLInputElement | null>(null);
    const replyMirrorRef = useRef<HTMLDivElement | null>(null);
    const editInputRef = useRef<HTMLInputElement | null>(null);
    const editMirrorRef = useRef<HTMLDivElement | null>(null);
    const smileRef = useRef<HTMLDivElement | null>(null)
    const replySmileButtonRef = useRef<HTMLButtonElement | null>(null)
    const pickerRef = useRef<HTMLDivElement | null>(null)

    const {
        showMentionList,
        filteredMembers,
        mentionIndex,
        mentionPosition,
        onChange,
        onKeyDown,
        onSelectMember: internalOnSelectMember,
        updateMentionPosition,
    } = useMentions({
        value: threadReplyInputs[thread.id] || "",
        setValue: (v) =>
            setThreadReplyInputs((prev) => ({ ...prev, [thread.id]: v })),
        inputRef: replyInputRef,
        mirrorRef: replyMirrorRef,
        members: mentionableMembers,
    });

    const handleMentionSelect = (member: MentionableMember) => {
        setReplyMentions(prev => [...prev, { userId: member.id, username: member.name }]);
        internalOnSelectMember(member);
    };

    const {
        showMentionList: showEditMentionList,
        filteredMembers: filteredEditMembers,
        mentionIndex: editMentionIndex,
        mentionPosition: editMentionPosition,
        onChange: onEditChange,
        onKeyDown: onEditKeyDown,
        onSelectMember: internalOnEditSelectMember,
    } = useMentions({
        value: editText,
        setValue: setEditText,
        inputRef: editInputRef,
        mirrorRef: editMirrorRef,
        members: mentionableMembers,
    });

    const handleEditMentionSelect = (member: MentionableMember) => {
        setEditMentions(prev => [...prev, { userId: member.id, username: member.name }]);
        internalOnEditSelectMember(member);
    };

    useEffect(() => {
        if (shouldAutoScrollRef.current) {
            repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [thread.replies.length]);

    useEffect(() => {
        if (!reactionPickerFor && !emojiPickerForReaction) return

        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node

            if (
                pickerRef.current?.contains(target) ||
                smileRef.current?.contains(target) ||
                emojiPickerRef.current?.contains(target)
            ) {
                return
            }

            setReactionPickerFor(null)
            setEmojiPickerForReaction(null)
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [reactionPickerFor, emojiPickerForReaction])

    useEffect(() => {
        if (currentWorkspace?.id && workspaceMembers.length === 0) {
            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [currentWorkspace?.id]);

    const containerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);

    const handleScroll = () => {
        const el = containerRef.current;
        if (!el) return;

        const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;

        shouldAutoScrollRef.current = nearBottom;
    };

    const handleEmojiSelect = (emoji: string) => {
        if (emojiAnchor === "main") {
            setReplyInput((prev) => prev + emoji);
        } else if (typeof emojiAnchor === "string") {
            setThreadReplyInputs((prev) => ({
                ...prev,
                [emojiAnchor]: (prev[emojiAnchor] || "") + emoji,
            }));
        } else if (emojiAnchor === "thread-new") {
            setNewThreadText((prev) => prev + emoji);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setEmojiAnchor(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const getValidMentions = (text: string, trackedMentions: any[]) => {
        const validMentions: any[] = [];
        const lowerText = text.toLowerCase();

        // Unique tracked mentions by userId to avoid duplicates
        const uniqueTracked = trackedMentions.reduce((acc: any[], current: any) => {
            if (!acc.find(item => item.userId === current.userId)) {
                acc.push(current);
            }
            return acc;
        }, []);

        uniqueTracked.forEach(mention => {
            const mentionMarker = `@${mention.username}`.toLowerCase();
            let pos = -1;
            while ((pos = lowerText.indexOf(mentionMarker, pos + 1)) !== -1) {
                // Ensure we don't duplicate at the same position
                if (!validMentions.find(m => m.position === pos)) {
                    validMentions.push({
                        userId: mention.userId,
                        username: mention.username,
                        position: pos
                    });
                }
            }
        });

        return validMentions;
    };

    const handleTogglePin = async (threadId: string, shouldPin: boolean) => {
        // threadId == discussionId from store
        if (!profileUser) return;
        try {
            await toggleDiscussionPin(entityType, entityId, threadId, shouldPin);
            // No need to manually set isPinned, ordering is controlled by getSortedDiscussions
            // but you can still keep thread.isPinned for UI color if you want,
            // by deriving it from getPinnedDiscussionIds or metadata.
        } catch (e) {
            console.error("Failed to toggle pin", e);
        }
    };

    const handleSaveEdit = async () => {
        if (!editId || !editText.trim()) return;

        try {
            const mentions = getValidMentions(editText, editMentions);

            await updateMessage(
                thread.discussionId, // ✅ discussionId
                editId,              // ✅ replyId
                {
                    text: editText.trim(),
                    mentions
                }
            );
        } catch (err) {
            console.error("Failed to update reply", err);
        } finally {
            // exit edit mode
            setEditId(null);
            setEditText("");
            setEditingThreadId(null);
        }
    };

    const handleConfirmDeleteAttachment = async () => {
        if (!deleteAttachmentState) return;
        setIsDeletingAttachment(true);
        try {
            if (deleteAttachmentState.replyId) {
                await updateMessage(
                    thread.discussionId,
                    deleteAttachmentState.replyId,
                    { removeAttachmentIds: [deleteAttachmentState.attachmentId] }
                );
            } else {
                await deleteDiscussionAttachment(thread.discussionId, deleteAttachmentState.attachmentId);
            }
            toast("success", {
                title: "Attachment deleted",
                description: "The attachment has been removed successfully.",
            });
        } catch (err) {
            console.error("Failed to delete attachment:", err);
            toast("error", {
                title: "Failed to delete",
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setIsDeletingAttachment(false);
            setDeleteAttachmentState(null);
        }
    };

    const handleThreadReplyChange = (threadId: string, value: string) => {
        setThreadReplyInputs((prev) => ({
            ...prev,
            [threadId]: value,
        }));
    };

    const handleDeleteReply = (threadId: string | null, replyId: string) => {
        setDeleteReplyId(replyId);
    };

    const handleConfirmDeleteReply = async () => {
        if (!deleteReplyId) return;
        setIsDeletingReply(true);
        try {
            await deleteReply(thread.discussionId, deleteReplyId);
            toast("info", {
                title: "Reply deleted",
                description: "The reply has been deleted successfully.",
            });
        } catch (err) {
            console.error("Failed to delete reply", err);
            toast("error", {
                title: "Failed to delete",
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setIsDeletingReply(false);
            setDeleteReplyId(null);
        }
    };

    const handleEdit = (threadId: string, replyId: string, currentText: string) => {
        if (!replyId) return;
        setEditId(replyId);
        setEditText(currentText);
        setEditingThreadId(threadId);
    };

    const handleDeleteThread = async (threadId: string) => {
        try {
            await deleteDiscussion(threadId);
        } catch (error) {
            console.error("Error deleting thread:", error);
        }
    };

    const getReplyId = (reply: any) => reply.id ?? reply._id;

    const handleReaction = async (replyId: string, emoji: string) => {
        const discussion = discussions.find(
            (d) => (d.id ?? d._id) === thread.discussionId
        );

        const message = discussion?.messages?.find(
            (m: any) => (m.id ?? m._id) === replyId
        );

        if (!message || !user?.id) return;

        const existingReaction = message.reactions?.find(
            (r: any) => r.emoji === emoji && r.userId === user.id
        );

        try {
            if (existingReaction) {
                await updateMessage(thread.discussionId, replyId, {
                    removeReactionIds: [existingReaction.id || (existingReaction as any)._id],
                });
            } else {
                await updateMessage(thread.discussionId, replyId, {
                    reactions: [emoji],
                });
            }
        } catch (err) {
            console.error("Failed to update reaction", err);
        }
    };

    const handleSendReply = async (overrideText?: string) => {
        const replyText = overrideText ?? (threadReplyInputs[thread.id] || "");
        const files = replyAttachments[thread.id] || [];

        if (!replyText.trim() && files.length === 0) return;

        const mentions = getValidMentions(replyText, replyMentions);
        const text = replyText.trim();

        setThreadReplyInputs((prev) => ({ ...prev, [thread.id]: "" }));
        setReplyMentions([]);
        setReplyAttachments((prev) => {
            const copy = { ...prev };
            delete copy[thread.id];
            return copy;
        });

        shouldAutoScrollRef.current = true;

        try {
            await createMessage(
                entityType,
                entityId,
                thread.discussionId,
                {
                    text,
                    mentions,
                    reactions: [],
                },
                { files: files.length > 0 ? files : undefined }
            );
        } catch (err) {
            console.error("Failed to send reply:", err);
        }
    };

    const discussion = discussions.find((d) => (d._id ?? d.id) === thread.discussionId);
    const allReplies = discussion?.messages ?? [];
    const messagesLoading = isMessagesLoading(thread.discussionId);

    const getAuthorAvatar = (author: string | MessageAuthor | undefined): string => {
        let src = "";
        if (typeof author === 'object') {
            src = author?.profilePicture || (author as any)?.profilePictureUrl || "";
        } else {
            const id = author;
            if (id) {
                const member = workspaceMembers.find((m) => m.userId === id);
                src = member?.profilePicture || member?.avatar || "";

                if (!src) {
                    const mentioned = mentionableMembers.find((m) => m.id === id);
                    src = mentioned?.profilePictureUrl || "";
                }
            }
        }

        // Ensure it looks like a valid URL or path
        if (src && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))) {
            return src;
        }
        return "";
    };

    const getAuthorId = (author: string | MessageAuthor | undefined): string => {
        return typeof author === "string" ? author : author?.id || "";
    };

    const getAuthorInitials = (author: string | MessageAuthor | undefined): string => {
        const name = getAuthorName(author);
        return getInitials(name);
    };

    const getAuthorName = (author: string | MessageAuthor | undefined): string => {
        const id = typeof author === "string" ? author : author?.id;
        if (!id) return "Unknown";

        // Match against workspace members using userId
        const member = workspaceMembers.find((m) => m.userId === id);
        if (member?.name) return member.name;

        // Fallback: check mentionableMembers passed as prop
        const mentioned = mentionableMembers.find((m) => m.id === id);
        if (mentioned?.name) return mentioned.name;

        return "Unknown";
    };

    const renderMessageText = (text: string, mentions: any[] = []) => {
        if (!mentions || mentions.length === 0) {
            // Fallback to simple regex if mentions array is missing but text has @
            if (!text.includes('@')) return text;

            const parts = text.split(/(@\w+)/g);
            return parts.map((part, i) => {
                if (part.startsWith('@')) {
                    return <span key={i} className="text-primary font-semibold">{part}</span>;
                }
                return part;
            });
        }

        // Sort mentions by position to process sequentially
        const sortedMentions = [...mentions].sort((a, b) => a.position - b.position);
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;

        sortedMentions.forEach((mention, index) => {
            const mentionText = `@${mention.username}`;
            const pos = text.indexOf(mentionText, lastIndex);

            if (pos !== -1) {
                // Add text before the mention
                if (pos > lastIndex) {
                    parts.push(text.substring(lastIndex, pos));
                }

                // Add the mention itself
                parts.push(
                    <span key={`mention-${index}`} className="text-primary font-semibold cursor-pointer hover:underline">
                        {mentionText}
                    </span>
                );

                lastIndex = pos + mentionText.length;
            }
        });

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <Card
            className={`rounded-xl border bg-background mt-2 mb-2 ml-2 shadow-sm ${collapsed ? "p-0 overflow-hidden" : "px-2 pt-2 pb-1 gap-2"}`}
        >
            <CardHeader className={`p-0 m-0 ${collapsed ? "" : "-mt-2 -mx-2 mb-2"}`}>
                <div className={`p-3 sticky top-0 z-10 ${collapsed ? "" : "border-b border-border rounded-t-xl"} ${isPinned ? "bg-orange-500/10" : "bg-background"}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                                <AvatarImage src={thread.avatar} />
                                <AvatarFallback className={`${getAvatarColor(thread.id)} text-xs font-semibold text-white`}>
                                    {getInitials(thread.user)}
                                </AvatarFallback>
                            </Avatar>
                            {/* name + time stacked vertically */}
                            <div className="flex flex-col leading-tight">
                                <span className="text-[0.8rem] font-semibold text-foreground">
                                    {thread.user}
                                </span>
                                <span className="text-[0.7rem] text-muted-foreground">
                                    {formatDiscussionDate(thread.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isPinned ? (
                                <button
                                    type="button"
                                    data-testid={`btn-unpin-thread-${thread.id}`}
                                    className="bg-[#FF8D28] p-1 rounded cursor-pointer"
                                    onClick={() => handleTogglePin(thread.id, false)}
                                >
                                    <Pin size={14} className="text-white rotate-45" strokeWidth={2.5} />
                                </button>
                            ) : null}
                            <button
                                type="button"
                                data-testid={`btn-toggle-collapse-${thread.id}`}
                                onClick={onToggleCollapse}
                                className={`cursor-pointer p-1 rounded-md transition-colors ${collapsed ? "bg-primary hover:bg-primary/80" : "bg-muted hover:bg-muted/70"
                                    }`}
                            >
                                <FoldVertical
                                    size={18}
                                    className={`transition-transform duration-200 ${collapsed
                                        ? "text-primary-foreground rotate-0"
                                        : "text-muted-foreground rotate-180"
                                        }`}
                                />
                            </button>
                            <MoreMenu
                                commentId={thread.id}
                                threadText={thread.text}
                                entityType={entityType}     // ✅ From DiscussionPage props
                                entityId={entityId}         // ✅ From DiscussionPage props
                                projectId={projectId}
                                isPinned={isPinned}
                                onTogglePin={handleTogglePin}
                                onDelete={handleDeleteThread}
                                participants={discussion?.participants}
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            {!collapsed && (
                <CardContent className="p-0 pt-1 m-0">
                    <div className="rounded-md px-3 py-2 border border-border w-[80%] flex flex-col gap-2">
                        {thread.text && (
                            <p className="text-[0.75rem] text-muted-foreground">
                                {thread.text}
                            </p>
                        )}

                        {thread.attachments && thread.attachments.length > 0 && (
                            <div className="space-y-2">
                                {thread.attachments.map((file, index) => {
                                    const iconSrc = getFileIconSrc(file.mimeType);
                                    const isImageFile = file.mimeType.startsWith("image/");
                                    const attachmentId = file.id ?? (file as any)._id;

                                    return (
                                        <div
                                            key={`thread-${thread.id}-${attachmentId ?? index}`}
                                            className="flex items-center justify-between rounded-xl border bg-background p-3 shadow-sm w-[320px]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-muted px-2 py-2 flex items-center justify-center">
                                                    {isImageFile ? (
                                                        <ImageIcon size={15} className="text-[#007AFF]" />
                                                    ) : (
                                                        <Image
                                                            src={iconSrc}
                                                            alt="file icon"
                                                            width={15}
                                                            height={12}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span
                                                        className="text-sm font-medium text-foreground truncate max-w-37.5"
                                                        title={file.originalName}
                                                    >
                                                        {file.originalName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatFileSize(file.size)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_S3_BASE_URL}/${file.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>

                                                <Button
                                                    variant="ghost"
                                                    disabled={!attachmentId}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted "
                                                    data-testid={`btn-delete-thread-attachment-${attachmentId}`}
                                                    onClick={() => {
                                                        if (!attachmentId) return;
                                                        setDeleteAttachmentState({ attachmentId });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div
                        ref={containerRef}
                        onScroll={handleScroll}
                        className="max-h-100 overflow-y-auto mt-2 space-y-1"
                    >
                        {messagesLoading && allReplies.length === 0 && (
                            <div className="space-y-2 py-2" data-testid={`thread-messages-loading-${thread.id}`}>
                                {[1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="ml-auto h-14 w-[80%] rounded-lg bg-muted animate-pulse"
                                    />
                                ))}
                            </div>
                        )}
                        {allReplies.map((reply) => {
                            return (
                                <div
                                    // key={`${thread.id}-${reply.id || reply.createdAt}`}
                                    key={`${thread.id}-${getReplyId(reply)}`}
                                    onMouseEnter={() => setHoveredReplyId(getReplyId(reply))}
                                    onMouseLeave={() => {
                                        setHoveredReplyId(null);
                                    }}
                                    className={`relative flex justify-end mt-1 group ${reply.pending ? "opacity-80" : ""}`}
                                >
                                    <div className="relative bg-muted rounded-lg px-4 py-2 w-[80%] ">
                                        {hoveredReplyId === getReplyId(reply) && (
                                            <div className="absolute top-1/2 -left-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* 👇 THIS is the anchor */}
                                                <div ref={smileRef} className="relative">
                                                    <button
                                                        type="button"
                                                        data-testid={`btn-reaction-smile-${getReplyId(reply)}`}
                                                        onClick={() =>
                                                            setReactionPickerFor(
                                                                reactionPickerFor === getReplyId(reply)
                                                                    ? null
                                                                    : getReplyId(reply)
                                                            )
                                                        }
                                                    >
                                                        <Smile size={18} className="text-gray-600" />
                                                    </button>

                                                    {/* 👇 Picker is NOW relative to Smile */}
                                                    {reactionPickerFor === getReplyId(reply) &&
                                                        smileRef.current &&
                                                        createPortal(
                                                            (() => {
                                                                const rect = smileRef.current!.getBoundingClientRect()

                                                                return (
                                                                    <div
                                                                        ref={pickerRef}
                                                                        data-mention-dropdown="true"
                                                                        style={{
                                                                            position: "fixed",
                                                                            top: rect.top - 44, // Slightly higher to account for padding
                                                                            left: rect.left + rect.width / 2,
                                                                            transform: "translateX(-50%)",
                                                                            zIndex: 9999,
                                                                        }}
                                                                        className="flex items-center gap-1 bg-background/80 backdrop-blur-md border border-border rounded-full px-2 py-1 shadow-[0_4px_20px_rgb(0,0,0,0.08)] ring-1 ring-black/5 pointer-events-auto"
                                                                    >
                                                                        {["👍", "🙏", "❤️", "🔥", "🚀"].map((emoji) => (
                                                                            <button
                                                                                key={emoji}
                                                                                data-testid={`btn-quick-reaction-${emoji}-${getReplyId(reply)}`}
                                                                                className="text-[0.95rem] hover:scale-125 active:scale-95 transition-all duration-200 px-1"
                                                                                onClick={() => {
                                                                                    handleReaction(getReplyId(reply), emoji)
                                                                                    setReactionPickerFor(null)
                                                                                }}
                                                                            >
                                                                                {emoji}
                                                                            </button>
                                                                        ))}
                                                                        <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                                                        <button
                                                                            className="p-1 hover:bg-black/5 rounded-full transition-colors text-gray-500 hover:text-black"
                                                                            data-testid={`btn-open-full-emoji-${getReplyId(reply)}`}
                                                                            onClick={() => {
                                                                                setEmojiPickerForReaction(getReplyId(reply))
                                                                                setReactionPickerFor(null)
                                                                            }}
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                )
                                                            })(),
                                                            document.body
                                                        )}

                                                    {/* Full Emoji Picker Portal for Reactions */}
                                                    {emojiPickerForReaction === getReplyId(reply) &&
                                                        smileRef.current &&
                                                        createPortal(
                                                            (() => {
                                                                const rect = smileRef.current!.getBoundingClientRect()
                                                                const pickerWidth = 280;
                                                                const pickerHeight = 350;
                                                                const margin = 8;

                                                                // Smart positioning: above or below
                                                                const spaceAbove = rect.top;
                                                                const spaceBelow = window.innerHeight - rect.bottom;
                                                                const shouldShowAbove = spaceAbove > pickerHeight + margin;

                                                                const top = shouldShowAbove
                                                                    ? rect.top - pickerHeight - margin
                                                                    : rect.bottom + margin;

                                                                return (
                                                                    <div
                                                                        ref={pickerRef}
                                                                        data-mention-dropdown="true"
                                                                        style={{
                                                                            position: "fixed",
                                                                            top: Math.max(margin, Math.min(top, window.innerHeight - pickerHeight - margin)),
                                                                            left: Math.max(margin, Math.min(rect.left - pickerWidth / 2, window.innerWidth - pickerWidth - margin)),
                                                                            zIndex: 100000,
                                                                            "--epr-emoji-size": "20px",
                                                                            "--epr-category-navigation-button-size": "24px",
                                                                        } as any}
                                                                        className="rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.18)] border border-border bg-background animate-in fade-in zoom-in duration-200 pointer-events-auto"
                                                                    >
                                                                        <EmojiPicker
                                                                            onEmojiClick={(emojiData) => {
                                                                                handleReaction(getReplyId(reply), emojiData.emoji)
                                                                                setEmojiPickerForReaction(null)
                                                                            }}
                                                                            width={pickerWidth}
                                                                            height={pickerHeight}
                                                                            emojiStyle={EmojiStyle.NATIVE}
                                                                            theme={Theme.LIGHT}
                                                                            lazyLoadEmojis
                                                                            previewConfig={{ showPreview: false }}
                                                                            skinTonesDisabled
                                                                            searchPlaceholder="Search..."
                                                                        />
                                                                    </div>
                                                                )
                                                            })(),
                                                            document.body
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-muted rounded-lg px-2 py-1 flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {(() => {
                                                        const avatarUrl = getAuthorAvatar(reply.authorId);
                                                        const initials = getAuthorInitials(reply.authorId);
                                                        const name = getAuthorName(reply.authorId);

                                                        return (
                                                            <>
                                                                <Avatar className="w-6 h-6 shrink-0">
                                                                    <AvatarImage src={avatarUrl} />
                                                                    <AvatarFallback className={`${getAvatarColor(getAuthorId(reply.authorId))} text-[10px] font-semibold text-white`}>
                                                                        {initials}
                                                                    </AvatarFallback>
                                                                </Avatar>

                                                                <span className="text-[0.75rem] font-semibold text-foreground">
                                                                    {name}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                    <span className="text-[0.7rem] text-gray-500">
                                                        {reply.isEdited ? "Edited" : "Replied"} {" "}
                                                        {formatRelativeDate(reply.createdAt)}
                                                    </span>
                                                </div>

                                                {editId === getReplyId(reply) && editingThreadId === thread.id ? (
                                                    <div className="flex flex-col flex-1 mt-1 relative">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex-1 min-w-0">
                                                                <div
                                                                    ref={editMirrorRef}
                                                                    className="pointer-events-none absolute invisible whitespace-pre-wrap wrap-break-word text-[0.75rem]"
                                                                    style={{
                                                                        width: editInputRef.current?.clientWidth,
                                                                        fontFamily: "inherit",
                                                                        lineHeight: "1.25rem",
                                                                        padding: "4px 12px",
                                                                    }}
                                                                />
                                                                <Input
                                                                    ref={editInputRef}
                                                                    data-testid={`input-edit-reply-${getReplyId(reply)}`}
                                                                    value={editText}
                                                                    autoFocus
                                                                    onChange={onEditChange}
                                                                    onKeyDown={(e) => {
                                                                        onEditKeyDown(e);
                                                                        if (e.key === "Enter" && !e.shiftKey && !showEditMentionList) {
                                                                            e.preventDefault();
                                                                            handleSaveEdit();
                                                                        }
                                                                    }}
                                                                    placeholder="Edit your reply..."
                                                                    className="text-[0.75rem] text-foreground h-8 w-full"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                data-testid={`btn-save-edit-${getReplyId(reply)}`}
                                                                className="cursor-pointer text-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted"
                                                                onClick={handleSaveEdit}
                                                                aria-label="Save"
                                                            >
                                                                <Check size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                data-testid={`btn-cancel-edit-${getReplyId(reply)}`}
                                                                className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-muted"
                                                                aria-label="Cancel"
                                                                onClick={() => {
                                                                    setEditId(null);
                                                                    setEditText("");
                                                                    setEditingThreadId(null);
                                                                    setEditMentions([]);
                                                                }}
                                                            >
                                                                <X size={15} />
                                                            </button>
                                                        </div>

                                                        {showEditMentionList && editMentionPosition && createPortal(
                                                            <div
                                                                data-mention-dropdown="true"
                                                                className="fixed z-[100001] w-64 max-h-64 overflow-auto rounded-xl border border-border bg-popover shadow-2xl pointer-events-auto"
                                                                style={{
                                                                    left: editMentionPosition.left,
                                                                    top: editMentionPosition.top,
                                                                    transform: editMentionPosition.isAbove ? "translateY(-100%)" : undefined,
                                                                }}
                                                            >
                                                                {filteredEditMembers.map((m, idx) => (
                                                                    <button
                                                                        key={m.id}
                                                                        type="button"
                                                                        data-testid={`btn-edit-mention-${m.id}`}
                                                                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm
                                                                            ${idx === editMentionIndex ? "bg-muted" : "hover:bg-muted"}`}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            handleEditMentionSelect(m);
                                                                        }}
                                                                    >
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarImage src={m.profilePictureUrl} />
                                                                            <AvatarFallback className={`${getAvatarColor(m.id)} text-white text-[10px]`}>
                                                                                {getInitials(m.name)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        {m.name}
                                                                    </button>
                                                                ))}
                                                            </div>,
                                                            document.body
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {reply.attachments?.length > 0 && (
                                                            <div className="mt-2 space-y-2">
                                                                {reply.attachments.map((file, index) => {
                                                                    // const Icon = getFileIcon(file.mimeType);
                                                                    const iconSrc = getFileIconSrc(file.mimeType);
                                                                    const isImageFile = file.mimeType.startsWith("image/");
                                                                    const attachmentId = file.id ?? file._id;

                                                                    return (
                                                                        <div
                                                                            key={`${reply.id}-${file.id ?? file.url ?? index}`}
                                                                            className="flex items-center justify-between rounded-xl border bg-background p-3 shadow-sm w-[320px]"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                {/* <div className="rounded-full bg-[#E5E5EA] p-2">
                                                                                <Icon className="h-5 w-5 text-[#007AFF]" />
                                                                            </div> */}
                                                                                <div className="rounded-full bg-muted px-2 py-2 flex items-center justify-center">
                                                                                    {isImageFile ? (
                                                                                        <ImageIcon size={15} className="text-[#007AFF]" />
                                                                                    ) : (
                                                                                        <Image
                                                                                            src={iconSrc}
                                                                                            alt="file icon"
                                                                                            width={15}
                                                                                            height={12}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <span
                                                                                        className="text-sm font-medium text-foreground truncate max-w-37.5"
                                                                                        title={file.originalName}
                                                                                    >
                                                                                        {file.originalName}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {formatFileSize(file.size)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2">
                                                                                <a
                                                                                    href={`${process.env.NEXT_PUBLIC_S3_BASE_URL}/${file.url}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                                                                >
                                                                                    <Download className="h-4 w-4" />
                                                                                </a>

                                                                                <Button
                                                                                    variant="ghost"
                                                                                    disabled={!attachmentId}
                                                                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted "
                                                                                    data-testid={`btn-delete-attachment-${attachmentId}`}
                                                                                    onClick={() => {
                                                                                        if (!attachmentId) return;
                                                                                        setDeleteAttachmentState({ attachmentId, replyId: getReplyId(reply) });
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {reply.text && (() => {
                                                            const isOnlyEmoji = typeof reply.text === 'string' &&
                                                                reply.text.trim().length > 0 &&
                                                                reply.text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d]/gu, '').trim() === '';

                                                            return (
                                                                <p className={`text-muted-foreground mt-1 ${isOnlyEmoji ? 'text-2xl py-1' : 'text-[0.75rem]'}`}>
                                                                    {renderMessageText(reply.text, reply.mentions)}
                                                                </p>
                                                            );
                                                        })()}
                                                        {reply.reactions?.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {Object.entries(
                                                                    reply.reactions.reduce((acc: Record<string, { count: number, userIds: string[] }>, r: any) => {
                                                                        if (!acc[r.emoji]) {
                                                                            acc[r.emoji] = { count: 0, userIds: [] };
                                                                        }
                                                                        acc[r.emoji].count += 1;
                                                                        if (!acc[r.emoji].userIds.includes(r.userId)) {
                                                                            acc[r.emoji].userIds.push(r.userId);
                                                                        }
                                                                        return acc;
                                                                    }, {})
                                                                ).map(([emoji, data]) => {
                                                                    const userHasReacted = reply.reactions.some(
                                                                        (r: any) => r.emoji === emoji && r.userId === user?.id
                                                                    );

                                                                    return (
                                                                        <Popover key={emoji}>
                                                                            <PopoverTrigger asChild>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs shadow-sm transition-colors ${userHasReacted
                                                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                                                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                                                                                        }`}
                                                                                >
                                                                                    <span>{emoji}</span>
                                                                                    <span>{data.count}</span>
                                                                                </button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-52 p-2">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <p className="text-[10px] font-bold text-gray-400 px-2 pb-1 uppercase tracking-wider border-b border-gray-100 mb-1">
                                                                                        Reactions
                                                                                    </p>
                                                                                    <div className="max-h-40 overflow-y-auto pr-1">
                                                                                        {data.userIds.map((uid) => {
                                                                                            const isCurrentUser = uid === user?.id;
                                                                                            const name = isCurrentUser ? "You" : getAuthorName(uid);
                                                                                            const avatar = getAuthorAvatar(uid);
                                                                                            const initials = getAuthorInitials(uid);

                                                                                            return (
                                                                                                <div
                                                                                                    key={uid}
                                                                                                    onClick={() => {
                                                                                                        if (isCurrentUser) {
                                                                                                            handleReaction(getReplyId(reply), emoji);
                                                                                                        }
                                                                                                    }}
                                                                                                    className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${isCurrentUser
                                                                                                        ? "cursor-pointer hover:bg-red-50 group/remove"
                                                                                                        : "hover:bg-gray-50"}`}
                                                                                                >
                                                                                                    <Avatar className="h-5 w-5 border border-gray-100">
                                                                                                        <AvatarImage src={avatar} />
                                                                                                        <AvatarFallback className={`${getAvatarColor(uid)} text-[8px] font-bold text-white`}>
                                                                                                            {initials}
                                                                                                        </AvatarFallback>
                                                                                                    </Avatar>
                                                                                                    <div className="flex flex-col leading-tight min-w-0">
                                                                                                        <span className="text-[11px] font-medium text-foreground truncate">
                                                                                                            {name}
                                                                                                        </span>
                                                                                                        {isCurrentUser && (
                                                                                                            <span className="text-[9px] text-muted-foreground font-medium opacity-80 group-hover/remove:opacity-100">
                                                                                                                Click to remove
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {getAuthorId(reply.authorId) === user?.id && (
                                                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        data-testid={`btn-edit-reply-${getReplyId(reply)}`}
                                                        className="bg-background rounded p-1 hover:bg-muted"
                                                        onClick={() => handleEdit(thread.id, getReplyId(reply), reply.text)}
                                                    >
                                                        <Pen size={14} className="text-gray-500" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        data-testid={`btn-delete-reply-${getReplyId(reply)}`}
                                                        className="bg-background rounded p-1 hover:bg-muted"
                                                        onClick={() => handleDeleteReply(thread.id, getReplyId(reply))}
                                                    >
                                                        <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        )}
                        <div ref={repliesEndRef} />
                    </div>

                    {/* Reply input row */}
                    <div className="bg-muted mt-1 p-2 rounded-lg flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 w-full">
                            {/* Reply input row */}
                            <Avatar className="w-7 h-7">
                                <AvatarImage src={profileImageUrl} alt="Profile" />
                                <AvatarFallback className={`${getAvatarColor(user?.id || '')} text-[10px] font-semibold text-white`}>
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            {/* Reply Input Container */}
                            <div className="relative flex-1 min-w-0">
                                <div
                                    ref={replyMirrorRef}
                                    className="pointer-events-none absolute invisible whitespace-pre-wrap break-words text-sm font-medium"
                                    style={{
                                        width: replyInputRef.current?.clientWidth,
                                        fontFamily: "inherit",
                                        lineHeight: "1.25rem",
                                        padding: "4px 12px", // Matches py-1 px-3 exactly
                                    }}
                                />
                                <Input
                                    ref={replyInputRef}
                                    value={threadReplyInputs[thread.id] || ""}
                                    onChange={onChange}
                                    onKeyDown={(e) => {
                                        onKeyDown(e);

                                        if (e.key === "Enter" && !e.shiftKey && !showMentionList) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                    placeholder="Reply..."
                                    className="h-9 border-0 bg-transparent text-sm font-medium text-foreground"
                                />
                            </div>

                            {/* Mention List - PUT RIGHT AFTER Input */}
                            {showMentionList && mentionPosition && createPortal(
                                <div
                                    data-mention-dropdown="true"
                                    className="fixed z-50 w-64 max-h-64 overflow-auto rounded-xl border border-border bg-popover shadow-2xl pointer-events-auto"
                                    style={{
                                        left: mentionPosition.left,
                                        top: mentionPosition.top,
                                        transform: mentionPosition.isAbove ? "translateY(-100%)" : undefined,
                                    }}
                                >
                                    {filteredMembers.map((m, idx) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm
                                                            ${idx === mentionIndex ? "bg-muted" : "hover:bg-muted"}`}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleMentionSelect(m);
                                            }}
                                        >
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={m.profilePictureUrl} />
                                                <AvatarFallback className={`${getAvatarColor(m.id)} text-white text-[10px]`}>
                                                    {getInitials(m.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>,
                                document.body
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                            {/* Attach file */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                data-testid={`btn-reply-attach-${thread.id}`}
                                className={`relative rounded-md transition-colors
                                                            ${attachmentCount > 0 ? 'bg-orange-500/20' : 'bg-muted'}`}
                                onClick={() => setActiveAttachThreadId(thread.id)}
                            >
                                <Paperclip
                                    size={16}
                                    className={attachmentCount > 0 ? 'text-orange-500' : 'text-muted-foreground'}
                                />
                                {attachmentCount > 0 && (
                                    <span className="absolute bottom-1 right-1 text-[10px] font-semibold text-[#FF8D28]">
                                        {attachmentCount}
                                    </span>
                                )}
                            </Button>
                            <AttachFileModal
                                open={activeAttachThreadId === thread.id}
                                onClose={() => setActiveAttachThreadId(null)}
                                onAttach={(files: File[]) => {
                                    setReplyAttachments(prev => ({
                                        ...prev,
                                        [thread.id]: [...(prev[thread.id] || []), ...files],
                                    }));
                                    setActiveAttachThreadId(null);
                                }}
                            />
                            <div className="relative">
                                <button
                                    ref={replySmileButtonRef}
                                    type="button"
                                    data-testid={`btn-reply-emoji-${thread.id}`}
                                    className="bg-muted rounded-md p-2 cursor-pointer"
                                    onClick={() => setEmojiAnchor(emojiAnchor === thread.id ? null : thread.id)}
                                >
                                    <Smile size={16} color="#8E8E93" />
                                </button>

                                {emojiAnchor === thread.id && replySmileButtonRef.current && createPortal(
                                    (() => {
                                        const rect = replySmileButtonRef.current!.getBoundingClientRect();
                                        const pickerWidth = 280;
                                        const pickerHeight = 350;
                                        const margin = 8;

                                        // Smart positioning
                                        const spaceAbove = rect.top;
                                        const spaceBelow = window.innerHeight - rect.bottom;
                                        const shouldShowAbove = spaceAbove > pickerHeight + margin;

                                        const top = shouldShowAbove
                                            ? rect.top - pickerHeight - margin
                                            : rect.bottom + margin;

                                        return (
                                            <div
                                                ref={emojiPickerRef}
                                                data-mention-dropdown="true"
                                                className="fixed z-[100000] bg-background rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-border animate-in fade-in zoom-in duration-200 pointer-events-auto"
                                                style={{
                                                    top: Math.max(margin, Math.min(top, window.innerHeight - pickerHeight - margin)),
                                                    left: Math.max(margin, Math.min(rect.right - pickerWidth, window.innerWidth - pickerWidth - margin)),
                                                    width: `${pickerWidth}px`,
                                                    "--epr-emoji-size": "20px",
                                                    "--epr-category-navigation-button-size": "24px",
                                                } as any}
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={(emojiData) => {
                                                        handleEmojiSelect(emojiData.emoji);
                                                        setEmojiAnchor(null);
                                                    }}
                                                    width={pickerWidth}
                                                    height={pickerHeight}
                                                    emojiStyle={EmojiStyle.NATIVE}
                                                    theme={Theme.LIGHT}
                                                    lazyLoadEmojis
                                                    previewConfig={{ showPreview: false }}
                                                    skinTonesDisabled
                                                />
                                            </div>
                                        );
                                    })(),
                                    document.body
                                )}
                            </div>
                            <button
                                type="button"
                                data-testid={`btn-reply-thumbsup-${thread.id}`}
                                className="bg-muted rounded-md p-2 cursor-pointer"
                                onClick={() => {
                                    const currentInput = threadReplyInputs[thread.id] || "";
                                    handleSendReply(currentInput + "👍");
                                }}
                            >
                                <ThumbsUp size={16} color="#8E8E93" />
                            </button>
                            <button
                                type="button"
                                data-testid={`btn-reply-thumbsdown-${thread.id}`}
                                className="bg-muted rounded-md p-2 cursor-pointer"
                                onClick={() => {
                                    const currentInput = threadReplyInputs[thread.id] || "";
                                    handleSendReply(currentInput + "👎");
                                }}
                            >
                                <ThumbsDown size={16} color="#8E8E93" />
                            </button>

                            <button
                                type="button"
                                data-testid={`btn-send-reply-${thread.id}`}
                                className="bg-background rounded-full p-2 cursor-pointer group 
                                hover:bg-primary transition-colors duration-200"
                                onClick={() => handleSendReply()}
                            >
                                <ArrowUp
                                    size={16}
                                    className="text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200"
                                />
                            </button>
                        </div>
                    </div>
                </CardContent>
            )}

            <ConfirmationModal
                open={!!deleteReplyId}
                onClose={() => setDeleteReplyId(null)}
                title="Delete Reply"
                description="Are you sure you want to delete this reply? This action is permanent and cannot be undone."
                confirmLabel="Delete"
                loading={isDeletingReply}
                loadingLabel="Deleting Reply..."
                onConfirm={handleConfirmDeleteReply}
                data-testid="modal-delete-reply"
            />

            <ConfirmationModal
                open={!!deleteAttachmentState}
                onClose={() => setDeleteAttachmentState(null)}
                title="Delete Attachment"
                description="Are you sure you want to delete this attachment? This action is permanent and cannot be undone."
                confirmLabel="Delete"
                loading={isDeletingAttachment}
                loadingLabel="Deleting Attachment..."
                onConfirm={handleConfirmDeleteAttachment}
                data-testid="modal-delete-attachment"
            />
        </Card>
    )
}