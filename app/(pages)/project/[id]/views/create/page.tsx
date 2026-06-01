import { use } from "react";
import { CreateView } from "@/components/projects/views/CreateView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CreateProjectViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            <div className="flex-none border-b">
                <Breadcrumbs />
            </div>
            <div className="flex-1 overflow-auto">
                <CreateView projectId={id} />
            </div>
        </div>
    )
}
