"use client";

import DocsDetailsPage from "@/components/docs/DocsDetailsPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function DocsCreatePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
    const router = useRouter();
      const { id } = use(params);

    return (
        <div className="flex flex-col overflow-hidden h-full">
            {/* <div className="w-full  border-b">
                <Breadcrumbs />
            </div> */}
            <div className="h-full overflow-auto">
                <DocsDetailsPage key={id} params={{ id }} />
            </div>
        </div >
    );
}