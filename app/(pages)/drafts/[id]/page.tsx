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
    const { fetchWorkspaceMembers, currentWorkspace } = useWorkspaceStore();

    const [draft, setDraft] = useState<DraftResponse | null>(null);
    const [status, setStatus] = useState<Status>("loading");

    useEffect(() => {
        const load = async () => {
            setStatus("loading");
            try {
                const workspaceId = currentWorkspace?.id;
                if (!workspaceId) {
                    setStatus("error");
                    return;
                }

                // 1. Fetch the draft
                const fetched = await getDraftById(id, workspaceId);
                if (!fetched) {
                    setStatus("not-found");
                    return;
                }
                setDraft(fetched);

                // 2. Load project + workspace members
                if (fetched.projectId) {
                    await fetchProjectById(fetched.projectId);
                }
                await fetchWorkspaceMembers(workspaceId);

                setStatus("ready");
            } catch (error) {
                console.error("Failed to load draft detail", error);
                setStatus("error");
            }
        };
        load();
    }, [id, currentWorkspace?.id]);

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
