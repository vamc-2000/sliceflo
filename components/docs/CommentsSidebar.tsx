
// components/docs/CommentsSidebar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, MoreVertical, Plus, Paperclip, AtSign, Smile, Image as ImageIcon, Video, Mic, Send, X, File, Download } from "lucide-react";
import { useDocStore } from "@/stores/useDoc-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface Attachment {
    id: number;
    name: string;
    size: number;
    type: string;
    url: string;
}

interface Reply {
    id: number;
    text: string;
    user: { name: string; avatar?: string };
    timestamp: string;
    mentions?: string[];
    attachments?: Attachment[];
}

interface Comment {
    id: number;
    text: string;
    user: { name: string; avatar?: string };
    timestamp: string;
    mentions?: string[];
    replies?: Reply[];
    attachments?: Attachment[];
}

export function CommentsSidebar() {
    const { isCommentsOpen, closeComments } = useDocStore();
    const [activeTab, setActiveTab] = useState("open");
    const [commentValue, setCommentValue] = useState("");
    const [replyValues, setReplyValues] = useState<{ [key: number]: string }>({});
    const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
    const [replyAttachments, setReplyAttachments] = useState<{ [key: number]: File[] }>({});
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [activeReplyEmoji, setActiveReplyEmoji] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [comments, setComments] = useState<Comment[]>([
        {
            id: 1,
            text: "Great job on completing the milestone ahead of schedule! This will give us some buffer time for testing.",
            user: { name: "Amit Das" },
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            mentions: ["@Sliceflo Design Team"],
            replies: [
                {
                    id: 11,
                    text: "Thank you so much for your kind words.",
                    user: { name: "Preston Roling" },
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    mentions: ["@Amit Das"]
                },
                {
                    id: 12,
                    text: "Sounds a lot.",
                    user: { name: "Carlos Mendoza" },
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    mentions: ["@Amit Das"]
                }
            ]
        },
        {
            id: 2,
            text: "I think we should deploy the new Design system.",
            user: { name: "Preston Roling" },
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            mentions: ["@Rahul"],
            replies: [
                {
                    id: 21,
                    text: "Okay Preston, will look into it.",
                    user: { name: "Rahul Mondal" },
                    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
                }
            ]
        }
    ]);

    // Auto-scroll to bottom when comments change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments]);

    // Handle file upload for main comment
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setCommentAttachments([...commentAttachments, ...newFiles]);
        }
    };

    // Handle file upload for replies
    const handleReplyFileChange = (commentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setReplyAttachments({
                ...replyAttachments,
                [commentId]: [...(replyAttachments[commentId] || []), ...newFiles]
            });
        }
    };

    // Remove attachment from main comment
    const removeCommentAttachment = (index: number) => {
        setCommentAttachments(commentAttachments.filter((_, i) => i !== index));
    };

    // Remove attachment from reply
    const removeReplyAttachment = (commentId: number, index: number) => {
        setReplyAttachments({
            ...replyAttachments,
            [commentId]: (replyAttachments[commentId] || []).filter((_, i) => i !== index)
        });
    };

    // Handle emoji selection for main comment
    const handleEmojiSelect = (emojiData: EmojiClickData) => {
        setCommentValue(commentValue + emojiData.emoji);
        setIsEmojiPickerOpen(false);
        textareaRef.current?.focus();
    };

    // Handle emoji selection for replies
    const handleReplyEmojiSelect = (commentId: number, emojiData: EmojiClickData) => {
        setReplyValues({
            ...replyValues,
            [commentId]: (replyValues[commentId] || "") + emojiData.emoji
        });
        setActiveReplyEmoji(null);
    };

    // Submit main comment
    const handleSubmitComment = () => {
        if (commentValue.trim() || commentAttachments.length > 0) {
            const attachments: Attachment[] = commentAttachments.map((file, index) => ({
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file)
            }));

            setComments([...comments, {
                id: Date.now(),
                text: commentValue,
                user: { name: "Current User" },
                timestamp: new Date().toISOString(),
                replies: [],
                attachments: attachments.length > 0 ? attachments : undefined
            }]);

            setCommentValue("");
            setCommentAttachments([]);

            // Auto-focus back to textarea
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    };

    // Submit reply
    const handleSubmitReply = (commentId: number) => {
        const replyText = replyValues[commentId];
        const files = replyAttachments[commentId] || [];

        if (replyText?.trim() || files.length > 0) {
            const attachments: Attachment[] = files.map((file, index) => ({
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file)
            }));

            setComments(comments.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        replies: [
                            ...(comment.replies || []),
                            {
                                id: Date.now(),
                                text: replyText || "",
                                user: { name: "Current User" },
                                timestamp: new Date().toISOString(),
                                mentions: [`@${comment.user.name}`],
                                attachments: attachments.length > 0 ? attachments : undefined
                            }
                        ]
                    };
                }
                return comment;
            }));

            setReplyValues({ ...replyValues, [commentId]: "" });
            setReplyAttachments({ ...replyAttachments, [commentId]: [] });
        }
    };

    const handleReplyChange = (commentId: number, value: string) => {
        setReplyValues({ ...replyValues, [commentId]: value });
    };

    const formatTimeAgo = (timestamp: string) => {
        const hours = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
        if (hours < 1) return "just now";
        if (hours === 1) return "1h ago";
        return `${hours}h ago`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getUserInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const avatarColors = [
        "bg-blue-500", "bg-purple-500", "bg-green-500",
        "bg-orange-500", "bg-pink-500", "bg-indigo-500"
    ];

    const getAvatarColor = (name: string) => {
        const index = name.charCodeAt(0) % avatarColors.length;
        return avatarColors[index];
    };


    return (
        <div className="h-full w-full bg-white border-l border-gray-200 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-1 border-b">
                <h2 className="text-base font-semibold">Chat</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeComments}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {[
                    { key: "open", label: "Open" },
                    { key: "assigned", label: "Assigned to me" },
                    { key: "resolved", label: "Resolved" },
                ].map((tab) => (
                    <Button
                        key={tab.key}
                        variant="ghost"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 rounded-none h-10 relative ${activeTab === tab.key
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                        )}
                    </Button>
                ))}
            </div>

            {/* Scrollable Message Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                {comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium mb-1">No comments yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            Start a conversation by adding a comment below
                        </p>
                    </div>
                ) : (
                    <div className="px-4 py-3 space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="space-y-2">

                                <div className="flex gap-2.5 group">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        {comment.user.avatar && <AvatarImage src={comment.user.avatar} />}
                                        <AvatarFallback className={`${getAvatarColor(comment.user.name)} text-white text-xs font-semibold`}>
                                            {getUserInitials(comment.user.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <span className="text-sm font-semibold">{comment.user.name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    Replied {formatTimeAgo(comment.timestamp)}. Visible to team only.
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Message Text */}
                                        {comment.text && (
                                            <div className="bg-muted rounded-lg px-3 py-2 text-sm leading-relaxed">
                                                {comment.mentions?.map((mention, idx) => (
                                                    <span key={idx} className="font-semibold text-blue-600 mr-1">
                                                        {mention}
                                                    </span>
                                                ))}
                                                <span className="text-foreground">{comment.text}</span>
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {comment.attachments && comment.attachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {comment.attachments.map((attachment) => (
                                                    <div key={attachment.id} className="flex items-center gap-2 bg-muted rounded-lg p-2 group/attachment">
                                                        <div className="flex-shrink-0">
                                                            {attachment.type.startsWith('image/') ? (
                                                                <img src={attachment.url} alt={attachment.name} className="w-12 h-12 object-cover rounded" />
                                                            ) : (
                                                                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                                                    <File className="w-6 h-6 text-blue-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate">{attachment.name}</p>
                                                            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            className="h-8 w-8 opacity-0 group-hover/attachment:opacity-100 transition-opacity"
                                                        >
                                                            <a href={attachment.url} download={attachment.name}>
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="mt-2 ml-4 space-y-2 border-l-2 border-border pl-3">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.id} className="flex gap-2">
                                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                                            {reply.user.avatar && <AvatarImage src={reply.user.avatar} />}
                                                            <AvatarFallback className={`${getAvatarColor(reply.user.name)} text-white text-xs font-semibold`}>
                                                                {getUserInitials(reply.user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="mb-0.5">
                                                                <span className="text-xs font-semibold">{reply.user.name}</span>
                                                                <span className="text-xs text-muted-foreground ml-2">
                                                                    {formatTimeAgo(reply.timestamp)}
                                                                </span>
                                                            </div>

                                                            {reply.text && (
                                                                <div className="bg-muted rounded-lg px-2.5 py-1.5 text-xs leading-relaxed">
                                                                    {reply.mentions?.map((mention, idx) => (
                                                                        <span key={idx} className="font-semibold text-blue-600 mr-1">
                                                                            {mention}
                                                                        </span>
                                                                    ))}
                                                                    <span className="text-foreground">{reply.text}</span>
                                                                </div>
                                                            )}

                                                            {/* Reply Attachments */}
                                                            {reply.attachments && reply.attachments.length > 0 && (
                                                                <div className="mt-1 space-y-1">
                                                                    {reply.attachments.map((attachment) => (
                                                                        <div key={attachment.id} className="flex items-center gap-2 bg-muted rounded p-1.5">
                                                                            <div className="flex-shrink-0">
                                                                                {attachment.type.startsWith('image/') ? (
                                                                                    <img src={attachment.url} alt={attachment.name} className="w-8 h-8 object-cover rounded" />
                                                                                ) : (
                                                                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                                                        <File className="w-4 h-4 text-blue-600" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-medium truncate">{attachment.name}</p>
                                                                                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reply Input with Attachments */}
                                        <div className="mt-2 space-y-2">
                                            {/* Show reply attachments preview */}
                                            {replyAttachments[comment.id] && replyAttachments[comment.id].length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {replyAttachments[comment.id].map((file, index) => (
                                                        <div key={index} className="relative group/preview">
                                                            {file.type.startsWith('image/') ? (
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={file.name}
                                                                    className="w-16 h-16 object-cover rounded border"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-16 bg-muted rounded border flex flex-col items-center justify-center">
                                                                    <File className="w-6 h-6 text-blue-600 mb-1" />
                                                                    <span className="text-xs text-muted-foreground truncate max-w-full px-1">{file.name.split('.').pop()}</span>
                                                                </div>
                                                            )}
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() => removeReplyAttachment(comment.id, index)}
                                                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Input Row */}
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 flex-shrink-0">
                                                    <AvatarFallback className="text-xs">U</AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 flex items-center gap-1 bg-muted rounded-lg px-2 py-1 border border-transparent focus-within:border-input">
                                                    <input
                                                        type="text"
                                                        placeholder="Add reply..."
                                                        value={replyValues[comment.id] || ""}
                                                        onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSubmitReply(comment.id);
                                                            }
                                                        }}
                                                        className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                                                    />

                                                    {/* Reply Action Buttons */}
                                                    <input
                                                        type="file"
                                                        ref={(el) => { replyFileInputRefs.current[comment.id] = el; }}
                                                        onChange={(e) => handleReplyFileChange(comment.id, e)}
                                                        className="hidden"
                                                        multiple
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => replyFileInputRefs.current[comment.id]?.click()}
                                                        className="h-6 w-6"
                                                        title="Attach file"
                                                    >
                                                        <Paperclip className="h-3 w-3" />
                                                    </Button>

                                                    <Popover open={activeReplyEmoji === comment.id} onOpenChange={(open) => setActiveReplyEmoji(open ? comment.id : null)}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                title="Add emoji"
                                                            >
                                                                <Smile className="h-3 w-3 text-blue-500" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 border-none shadow-lg" align="end">
                                                            <EmojiPicker
                                                                onEmojiClick={(emojiData) => handleReplyEmojiSelect(comment.id, emojiData)}
                                                                width={320}
                                                                height={400}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Sticky Footer */}
            <div className="p-3 border-t bg-background">
                <div className="border rounded-lg bg-background">

                    {/* Attachment Preview */}
                    {commentAttachments.length > 0 && (
                        <>
                            <div className="p-2">
                                <div className="flex flex-wrap gap-2">
                                    {commentAttachments.map((file, index) => (
                                        <div key={index} className="relative group/preview">
                                            {file.type.startsWith('image/') ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-20 h-20 object-cover rounded border"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 bg-muted rounded border flex flex-col items-center justify-center p-2">
                                                    <File className="w-8 h-8 text-blue-600 mb-1" />
                                                    <span className="text-xs text-muted-foreground truncate max-w-full">{file.name}</span>
                                                </div>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeCommentAttachment(index)}
                                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Textarea */}
                    <div className="p-2.5">
                        <textarea
                            ref={textareaRef}
                            value={commentValue}
                            onChange={(e) => setCommentValue(e.target.value)}
                            placeholder="Comment or type '/' for commands..."
                            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment();
                                }
                            }}
                        />
                    </div>

                    <Separator />

                    {/* Action Icons Row */}
                    <div className="flex items-center justify-between px-2 py-2">
                        <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Add">
                                <Plus className="h-4 w-4" />
                            </Button>

                            {/* File Upload */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8 w-8"
                                title="Attach"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mention">
                                <AtSign className="h-4 w-4" />
                            </Button>

                            {/* Emoji Picker */}
                            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Emoji">
                                        <Smile className="h-4 w-4 text-blue-500" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none shadow-lg" align="start">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiSelect}
                                        width={350}
                                        height={400}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Image">
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Video">
                                <Video className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Voice">
                                <Mic className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            onClick={handleSubmitComment}
                            disabled={!commentValue.trim() && commentAttachments.length === 0}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Send (Enter)"
                        >
                            <Send className="h-4 w-4 text-blue-500" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
