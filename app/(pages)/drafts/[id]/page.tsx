// app/drafts/[id]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDraftsStore } from "@/stores/drafts-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DraftDetailPage } from "@/components/drafts/DraftDetailPage";
import { DraftResponse } from "@/lib/api/drafts-api";

type Status = "loading" | "ready" | "not-found" | "error";

export default function DraftSharePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();

    const { getDraftById } = useDraftsStore();
    const { fetchProjectById } = useProjectsStore();
    const { fetchWorkspaces, fetchWorkspaceMembers, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

    const [draft, setDraft] = useState<DraftResponse | null>(null);
    const [status, setStatus] = useState<Status>("loading");

    useEffect(() => {
        const load = async () => {
            setStatus("loading");
            try {
                // Always fetch/refresh workspaces first
                await fetchWorkspaces();
                const allWorkspaces = useWorkspaceStore.getState().workspaces;
                if (allWorkspaces.length === 0) {
                    setStatus("error");
                    return;
                }

                let fetchedDraft: DraftResponse | null = null;
                let activeWorkspace = useWorkspaceStore.getState().currentWorkspace || allWorkspaces[0];

                // 1. Try with the currently active workspace
                if (activeWorkspace?.id) {
                    fetchedDraft = await getDraftById(id, activeWorkspace.id);
                }

                // 2. If not found, try all other workspaces of the user
                if (!fetchedDraft) {
                    for (const ws of allWorkspaces) {
                        if (!ws.id) continue;
                        if (ws.id === activeWorkspace?.id) continue;
                        const result = await getDraftById(id, ws.id);
                        if (result) {
                            fetchedDraft = result;
                            activeWorkspace = ws;
                            setCurrentWorkspace(ws);
                            break;
                        }
                    }
                }

                if (!fetchedDraft) {
                    setStatus("not-found");
                    return;
                }

                setDraft(fetchedDraft);

                // 3. Load project + workspace members for the correct workspace
                if (fetchedDraft.projectId) {
                    await fetchProjectById(fetchedDraft.projectId);
                }
                await fetchWorkspaceMembers(activeWorkspace.id || "");

                setStatus("ready");
            } catch (error) {
                console.error("Failed to load draft detail", error);
                setStatus("error");
            }
        };
        load();
    }, [id, currentWorkspace?.id, fetchWorkspaces, setCurrentWorkspace]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader message="Loading draft..." size="md" />
            </div>
        );
    }

    if (status === "not-found" || status === "error") {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">
                        {status === "not-found" ? "Draft not found" : "Something went wrong"}
                    </h2>
                    <p className="text-muted-foreground">
                        {status === "not-found"
                            ? "This draft doesn't exist or you may not have access to it."
                            : "We couldn't load this draft. Please try again."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go back
                    </Button>
                    {status === "error" && (
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <DraftDetailPage
            draft={draft!}
            isSubDraft={!!draft?.parentTaskId}
            projectId={draft!.projectId || ""}
        />
    );
}
