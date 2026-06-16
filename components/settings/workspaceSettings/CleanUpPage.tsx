"use client";

import React, { useEffect, useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/projects/MemberAvatar";
import Image from "next/image";
import { Eye, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useSearchParams } from "next/navigation";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { getDeletedProjectsApi } from "@/lib/api/projects-api";
import { formatLocalDate } from "@/utils/timezone-utils";

const archiveItems = [
  {
    name: "Product Management I",
    created: "09/09/2024",
    updated: "09/09/2024",
    creator: "/assets/avatar.png",
  },
  {
    name: "Product Management III",
    created: "09/09/2024",
    updated: "09/09/2024",
    creator: "/assets/avatar.png",
  },
];

export default function CleanUp() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<
    "archive" | "deleted" | null
  >(null);

  const restoreProject = useProjectsStore((state) => state.restoreProject);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceMembers = useWorkspaceStore((state) => state.workspaceMembers);

  const [deletedProjects, setDeletedProjects] = useState<any[]>([]);
  const [isDeletedLoading, setIsDeletedLoading] = useState(false);

  const fetchDeletedProjects = async () => {
    if (!currentWorkspace?.id) return;
    setIsDeletedLoading(true);
    try {
      const response = await getDeletedProjectsApi(currentWorkspace.id);
      setDeletedProjects(response.projects || []);
    } catch (error) {
      console.error("Failed to fetch deleted projects:", error);
    } finally {
      setIsDeletedLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedProjects();
  }, [currentWorkspace?.id]);

  useEffect(() => {
    const shouldOpenArchive = searchParams.get("archive") === "true";
    if (shouldOpenArchive) {
      setActiveSection("archive");

      setTimeout(() => {
        const allCards = document.querySelectorAll(
          '.space-y-6 > [class*="rounded"]',
        );
        const archiveCard = Array.from(allCards).find((card) =>
          card.textContent?.includes("Archived Items"),
        ) as HTMLElement;

        if (archiveCard) {
          const headerHeight = 80;
          const cardTop = archiveCard.offsetTop - headerHeight;

          window.scrollTo({
            top: cardTop,
            behavior: "smooth",
          });
          archiveCard.style.outlineOffset = "2px";
          setTimeout(() => {
            archiveCard.style.outline = "";
            archiveCard.style.outlineOffset = "";
          }, 2500);
        }
      }, 500);
    }
  }, [searchParams]);

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div>
        <h2
          className="text-lg font-semibold text-[var(--primary)] tracking-tight"
          data-testid="cleanup-title"
        >
          Clean Up
        </h2>
        <p className="text-xs text-[#8E8E93]">
          Manage archived and deleted items
        </p>
      </div>

      {/* Archived Items */}
      <SettingsCard
        id="archive"
        title="Archived Items"
        subtitle={`${archiveItems.length} item${archiveItems.length !== 1 ? "s" : ""} archived`}
        icon={
          <Image
            src="/images/Archive.svg"
            alt="archive"
            width={50}
            height={50}
          />
        }
        isActive={activeSection === "archive"}
        onToggle={() =>
          setActiveSection((prev) => (prev === "archive" ? null : "archive"))
        }
        data-testid="cleanup-archive-card"
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse border border-border rounded-lg"
            data-testid="cleanup-archive-table"
          >
            <thead>
              <tr className="bg-[#F6FAFF]">
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Item
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Creator
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Last Updated
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Created
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {archiveItems.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-muted"
                  data-testid={`cleanup-archive-row-${index}`}
                >
                  <td className="border border-border px-3 py-2 text-xs text-[var(--primary)] text-center whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="border border-border px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <MemberAvatar
                        size="md"
                        src={item.creator}
                        name="Archived Item Creator"
                      />
                    </div>
                  </td>
                  <td className="border border-border px-3 py-2 text-xs text-[var(--primary)] text-center whitespace-nowrap">
                    {formatLocalDate(item.updated)}
                  </td>
                  <td className="border border-border px-3 py-2 text-xs text-[var(--primary)] text-center whitespace-nowrap">
                    {formatLocalDate(item.created)}
                  </td>
                  <td className="border border-border px-3 py-2">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="sm"
                        className="bg-[var(--primary)] hover:bg-[var(--primary)] text-white h-7 px-3 text-xs"
                        onClick={() =>
                          toast("info", {
                            title: "Info",
                            description: "View item functionality",
                          })
                        }
                        data-testid={`cleanup-archive-see-items-btn-${index}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        See Items
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[var(--primary)] hover:bg-[var(--primary)] text-white h-7 px-3 text-xs"
                        onClick={() =>
                          toast("success", {
                            title: "Success",
                            description: "Item unarchived",
                          })
                        }
                        data-testid={`cleanup-archive-unarchive-btn-${index}`}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Unarchive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>

      {/* Deleted Items */}
      <SettingsCard
        id="deleted"
        title="Deleted Items"
        subtitle={`${deletedProjects.length} item${deletedProjects.length !== 1 ? "s" : ""} deleted`}
        icon={
          <Image
            src="/images/Delete.svg"
            alt="deleted"
            width={50}
            height={50}
          />
        }
        isActive={activeSection === "deleted"}
        onToggle={() =>
          setActiveSection((prev) => (prev === "deleted" ? null : "deleted"))
        }
        data-testid="cleanup-deleted-card"
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse border border-border rounded-lg"
            data-testid="cleanup-deleted-table"
          >
            <thead>
              <tr className="bg-[#F6FAFF]">
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Item
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Creator
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Last Updated
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Created
                </th>
                <th className="border border-border px-3 py-2 text-xs font-semibold text-[var(--primary)] text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {deletedProjects.map((project, index) => {
                const creatorMember = workspaceMembers.find(
                  (m) =>
                    m.userId === project.ownerId ||
                    m.userId === project.deletedBy,
                );
                return (
                  <tr
                    key={project.id || index}
                    className="hover:bg-muted"
                    data-testid={`cleanup-deleted-row-${index}`}
                  >
                    <td className="border border-border px-3 py-2 text-xs text-[var(--primary)] text-center whitespace-nowrap">
                      {project.name}
                    </td>
                    <td className="border border-border px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <MemberAvatar
                          size="md"
                          name={creatorMember?.name}
                          src={
                            creatorMember?.avatar ||
                            creatorMember?.profilePicture
                          }
                        />
                      </div>
                    </td>
                    <td className="border border-border px-3 py-2 text-xs text-[var(--primary)] text-center whitespace-nowrap">
                      {formatLocalDate(project.updatedAt)}
                    </td>
                    <td className="border border-border px-3 py-2 text-xs text-[var(--primary)] text-center whitespace-nowrap">
                      {formatLocalDate(project.deletedAt || project.createdAt)}
                    </td>
                    <td className="border border-border px-3 py-2">
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs"
                          onClick={async () => {
                            try {
                              await restoreProject(project.id);
                              toast("success", {
                                title: "Success",
                                description: "Project restored successfully",
                              });
                              fetchDeletedProjects();
                            } catch (err) {
                              console.error("Failed to restore project:", err);
                            }
                          }}
                          data-testid={`cleanup-deleted-restore-btn-${index}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {deletedProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-4 text-xs text-muted-foreground border border-border"
                  >
                    No deleted items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </div>
  );
}
