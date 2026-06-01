"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { DiscussionType, MessageAttachment, type Discussion } from "@/types/discussions.types";
import { useDiscussionStore } from "@/stores/discussions-store";
import { useDiscussionPolling } from "@/hooks/useDiscussionPolling";
import EmptyTeamDiscussion from "@/components/disucssions/EmptyTeamDiscussion";
import ThreadCard from "./ThreadCard";
import NewThreadInput from "./NewThreadInput";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface LocalReply {
    id: string;
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
}

interface MentionableMember {
    id: string;
    name: string;
    profilePictureUrl?: string;
}

interface DiscussionPageProps {
    entityType: DiscussionType;
    entityId: string;
    mentionableMembers: MentionableMember[];
}

export default function DiscussionPage({
    entityType,
    entityId,
    mentionableMembers,
}: DiscussionPageProps) {
    const {
        discussions,
        fetchDiscussions,
        createDiscussion,
        discussionMessages,
        getSortedDiscussions,
        listLoading,
    } = useDiscussionStore();

    const { user } = useAuthStore();
    const { user: profileUser } = useProfileStore();

    const threadRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const queryThreadId = searchParams?.get("threadId") ?? null;

    const handleClearThreadView = () => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("threadId");
            router.push(url.pathname + url.search);
        }
    };

    const [collapsedThreads, setCollapsedThreads] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(`discussion-collapse:${entityType}:${entityId}`);
            let list: string[] = raw ? JSON.parse(raw) : [];
            if (queryThreadId) {
                list = list.filter((id) => id !== queryThreadId);
            }
            return list;
        } catch {
            return [];
        }
    });

    const profileImageUrl = profileUser?.profilePictureUrl || "";
    const projectId = entityType === "project" ? entityId : undefined;

    useEffect(() => {
        if (!entityId) return;
        void fetchDiscussions(entityType, entityId);
    }, [entityType, entityId, fetchDiscussions]);

    useEffect(() => {
        if (queryThreadId) {
            setCollapsedThreads((prev) => {
                if (!prev.includes(queryThreadId)) return prev;
                const next = prev.filter((id) => id !== queryThreadId);
                localStorage.setItem(
                    `discussion-collapse:${entityType}:${entityId}`,
                    JSON.stringify(next)
                );
                return next;
            });
            setScrollTargetId(queryThreadId);
        }
    }, [queryThreadId, entityType, entityId]);

    const threads = React.useMemo<Thread[]>(() => {
        const pinnedThreadId =
            profileUser?.discussionSettings?.[entityType]?.[entityId]?.pinnedThreadId;

        const sorted = getSortedDiscussions(profileUser, entityType, entityId);

        const list = sorted.map((discussion: Discussion) => {
            const discussionId = discussion._id ?? discussion.id ?? "";
            const isPinned = pinnedThreadId === discussionId;

            const meta = discussion.metadata as
                | { authorName?: string; avatarUrl?: string }
                | undefined;

            return {
                id: discussionId,
                discussionId,
                user: meta?.authorName || "User",
                avatar:
                    meta?.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${meta?.authorName || "User"}`,
                createdAt: discussion.createdAt,
                text: discussion.description,
                replies: (discussion.messages || []) as unknown as LocalReply[],
                attachments: discussion.attachments || [],
                isPinned,
            };
        });

        if (queryThreadId) {
            return list.filter((t) => t.id === queryThreadId);
        }
        return list;
    }, [discussions, profileUser, entityType, entityId, getSortedDiscussions, queryThreadId]);

    const loadMessagesForExpandedThreads = useCallback(() => {
        discussions.forEach((d) => {
            const discussionId = d._id ?? d.id;
            if (!discussionId) return;
            if (collapsedThreads.includes(discussionId)) return;
            void discussionMessages(discussionId);
        });
    }, [discussions, collapsedThreads, discussionMessages]);

    useEffect(() => {
        loadMessagesForExpandedThreads();
    }, [loadMessagesForExpandedThreads]);

    useEffect(() => {
        if (!scrollTargetId) return;

        const scrollToTarget = () => {
            if (scrollTargetId === "__latest__") {
                if (!threads.length) return;
                const latest = [...threads].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];
                threadRefs.current[latest.id]?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
            } else {
                threadRefs.current[scrollTargetId]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
            setScrollTargetId(null);
        };

        requestAnimationFrame(scrollToTarget);
    }, [scrollTargetId, threads.length]);

    const handleNewThreadFromInput = async ({
        text,
        mentions,
        files,
    }: {
        text: string;
        mentions: { userId: string; username: string; position: number }[];
        files?: File[];
    }) => {
        if (!text.trim() && !files?.length) return;

        const newId = await createDiscussion(
            entityType,
            entityId,
            {
                title: text.slice(0, 50),
                description: text,
                mentions,
                metadata: {
                    authorName: user?.name || "User",
                    avatarUrl: profileImageUrl,
                },
            },
            { files }
        );

        if (newId) {
            setCollapsedThreads((prev) => prev.filter((id) => id !== newId));
            setScrollTargetId(newId.startsWith("pending-") ? "__latest__" : newId);
        }
    };

    const showInitialLoader = listLoading && discussions.length === 0;

    useDiscussionPolling({
        entityType,
        entityId,
        collapsedThreadIds: collapsedThreads,
        enabled: Boolean(entityId) && !showInitialLoader,
    });

    function TeamDiscussionLoader() {
        return (
            <div data-testid="discussion-loader" className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        data-testid={`discussion-loader-skeleton-${i}`}
                        className="h-20 w-full rounded-xl bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            data-testid="discussion-page-container"
            className={`flex flex-col ${entityType !== "task" ? "h-full" : ""}`}
        >
            <div
                data-testid="discussion-thread-list"
                className={entityType !== "task" ? "flex-1 overflow-y-auto pr-1" : ""}
            >
                {showInitialLoader ? (
                    <TeamDiscussionLoader />
                ) : queryThreadId && threads.length === 0 && !listLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This thread could not be found or may have been deleted.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearThreadView}
                            className="text-xs bg-primary text-primary-foreground"
                        >
                            View all discussions
                        </Button>
                    </div>
                ) : discussions.length === 0 && !listLoading ? (
                    entityType === "task" ? (
                        <div className="py-2">
                            <div className="w-full">
                                <NewThreadInput
                                    data-testid="new-thread-input-task-empty"
                                    onNewThread={handleNewThreadFromInput}
                                    mentionableMembers={mentionableMembers}
                                />
                            </div>
                        </div>
                    ) : (
                        <EmptyTeamDiscussion data-testid="empty-discussion-state" />
                    )
                ) : (
                    <>
                        {listLoading && discussions.length > 0 && (
                            <div className="px-4 py-1">
                                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                    <div className="h-full w-1/3 bg-primary/60 animate-pulse rounded-full" />
                                </div>
                            </div>
                        )}
                        {threads.map((thread) => (
                            <div
                                key={thread.id}
                                ref={(el) => {
                                    threadRefs.current[thread.id] = el;
                                }}
                                data-testid={`thread-card-wrapper-${thread.id}`}
                                className={
                                    thread.isPinned && collapsedThreads.includes(thread.id)
                                        ? "sticky top-0 z-20 bg-background"
                                        : ""
                                }
                            >
                                <ThreadCard
                                    thread={thread}
                                    collapsed={collapsedThreads.includes(thread.id)}
                                    onToggleCollapse={() => {
                                        if (!thread.discussionId) return;

                                        const isCurrentlyCollapsed =
                                            collapsedThreads.includes(thread.id);

                                        setCollapsedThreads((prev) => {
                                            const next = isCurrentlyCollapsed
                                                ? prev.filter((id) => id !== thread.id)
                                                : [...prev, thread.id];

                                            localStorage.setItem(
                                                `discussion-collapse:${entityType}:${entityId}`,
                                                JSON.stringify(next)
                                            );
                                            return next;
                                        });

                                        if (isCurrentlyCollapsed) {
                                            setScrollTargetId(thread.id);
                                            void discussionMessages(thread.discussionId);
                                        }
                                    }}
                                    entityType={entityType}
                                    entityId={entityId}
                                    projectId={projectId}
                                    mentionableMembers={mentionableMembers}
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
            {!(entityType === "task" && discussions.length === 0) && !queryThreadId && (
                <div
                    data-testid="discussion-input-bar"
                    className={`border-t border-border bg-background py-3 ${entityType !== "task" ? "px-4" : ""}`}
                >
                    <NewThreadInput
                        data-testid="new-thread-input-main"
                        onNewThread={handleNewThreadFromInput}
                        mentionableMembers={mentionableMembers}
                    />
                </div>
            )}
        </div>
    );
}
