// app/task/[id]/page.tsx
// Dedicated route for shareable task links — e.g. http://localhost:3000/task/69a95370bef9cfa3b38347f8
// Works for both tasks and subtasks (detected via parentTaskId).

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTasksStore } from "@/stores/tasks-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Task } from "@/types/task.types";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TaskDetailPage } from "@/components/projects/TaskDetailPage";

type Status = "loading" | "ready" | "not-found" | "error";

export default function TaskSharePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();

    const { fetchTaskById } = useTasksStore();
    const { fetchProjectById } = useProjectsStore();
    const { fetchWorkspaceMembers, currentWorkspace } = useWorkspaceStore();

    const [task, setTask] = useState<Task | null>(null);
    const [status, setStatus] = useState<Status>("loading");

    useEffect(() => {
        const load = async () => {
            setStatus("loading");
            try {
                // 1. Fetch the task (works for both tasks and subtasks)
                const fetched = await fetchTaskById(id);
                if (!fetched) {
                    setStatus("not-found");
                    return;
                }
                setTask(fetched);

                // 2. Load project + workspace members so TaskDetailPage has full context
                const workspaceId = currentWorkspace?.id;
                await Promise.all([
                    fetchProjectById(fetched.projectId),
                    workspaceId ? fetchWorkspaceMembers(workspaceId) : Promise.resolve(),
                ]);

                setStatus("ready");
            } catch {
                setStatus("error");
            }
        };
        load();
    }, [id]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader message="Loading task..." size="md" />
            </div>
        );
    }

    if (status === "not-found" || status === "error") {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">
                        {status === "not-found" ? "Task not found" : "Something went wrong"}
                    </h2>
                    <p className="text-muted-foreground">
                        {status === "not-found"
                            ? "This task doesn't exist or you may not have access to it."
                            : "We couldn't load this task. Please try again."}
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
        <TaskDetailPage
            task={task!}
            isSubtask={!!task?.parentTaskId}
            projectId={task!.projectId}
            onOpenInProject={() => window.open(`/project/${task!.projectId}`, '_blank')}
        />
    );
}