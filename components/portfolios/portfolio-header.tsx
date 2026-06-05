// components/portfolios/portfolio-header.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  MoreHorizontal, Calendar, Pencil, Link, Activity,
  Archive, Trash2, Check, X, Flag, Users, Loader2,
  MoreVertical, Upload, Layers
} from "lucide-react";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import ColorIconPicker, { IconData } from "@/components/ColorIconPicker";
import { uploadIcon, uploadFile, deleteUpload } from "@/lib/api/uploads-api";
import { toast } from "@/components/ui/sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import ArchiveProjectModal from "@/components/projects/ArchiveProjectModal";
import PortfolioViewersSection from "./PortfolioViewersSection";
import PortfolioInviteDialog from "./PortfolioInviteDialog";
import { PortfolioIconAvatar } from "./PortfolioIconAvatar";
import { PortfolioViewTabs } from "./portfolio-view-tabs";
import { cn } from "@/lib/utils";

interface Props {
  portfolioId: string;
  portfolioName: string;
  activeView: string;
  onViewChange: (v: string) => void;
  onCollapseAllGroups?: (() => void) | null;
  onExpandAllGroups?: (() => void) | null;
  onToggleHideEmptyGroups?: (() => void) | null;
  collapsedGroupsCount?: number;
  totalGroupsCount?: number;
  allGroupsCollapsed?: boolean;
  hideEmptyGroups?: boolean;
  onExportCSV?: (() => void) | null;
  onExportExcel?: (() => void) | null;
  onPrint?: (() => void) | null;
  onActivityLogClick?: () => void;
}

const PRIORITY_LEVELS = [
  { value: "urgent", label: "Urgent", color: "#EF4444" },
  { value: "high", label: "High", color: "#F97316" },
  { value: "medium", label: "Medium", color: "#EAB308" },
  { value: "low", label: "Low", color: "#22C55E" },
] as const;

