"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { generateBreadcrumbs } from "@/utils/breadcrumbs";

import { useWorkspaceStore } from "@/stores/workspace-store";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTeamStore } from "@/stores/teams-store";
import { useProjectsStore } from "@/stores/projects-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useRouter } from "next/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceName = currentWorkspace?.name || "Workspace";

  const teams = useTeamStore((state) => state.teams);
  const projects = useProjectsStore((state) => state.projects);
  const portfolios = usePortfoliosStore((state) => state.portfolios);

  const breadcrumbs = generateBreadcrumbs(pathname, workspaceName);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-2 text-xs text-muted-foreground pl-10 py-2">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        const labelLower = breadcrumb.label.toLowerCase();
        const isDropdown = ['teams', 'projects', 'portfolios', 'project', 'portfolio'].includes(labelLower);

        if (isDropdown && !isLast) {
          let items: { id: string; name: string }[] = [];
          let baseUrl = "";

          if (labelLower === 'teams') {
            items = teams.map(t => ({ id: t.id.toString(), name: t.name || 'Unnamed Team' }));
            baseUrl = "/teams";
          } else if (labelLower === 'project') {
            items = projects.map(p => ({ id: p.id!, name: p.name || 'Unnamed Project' }));
            baseUrl = "/project";
          } else if (labelLower === 'portfolio') {
            items = portfolios.map(p => ({ id: p.id, name: p.name || 'Unnamed Portfolio' }));
            baseUrl = "/portfolio";
          }

          return (
            <div key={`${breadcrumb.href}-${index}`} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors outline-none data-[state=open]:text-foreground">
                  {breadcrumb.label}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6" /></svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto border-0 border-b-[5px] border-[#001F3F] bg-white text-xs">
                  {items.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No items</div>
                  ) : (
                    items.map(item => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => router.push(`${baseUrl}/${item.id}`)}
                        className="cursor-pointer text-xs"
                      >
                        {item.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }

        return (
          <div key={`${breadcrumb.href}-${index}`} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {isLast ? (
              <span className="text-foreground font-medium">
                {breadcrumb.label}
              </span>
            ) : isFirst ? (
              <span className="font-medium">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="hover:text-foreground transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
