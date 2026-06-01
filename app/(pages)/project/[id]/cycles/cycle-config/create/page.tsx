import { use } from "react";
import { CreateCycleConfig } from "@/components/projects/cycles/CreateCycleConfig";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function Page({
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
                <CreateCycleConfig projectId={id} />
            </div>
        </div>
    );
}
