"use client";

import { useEffect, useRef } from "react";

import {
  DISCUSSIONS_POLL_INTERVAL_MS,
  useDiscussionStore,
} from "@/stores/discussions-store";
import type { DiscussionType } from "@/types/discussions.types";

const getDiscussionId = (d: { _id?: string; id?: string }) => d._id ?? d.id ?? "";

interface UseDiscussionPollingOptions {
  entityType: DiscussionType;
  entityId: string;
  /** Thread ids that are collapsed — messages are not polled for these */
  collapsedThreadIds: string[];
  enabled?: boolean;
  intervalMs?: number;
}

export function useDiscussionPolling({
  entityType,
  entityId,
  collapsedThreadIds,
  enabled = true,
  intervalMs = DISCUSSIONS_POLL_INTERVAL_MS,
}: UseDiscussionPollingOptions) {
  const pollDiscussions = useDiscussionStore((s) => s.pollDiscussions);
  const pollDiscussionMessages = useDiscussionStore((s) => s.pollDiscussionMessages);

  const collapsedRef = useRef(collapsedThreadIds);
  collapsedRef.current = collapsedThreadIds;

  useEffect(() => {
    if (!enabled || !entityId) return;

    const runPoll = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      void pollDiscussions(entityType, entityId);

      const { discussions, messagesLoadedIds } = useDiscussionStore.getState();
      const collapsed = new Set(collapsedRef.current);

      discussions.forEach((d) => {
        const discussionId = getDiscussionId(d);
        if (!discussionId || collapsed.has(discussionId)) return;
        if (!messagesLoadedIds[discussionId]) return;
        void pollDiscussionMessages(discussionId);
      });
    };

    const intervalId = window.setInterval(runPoll, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runPoll();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    enabled,
    entityId,
    entityType,
    intervalMs,
    pollDiscussions,
    pollDiscussionMessages,
  ]);
}
