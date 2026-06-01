// app/(pages)/project/page.tsx
"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { CreateProject } from "@/components/projects/CreateProject";

export default function ProjectsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col overflow-hidden h-full bg-background">
            <div className="w-full border-b border-border">
                <Breadcrumbs />
            </div>
            <div className="h-full overflow-auto bg-background">
                <CreateProject />
            </div>
        </div >
    );
}
