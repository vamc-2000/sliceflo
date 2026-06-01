// app/(pages)/portfolio/page.tsx
"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CreatePortfolio } from "@/components/portfolios/CreatePortfolio";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PortfoliosPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { fetchPortfolios } = usePortfoliosStore();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchPortfolios(currentWorkspace.id);
    }
  }, [fetchPortfolios, currentWorkspace?.id]);

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div className="w-full border-b">
        <Breadcrumbs />
      </div>
      <div className="h-full overflow-auto">
        <CreatePortfolio />
      </div>
    </div>
  );
}