export function PortfolioHeader({
  portfolioId,
  portfolioName,
  activeView,
  onViewChange,
  onCollapseAllGroups,
  onExpandAllGroups,
  onToggleHideEmptyGroups,
  collapsedGroupsCount = 0,
  totalGroupsCount = 0,
  allGroupsCollapsed = false,
  hideEmptyGroups = false,
  onExportCSV,
  onExportExcel,
  onPrint,
  onActivityLogClick,
}: Props) {
  const router = useRouter();

  const {
    portfolios,
    fetchPortfolios,
    renamePortfolio,
    updatePortfolioStatus,
    updatePortfolioPriority,
    updatePortfolioDates,
    updatePortfolioIcon,
    addViewersToPortfolio,
    removeViewersFromPortfolio,
    archivePortfolio,
    deletePortfolio,
    isLoading,
  } = usePortfoliosStore();

  const { currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();

  const portfolio = portfolios.find((p) => p.id === portfolioId);

  // ── Icon state ──
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIconData, setSelectedIconData] = useState<IconData | null>(null);
  const [isUpdatingIcon, setIsUpdatingIcon] = useState(false);

  // ── Viewers / Invite state ──
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // ── Rename state ──
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(portfolio?.name ?? "");

  // ── Archive / Delete state ──
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (portfolioId) fetchPortfolios();
    if (currentWorkspace?.id) fetchWorkspaceMembers(currentWorkspace.id);
  }, [portfolioId, currentWorkspace?.id]);

  if (!portfolio) return null;

  const viewers = (portfolio.viewers ?? []).map((v: any) => typeof v === 'string' ? v : v.userId);

  // ── Icon handlers ── (same pattern as project-header)
  const handleIconUpload = async (file: File): Promise<{ id: string; url?: string }> => {
    try {
      const result = await uploadFile(file);
      return result;
    } catch (error) {
      toast('error', { title: "Failed to upload icon" });
      throw error;
    }
  };

  const handleIconDelete = async (uploadId: string): Promise<void> => {
    try {
      await deleteUpload(uploadId);
      toast('success', { title: "Icon deleted" });
    } catch (error: any) {
      toast('error', { title: error?.message || "Failed to delete icon" });
      throw error;
    }
  };

  const handleIconSelect = async (iconData: IconData) => {
    if (isUpdatingIcon) return;
    setIsUpdatingIcon(true);
    try {
      let finalIconId: string | null = null;

      if (iconData.type === "icon") {
        const iconUploadResult = await uploadIcon({
          icon: {
            name: iconData.icon || "default",
            color: iconData.color,
          },
        });
        finalIconId = iconUploadResult.id;
      } else if (iconData.type === "file") {
        if (iconData.imageId) {
          finalIconId = iconData.imageId;
        } else {
          toast('error', { title: "Image upload incomplete. Please try uploading again." });
          return;
        }
      }

      if (finalIconId) {
        // Find the icon data from the upload result if possible
        const iconResult = iconData.type === "icon"
          ? { iconId: finalIconId, type: "icon", name: iconData.icon, color: iconData.color }
          : { iconId: finalIconId, type: "file", presignedUrl: iconData.image };

        await updatePortfolioIcon(portfolioId, finalIconId, iconResult);
        setSelectedIconData(iconData);
        setShowIconPicker(false);
        // Toast is handled by store
      } else {
        toast('error', { title: "Failed to get icon ID" });
      }
    } catch (error: any) {
      toast('error', { title: error?.message || "Failed to update portfolio icon" });
    } finally {
      setIsUpdatingIcon(false);
    }
  };

  // ── Invite handler ──
  const handleSendInvite = async (emails: string[]) => {
    // Implement email invitation logic here
    console.log("Send invites to:", emails);
    // You can integrate with your backend email service
  };

  // ── Viewers handlers ──
  const handleAddViewers = async (viewerIds: string[]) => {
    await addViewersToPortfolio(portfolioId, viewerIds);
  };
  const handleRemoveViewers = async (viewerIds: string[]) => {
    await removeViewersFromPortfolio(portfolioId, viewerIds);
  };

  // ── Rename handler ──
  const handleRename = async () => {
    if (!newName.trim() || newName === portfolio.name) {
      setIsRenaming(false);
      return;
    }
    try {
      await renamePortfolio(portfolioId, newName.trim());
      setIsRenaming(false);
    } catch {
      setNewName(portfolio.name);
    }
  };

  // ── Copy handlers ──
  const handleCopyPortfolioLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/portfolio/${portfolioId}`);
      toast('success', { title: "Portfolio link copied!" });
    } catch {
      toast('error', { title: "Failed to copy link" });
    }
  };
  const handleCopyPortfolioId = async () => {
    try {
      await navigator.clipboard.writeText(portfolioId);
      toast('success', { title: "Portfolio ID copied!" });
    } catch {
      toast('error', { title: "Failed to copy ID" });
    }
  };

  // ── Archive / Delete handlers ──
  const handleArchiveConfirm = async () => {
    setArchiving(true);
    await archivePortfolio(portfolioId);
    setArchiving(false);
    setShowArchiveModal(false);
    router.push("/portfolio");
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deletePortfolio(portfolioId);
      setDeleteDialogOpen(false);
      router.push("/portfolio");
    } catch {
      toast('error', { title: "Failed to delete portfolio." });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Status display config ──
  const statusConfig = {
    open: { label: "Open", color: "bg-green-100 text-green-700" },
    closed: { label: "Closed", color: "bg-red-100 text-red-700" },
    archived: { label: "Archived", color: "bg-gray-100 text-gray-700" },
  } as const;

  const currentStatus = (portfolio.status ?? "open") as keyof typeof statusConfig;

  return (
    <>
      <div className="border-b border-border">
        {/* ── Main Header Row ── */}
        <div className="flex items-center justify-between px-4 py-1">

          {/* ── Left Section ── */}
          <div className="flex items-center gap-2">

            {/* Icon picker button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowIconPicker(true)}
                disabled={isUpdatingIcon}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Change portfolio icon"
              >
                <PortfolioIconAvatar portfolio={portfolio} size="md" />
                {isUpdatingIcon && (
                  <Loader2 className="h-4 w-4 animate-spin absolute -right-2 -top-2" />
                )}
              </button>

              {/* Color Icon Picker */}
              <ColorIconPicker
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelect={handleIconSelect}
                currentIcon={
                  portfolio?.icon?.type === "file"
                    ? portfolio?.icon?.presignedUrl ?? null
                    : portfolio?.icon?.name ?? null
                }
                currentColor={portfolio?.icon?.color ?? "#6366f1"}
                currentType={portfolio?.icon?.type ?? "icon"}
                onUpload={handleIconUpload}
                onDelete={handleIconDelete}
              />

              {/* Rename / Name */}
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 w-64"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") { setNewName(portfolio.name); setIsRenaming(false); }
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRename}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => { setNewName(portfolio.name); setIsRenaming(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-foreground">{portfolio.name}</h1>
              )}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-border" />

            {/* Status + Viewers row — same structure as project-header */}
            <div className="flex items-center gap-2">

              {/* Priority flag (Read-only display) */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: (PRIORITY_LEVELS.find(p => p.value === portfolio.priority)?.color || "#6b7280") + "15"
                }}
                title={portfolio.priority ? `Priority: ${portfolio.priority}` : "No Priority"}
              >
                <Flag
                  className="h-4 w-4"
                  style={{
                    color: PRIORITY_LEVELS.find(p => p.value === portfolio.priority)?.color || "#6b7280"
                  }}
                />
              </div>

              {/* Date range (display, same style as project) */}
              <div
                className={cn(
                  "h-8 bg-muted-foreground/20 text-xs px-2 flex items-center gap-1",
                  portfolio.startDate && portfolio.endDate ? "rounded-md" : "rounded-full"
                )}
              >
                <Calendar className="h-4 w-4" />
                {portfolio.startDate && portfolio.endDate && (
                  <span className="mt-0.5">
                    {format(new Date(portfolio.startDate), "dd/MM/yyyy")} -{" "}
                    {format(new Date(portfolio.endDate), "dd/MM/yyyy")}
                  </span>
                )}
              </div>

              {/* Status badge (display only, same as project) */}
              <div
                className={cn(
                  "inline-flex items-center px-2 py-1 h-8 text-xs font-medium rounded-md capitalize",
                  statusConfig[currentStatus]?.color ?? "bg-gray-100 text-gray-500"
                )}
              >
                {statusConfig[currentStatus]?.label ?? "No status"}
              </div>

              {/* Viewers — identical to project-header */}
              <Popover open={isViewersOpen} onOpenChange={setIsViewersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                    <Users className="h-4 w-4" />
                    Viewers {viewers.length > 0 && `(${viewers.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-4 border border-b-[5px] border-b-primary"
                  align="start"
                >
                  <PortfolioViewersSection
                    portfolioId={portfolioId}
                    viewers={viewers}
                    onAddViewers={handleAddViewers}
                    onRemoveViewers={handleRemoveViewers}
                    onInviteClick={() => {
                      setIsViewersOpen(false);
                      setIsInviteDialogOpen(true);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ── More Options dropdown — mirrors project-header structure ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="border-b-4 border-b-primary p-1.5">

                <DropdownMenuItem className="px-2 py-1.5 justify-center text-xs font-medium bg-primary text-primary-foreground rounded-md">
                  Sharing & Permissions
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => { setNewName(portfolio.name); setIsRenaming(true); }} className="text-xs">
                  <Pencil className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    <Layers className="mr-2 h-4 w-4" /> Group actions
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary min-w-[200px] p-1.5">
                    <DropdownMenuItem
                      onClick={() =>
                        allGroupsCollapsed
                          ? onExpandAllGroups?.()
                          : onCollapseAllGroups?.()
                      }
                      disabled={totalGroupsCount === 0}
                      className="text-xs"
                    >
                      {allGroupsCollapsed ? "Expand all groups" : "Collapse all groups"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleHideEmptyGroups?.()}
                      disabled={totalGroupsCount === 0}
                      className="text-xs"
                    >
                      {hideEmptyGroups ? "Show empty groups" : "Hide empty groups"}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="mx-2 my-0" />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    <MoreVertical className="mr-2 h-4 w-4" /> More actions
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary p-1.5">
                    <DropdownMenuItem className="text-xs">Templates</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Automations</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Integrations</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    <Link className="mr-2 h-4 w-4" /> Copy Portfolio Info
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary p-1.5">
                    <DropdownMenuItem onClick={handleCopyPortfolioLink} className="text-xs">
                      Portfolio Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyPortfolioId} className="text-xs">
                      Portfolio ID
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {onActivityLogClick && (
                  <DropdownMenuItem onClick={onActivityLogClick} className="text-xs">
                    <Activity className="mr-2 h-4 w-4" /> Activity log
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="mx-2 my-0" />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    <Upload className="mr-2 h-4 w-4" /> Import / Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="border-b-4 border-b-primary min-w-[160px] p-1.5">
                    <DropdownMenuItem className="cursor-pointer text-xs">
                      Import
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer text-xs">
                        Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="border-b-4 border-b-primary min-w-[140px] p-1.5">
                        <DropdownMenuItem
                          onClick={() => { onPrint?.(); }}
                          className="flex items-center gap-2.5 cursor-pointer text-xs"
                        >
                          <Image src="/images/pdf.svg" alt="PDF" width={20} height={20} className="object-contain" />
                          PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { onExportCSV?.(); }}
                          className="flex items-center gap-2.5 cursor-pointer text-xs"
                        >
                          <Image src="/images/csv.svg" alt="CSV" width={20} height={20} className="object-contain" />
                          CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { onExportExcel?.(); }}
                          className="flex items-center gap-2.5 cursor-pointer text-xs"
                        >
                          <Image src="/images/excel.svg" alt="Excel" width={20} height={20} className="object-contain" />
                          Excel
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="mx-2 my-0" />

                <DropdownMenuItem onClick={() => setShowArchiveModal(true)} className="text-xs">
                  <Archive className="mr-2 h-4 w-4" /> Archive Portfolio
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 text-xs"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete portfolio
                    </>
                  )}
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Right: View Tabs (same position as project's ViewTabs) ── */}
          <div>
            <PortfolioViewTabs portfolioId={portfolioId} />
          </div>
        </div>
      </div>

      {/* ── Invite Dialog ── */}
      <PortfolioInviteDialog
        open={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        portfolioId={portfolioId}
        portfolioName={portfolio?.name || ''}
        onSendInvite={handleSendInvite}
      />

      {/* ── Archive Modal ── */}
      <ArchiveProjectModal
        open={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archive Portfolio"
        confirmLabel="Archive"
        description={`Are you sure you want to archive "${portfolio.name}"? It will be moved to the cleanup section and can be restored later.`}
        onConfirm={handleArchiveConfirm}
        loading={archiving}
      />

      {/* ── Delete Modal ── */}
      <ConfirmationModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Portfolio"
        confirmLabel="Delete"
        description={`Delete "${portfolioName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </>
  );
}