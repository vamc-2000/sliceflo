"use client";

import { Funnel } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useProjectsStore } from "@/stores/projects-store";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface FilterDropdownProps {
  onFilterChange?: (type: string, value: string) => void;
  onClearFilters?: () => void;
  attachments?: any[];
  activeFilters?: Record<string, any>;
}

export function FilterDropdown({
  onFilterChange,
  onClearFilters,
  attachments = [],
  activeFilters,
}: FilterDropdownProps) {
  const params = useParams();
  const projectId = params?.id as string;
  const { projects } = useProjectsStore();
  const currentProject = projects.find((p) => p.id === projectId);
  const projectMembers = currentProject?.members || [];

  const { workspaceMembers } = useWorkspaceStore();

  const mappedMembers = projectMembers.map((pm) => {
    const user = workspaceMembers.find(
      (wm) => wm.userId === pm.userId || (wm as any)._id === pm.userId,
    );
    return {
      id: pm.userId,
      name: user?.name || user?.email?.split("@")[0] || pm.userId,
      email: user?.email || "",
      avatar: user?.profilePicture || user?.avatar,
      role: pm.role,
    };
  });

  const [search, setSearch] = useState("");

  const tagColors: Record<string, string> = {
    "Tag option 1":
      "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    "Tag option 2":
      "bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    "Tag option 3":
      "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15",
  };

  const tags = ["Tag option 1", "Tag option 2", "Tag option 3"];

  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(search.toLowerCase()),
  );

  const getExtension = (mimeType: string): string => {
    if (!mimeType) return "";
    // Common mappings; extend as needed based on getFileImage logic
    if (mimeType.includes("pdf")) return ".pdf";
    if (mimeType.includes("document") || mimeType.includes("msword"))
      return ".docx";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return ".xlsx";
    if (mimeType.includes("png")) return ".png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return ".jpg";
    if (mimeType.includes("mp4")) return ".mp4";
    // Fallback: extract from filename if available, or use mimeType.split('/')[1]
    return `.${mimeType.split("/")[1] || "unknown"}`;
  };

  const uniqueExtensions = Array.from(
    new Set(
      attachments.map((att) => getExtension(att.mimeType)).filter(Boolean),
    ),
  ).sort(); // e.g., ['.docx', '.pdf', '.png']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-9 rounded-md text-xs">
          <Funnel className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 bg-popover border border-border border-b-[5px] border-b-primary text-popover-foreground"
      >
        {/* Attachment Type Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className={`rounded-none cursor-pointer transition-colors ${
              activeFilters?.attachmentType &&
              activeFilters.attachmentType.length > 0
                ? "border-l-2 border-primary pl-2 text-primary-text font-semibold"
                : ""
            }`}
          >
            Attachment Type
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-popover border border-border border-b-[5px] border-b-primary text-popover-foreground">
            {uniqueExtensions.map((ext) => (
              <DropdownMenuItem
                key={ext}
                onClick={() => onFilterChange?.("attachmentType", ext)}
                className={`rounded-none cursor-pointer transition-colors ${
                  (
                    Array.isArray(activeFilters?.attachmentType)
                      ? activeFilters.attachmentType.includes(ext)
                      : activeFilters?.attachmentType === ext
                  )
                    ? "border-l-2 border-primary pl-2 text-primary-text font-semibold"
                    : ""
                }`}
              >
                {ext}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* User Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className={`rounded-none cursor-pointer transition-colors ${
              activeFilters?.user
                ? "border-l-2 border-primary pl-2 text-primary-text font-semibold"
                : ""
            }`}
          >
            User
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-popover border border-border border-b-[5px] border-b-primary text-popover-foreground max-h-75 overflow-y-auto">
            {mappedMembers.map((member) => (
              <DropdownMenuItem
                key={member.id}
                onClick={() => onFilterChange?.("user", member.id)}
                className={`cursor-pointer rounded-none transition-colors ${
                  activeFilters?.user === member.id
                    ? "border-0 border-l-2 border-primary text-primary-text font-semibold"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                        activeFilters?.user === member.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary-text"
                      }`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate">{member.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Tags Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-56 p-2 space-y-2 bg-popover border border-border border-b-[5px] border-b-primary text-popover-foreground">
            {/* Search Input */}
            <div className="mb-2">
              <Input
                placeholder="Search tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
            </div>

            <Separator />

            {/* Tags List */}
            <div className="max-h-40 overflow-y-auto space-y-2 ">
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => onFilterChange?.("tag", tag)}
                    className={`w-full rounded-md px-3 py-2 text-xs font-medium 
                                            flex items-center justify-center text-center
                                            ${tagColors[tag] || "bg-muted text-muted-foreground border border-border hover:bg-muted/80"}
                                        `}
                  >
                    {tag}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="text-xs text-muted-foreground px-2 py-1">
                  No tags found
                </div>
              )}
            </div>
            <div className="bg-primary text-primary-foreground text-center rounded p-1.5 text-xs cursor-pointer hover:bg-primary/90">
              + Add new Tag
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onClearFilters}
          className="text-muted-foreground"
        >
          Clear all filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
