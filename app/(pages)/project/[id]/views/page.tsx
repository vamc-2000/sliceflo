"use client";

import { use } from "react";
import { useProjectsStore } from "@/stores/projects-store";
import { ViewsHeader } from "@/components/projects/views/ViewsHeader";
import { ViewCard } from "@/components/projects/views/ViewCard";
import { LandingPage } from "@/components/LandingPage";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export default function ProjectViewsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { projects, fetchProjectById, getTailoredViewsByProject, deleteTailoredView } = useProjectsStore();
    const { currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewToDeleteId, setViewToDeleteId] = useState<string | null>(null);

    const project = projects.find((p) => p.id === id);
    const tailoredViews = getTailoredViewsByProject(id);

    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [currentWorkspace?.id, fetchWorkspaceMembers]);

    if (!project) {
        // Simple fetch if not in store
        fetchProjectById(id);
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader message="Loading project..." size="md" />
            </div>
        );
    }

    const handleCreateView = () => {
        router.push(`/project/${id}/views/create`);
    };

    const handleDeleteClick = (viewId: string) => {
        setViewToDeleteId(viewId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (viewToDeleteId) {
            deleteTailoredView(viewToDeleteId);
            toast('success', { title: "View deleted successfully" });
            setIsDeleteDialogOpen(false);
            setViewToDeleteId(null);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            <div className="flex-none">
                <div className="w-full border-b">
                    <Breadcrumbs />
                </div>
                <ViewsHeader
                    project={project}
                    filterCount={tailoredViews.length}
                    onAddView={handleCreateView}
                    onFilterClick={() => console.log("Filter clicked")}
                />
            </div>

            <div className="flex-1 overflow-auto bg-white p-6">
                {tailoredViews.length === 0 ? (
                    <LandingPage
                        title="Build tailored views for your Projects"
                        description="Views are saved filters that help you quickly access the information you use most. Collaborate effortlessly as teammates share and tailor views to their specific needs."
                        extraText=""
                        imageSrc="/images/projects/views-landing.svg"
                        imageAlt="Build tailored views illustration"
                        buttonText="Create View"
                        onButtonClick={handleCreateView}
                        imageHeight={300}
                    />
                ) : (
                    <div className="flex flex-col gap-4">
                        {[...tailoredViews].reverse().map((view) => (
                            <ViewCard
                                key={view.id}
                                view={view}
                                projectName={project.name}
                                onDelete={() => handleDeleteClick(view.id)}
                                onSelect={() => router.push(`/project/${id}/views/${view.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this tailored view. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
