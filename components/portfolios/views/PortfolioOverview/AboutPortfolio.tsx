
// components/portfolios/views/PortfolioOverview/AboutPortfolio.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";
import AttachFileModal from "@/components/disucssions/AttachFileModal";
import {
  Flag, User, CalendarIcon, Upload, Paperclip,
  Plus, Circle, FileText, SquareArrowOutUpRight, X,
  Hexagon
} from "lucide-react";
import { format } from "date-fns";
import { formatLocalDate, convertSelectedDateToUTC, convertUTCToCalendarDate } from "@/utils/timezone-utils";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { uploadFile } from "@/lib/api/uploads-api";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/stores/profile-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronDown } from "lucide-react";
import { useDocStore } from "@/stores/useDoc-store";
import { updateDocument as updateDocumentApi } from "@/lib/api/documents-api";
import Link from "next/link";
import { PortfolioAttachments } from "./PortfolioAttachments";
import { FileAttachment } from "@/types/attachment.types";
import { getUpload } from "@/lib/api/uploads-api";
import { PortfolioCalendarPicker } from "./PortfolioCalendarPicker";

interface Props {
  portfolioId?: string;
  workspaceId?: string;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open", cls: "bg-green-100 text-green-700" },
  { value: "closed", label: "Closed", cls: "bg-red-100 text-red-700" },
  { value: "archived", label: "Archived", cls: "bg-gray-100 text-gray-600" },
] as const;

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  archived: "bg-gray-100 text-gray-700",
};

const PRIORITY_LEVELS = [
  { value: "high", label: "High", color: "#F59E0B" },
  { value: "medium", label: "Medium", color: "#3B82F6" },
  { value: "low", label: "Low", color: "#9CA3AF" },
] as const;

function getAvatarColor(name: string): string {
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getTextLength(html: string) {
  if (typeof document === "undefined") return 0;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent?.trim().length ?? 0;
}

export default function AboutPortfolio({ portfolioId, workspaceId }: Props) {
  const {
    portfolios,
    updatePortfolioPriority,
    updatePortfolioDates,
    updatePortfolioStatus,
    attachUploadsToPortfolio,
    removeUploadsFromPortfolio,
    updatePortfolioLeaders,
    updatePortfolioDescription,
  } = usePortfoliosStore();

  const { user: profile } = useProfileStore();

  const { workspaceMembers, currentWorkspace } = useWorkspaceStore();
  const { documents, addPortfolioToDocument, removePortfolioFromDocument } = useDocStore();
  const resolvedWsId = workspaceId ?? currentWorkspace?.id;
  const portfolio = portfolios.find((p) => p.id === portfolioId);

  // ── Local state ──
  const [content, setContent] = useState(portfolio?.description ?? "");
  const [charCount, setCharCount] = useState(0);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [portfolioAttachments, setPortfolioAttachments] = useState<FileAttachment[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [leaderSearchQuery, setLeaderSearchQuery] = useState("");

  // Collapsible sections state
  const [isPortfolioDetailsExpanded, setIsPortfolioDetailsExpanded] = useState(true);
  const [isLinkedItemsExpanded, setIsLinkedItemsExpanded] = useState(false);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);
  const [isAboutPortfolioExpanded, setIsAboutPortfolioExpanded] = useState(false);
  const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);

  const visibleAttachments = showAll
    ? portfolioAttachments
    : portfolioAttachments.slice(0, 2);

  const mentionableMembers = React.useMemo(() => workspaceMembers.map(m => ({
    id: m.userId,
    name: m.name,
    avatar: m.avatar || m.profilePicture || ''
  })), [workspaceMembers]);

  const filteredLeaders = React.useMemo(() => {
    return workspaceMembers.filter((m) => {
      if (!leaderSearchQuery) return true;
      const q = leaderSearchQuery.startsWith("@") ? leaderSearchQuery.slice(1) : leaderSearchQuery;
      return m.name.toLowerCase().includes(q.toLowerCase());
    });
  }, [workspaceMembers, leaderSearchQuery]);

  // Sync attachments from the store to component state
  useEffect(() => {
    const attachments = portfolio?.attachments || [];
    if (!attachments.length) {
      setPortfolioAttachments([]);
      return;
    }

    const resolved = attachments.map((att: any, index: number) => {
      const isString = typeof att === 'string';
      const attId = isString ? att : (att.id || att._id);
      const fileName = isString ? attId : (att.fileName || att.name || att.id || 'Unknown');
      const uploaderId = !isString
        ? (typeof att.uploadedBy === 'string' ? att.uploadedBy : (att.uploadedBy?.id || att.uploadedBy?._id || att.uploadedBy))
        : '';
      const uploader = workspaceMembers.find(m => m.userId === uploaderId);

      return {
        id: attId || `unknown-${index}`,
        name: fileName,
        size: !isString && att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : '0 KB',
        type: !isString ? (att.mimeType || 'unknown') : 'unknown',
        uploadedOn: !isString && att.createdAt ? format(new Date(att.createdAt), 'MMM d, yyyy') : '',
        uploadedBy: {
          name: uploader?.name || 'Unknown',
          id: uploaderId
        }
      };
    });

    setPortfolioAttachments(resolved as FileAttachment[]);
  }, [portfolio?.attachments, workspaceMembers]);

  const linkedDocs = React.useMemo(() => {
    if (!portfolioId) return [];
    return Array.from(documents.values()).filter(
      (doc) =>
        doc.linkedPortfolios?.includes(portfolioId) &&
        !doc.parentId
    );
  }, [documents, portfolioId]);

  const availableDocs = React.useMemo(() => {
    if (!portfolioId) return [];
    return Array.from(documents.values()).filter(
      (doc) =>
        !doc.linkedPortfolios?.includes(portfolioId) &&
        !doc.parentId
    );
  }, [documents, portfolioId]);

  useEffect(() => {
    if (portfolio?.description) {
      setContent(portfolio.description);
      setCharCount(getTextLength(portfolio.description));
    }
  }, [portfolio?.description]);

  const handleContentChange = useCallback(
    (val: string) => {
      setContent(val);
      setCharCount(getTextLength(val));
      if (portfolioId) {
        updatePortfolioDescription(portfolioId, val);
      }
    },
    [portfolioId, updatePortfolioDescription]
  );

  const handleAttachFiles = async (files: File[]) => {
    if (!portfolioId) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(files.map(uploadFile));
      await attachUploadsToPortfolio(portfolioId, results.map((r) => r.id));
      setIsAttachOpen(false);
    } catch (err: any) {
      toast('error', { title: err?.message ?? "Failed to upload files" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDocument = async (docId: string) => {
    if (portfolioId) {
      addPortfolioToDocument(docId, portfolioId);
      try {
        const doc = documents.get(docId);
        if (doc) {
          const currentPortfolios = doc.linkedPortfolios || [];
          if (!currentPortfolios.includes(portfolioId)) {
            await updateDocumentApi(docId, { linkedPortfolios: [...currentPortfolios, portfolioId] });
          }
        }
      } catch (err: any) {
        toast('error', { title: err?.message ?? "Failed to link document" });
      }
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    if (portfolioId) {
      removePortfolioFromDocument(docId, portfolioId);
      try {
        const doc = documents.get(docId);
        if (doc) {
          const currentPortfolios = doc.linkedPortfolios || [];
          await updateDocumentApi(docId, { linkedPortfolios: currentPortfolios.filter(id => id !== portfolioId) });
        }
      } catch (err: any) {
        toast('error', { title: err?.message ?? "Failed to unlink document" });
      }
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const uploadData = await getUpload(id);
      if (uploadData.presignedUrl) {
        const response = await fetch(uploadData.presignedUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = (uploadData as any).fileName || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      toast("error", { title: "Failed to download file" });
    }
  };

  const handleView = async (id: string) => {
    try {
      const uploadData = await getUpload(id);
      if (uploadData.presignedUrl) {
        window.open(uploadData.presignedUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to view file:', error);
      toast("error", { title: "Failed to view file" });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!portfolioId) return;
    try {
      await removeUploadsFromPortfolio(portfolioId, [attachmentId]);
    } catch (error) {
      toast("error", { title: "Failed to delete attachment" });
      throw error;
    }
  };
  const handleUpdateStatus = (status: string) => {
    if (portfolioId) {
      updatePortfolioStatus(portfolioId, status as any);
    }
  };

  const handleUpdatePriority = (priority: string) => {
    if (portfolioId) {
      updatePortfolioPriority(portfolioId, priority);
    }
  };

  const handleUpdateStartDate = (date: Date | undefined) => {
    if (portfolioId && date) {
      const utcDateStr = convertSelectedDateToUTC(date);
      updatePortfolioDates(portfolioId, utcDateStr, portfolio?.endDate);
      setIsStartDatePopoverOpen(false);
      if (portfolio?.endDate && date && new Date(portfolio.endDate) < date) {
        updatePortfolioDates(portfolioId, utcDateStr, undefined);
      }
    }
  };

  const handleUpdateEndDate = (date: Date | undefined) => {
    if (portfolioId && date) {
      updatePortfolioDates(portfolioId, portfolio?.startDate, convertSelectedDateToUTC(date));
      setIsEndDatePopoverOpen(false);
    }
  };

  const handleUpdateLeader = (userId: string) => {
    if (!portfolioId || !portfolio) return;

    const currentLeaders = portfolio.leaders || [];
    const isLeader = currentLeaders.includes(userId);

    if (isLeader) {
      // Prevent self-leader removal
      if (userId === profile?.id) {
        toast('error', { title: "You cannot remove yourself as a leader" });
        return;
      }
      const newLeaders = currentLeaders.filter((id) => id !== userId);
      updatePortfolioLeaders(portfolioId, newLeaders);
    } else {
      const newLeaders = [...currentLeaders, userId];
      updatePortfolioLeaders(portfolioId, newLeaders);
    }
  };

  if (!portfolio) return null;

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === portfolio.status) ?? STATUS_OPTIONS[0];
  const currentPriority = PRIORITY_LEVELS.find((p) => p.value === portfolio.priority);

  return (
    <div className="space-y-4">
      {/* Portfolio Details */}
      <div className="space-y-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsPortfolioDetailsExpanded(!isPortfolioDetailsExpanded)}
        >
          <h3 className="text-sm font-semibold">Portfolio Details</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 pointer-events-none"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isPortfolioDetailsExpanded ? "rotate-180" : "rotate-0")} />
          </Button>
        </div>

        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden space-y-2",
          isPortfolioDetailsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
        )}>
          {/* ✅ Status - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <Hexagon
                className="h-4 w-4"
              />
              Status
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 transition-opacity hover:opacity-90 text-xs font-semibold rounded-xs w-[150px] flex items-center justify-center cursor-pointer",
                    statusColors[portfolio.status as string] || statusColors.open
                  )}
                >
                  {currentStatus.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary">
                {STATUS_OPTIONS.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => handleUpdateStatus(s.value)}
                    className={cn(
                      "h-9 text-xs font-semibold rounded-xs justify-center cursor-pointer px-3 w-full flex items-center focus:opacity-80",
                      statusColors[s.value as string] || statusColors.open
                    )}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ✅ Priority - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <Flag className="h-4 w-4" />
              Priority
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 transition-opacity hover:opacity-90 overflow-hidden px-2 rounded-xs flex items-center justify-between gap-2 text-xs font-medium w-[150px] cursor-pointer",
                    !portfolio.priority && "text-muted-foreground bg-secondary"
                  )}
                  style={portfolio.priority ? {
                    backgroundColor: `${currentPriority?.color || '#9CA3AF'}33`,
                  } : {}}
                >
                  {portfolio.priority ? (
                    <>
                      <span className="text-foreground">
                        {portfolio.priority.charAt(0).toUpperCase() + portfolio.priority.slice(1)}
                      </span>
                      <Flag
                        className="h-3.5 w-3.5 flex-shrink-0"
                        style={{ color: currentPriority?.color || "#6b7280" }}
                      />
                    </>
                  ) : (
                    "—"
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary">
                {PRIORITY_LEVELS.map((level) => (
                  <DropdownMenuItem
                    key={level.value}
                    onSelect={() => handleUpdatePriority(level.value)}
                    className="h-9 text-xs font-medium rounded-xs cursor-pointer px-2 flex items-center justify-between gap-2 w-full focus:opacity-80"
                    style={{
                      backgroundColor: `${level.color}33`,
                    }}
                  >
                    <span className="text-foreground">{level.label}</span>
                    <Flag
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: level.color }}
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ✅ Start Date - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarIcon className="h-4 w-4" />
              Start Date
            </Label>
            <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 px-3 font-normal hover:bg-muted text-xs w-[150px] flex items-center justify-center rounded-xs cursor-pointer",
                    !portfolio.startDate && "text-muted-foreground"
                  )}
                >
                  {portfolio.startDate ? formatLocalDate(portfolio.startDate) : "—"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 border-0 border-b-[5px] border-primary" align="end">
                <PortfolioCalendarPicker
                  selectedDate={portfolio.startDate ? convertUTCToCalendarDate(portfolio.startDate) : undefined}
                  onDateSelect={handleUpdateStartDate}
                  disabled={(date) => {
                    const endDateCal = portfolio.endDate ? convertUTCToCalendarDate(portfolio.endDate) : undefined;
                    return endDateCal ? date > endDateCal : false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ✅ End Date - Left-Right Alignment */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarIcon className="h-4 w-4" />
              End Date
            </Label>
            <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 px-3 font-normal hover:bg-muted text-xs w-[150px] flex items-center justify-center rounded-xs cursor-pointer",
                    !portfolio.endDate && "text-muted-foreground"
                  )}
                >
                  {portfolio.endDate ? formatLocalDate(portfolio.endDate) : "—"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 border-0 border-b-[5px] border-primary" align="end">
                <PortfolioCalendarPicker
                  selectedDate={portfolio.endDate ? convertUTCToCalendarDate(portfolio.endDate) : undefined}
                  onDateSelect={handleUpdateEndDate}
                  disabled={(date) => {
                    const startDateCal = portfolio.startDate ? convertUTCToCalendarDate(portfolio.startDate) : undefined;
                    return startDateCal ? date < startDateCal : false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ✅ Leaders - Multi-Avatar Display */}
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs">
              <User className="h-4 w-4" />
              Leaders
            </Label>
            <DropdownMenu onOpenChange={(open) => {
              if (!open) setLeaderSearchQuery("");
            }}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 px-2 hover:bg-muted flex items-center justify-center gap-1 text-xs w-[150px] rounded-xs cursor-pointer",
                    (!portfolio.leaders || portfolio.leaders.length === 0) && "text-muted-foreground"
                  )}
                >
                  {(() => {
                    const leaderIds = portfolio.leaders || [];
                    if (leaderIds.length === 0) return "—";

                    return (
                      <div className="flex -space-x-2 overflow-hidden">
                        {leaderIds.map((id, i) => {
                          const m = workspaceMembers.find((member) => member.userId === id);
                          return (
                            <Avatar
                              key={id}
                              className="h-6 w-6 border-0"
                              style={{ zIndex: 10 - i }}
                              title={m?.name}
                            >
                              {m?.profilePicture && <AvatarImage src={m.profilePicture} />}
                              <AvatarFallback
                                className="text-white text-xs font-semibold"
                                style={{ backgroundColor: getAvatarColor(m?.name || "U") }}
                              >
                                {m?.name?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    );
                  })()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary">
                <div className="px-1 pb-2" onKeyDown={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="Type @ or name..."
                    value={leaderSearchQuery}
                    onChange={(e) => setLeaderSearchQuery(e.target.value)}
                    className="h-8 text-xs placeholder:text-muted-foreground bg-background border border-border"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredLeaders.length === 0 ? (
                    <div className="text-center py-2 text-xs text-muted-foreground">
                      No members found
                    </div>
                  ) : (
                    filteredLeaders.map((member) => {
                      const isLeader = (portfolio.leaders || []).includes(member.userId);
                      return (
                        <DropdownMenuItem
                          key={member.userId}
                          onSelect={() => handleUpdateLeader(member.userId)}
                          className="p-0 focus:bg-transparent"
                        >
                          <div className={cn(
                            "w-full h-9 flex items-center justify-between gap-1.5 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-2 cursor-pointer bg-muted text-foreground",
                            isLeader && "bg-secondary"
                          )}>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <Avatar className="h-5 w-5 border shrink-0">
                                {member.profilePicture && <AvatarImage src={member.profilePicture} />}
                                <AvatarFallback
                                  className="text-white text-[9px] font-semibold"
                                  style={{ backgroundColor: getAvatarColor(member.name) }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{member.name}</span>
                            </div>
                            {isLeader && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Labels */}
      <div className="space-y-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
        >
          <Label className="font-semibold cursor-pointer">Labels</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 pointer-events-none"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isLabelsExpanded ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>
        </div>
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isLabelsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
        )}>
          {/* Collapsible content area */}
        </div>
      </div>

      <Separator className="my-4" />

      {/* About this Portfolio */}
      <div className="space-y-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsAboutPortfolioExpanded(!isAboutPortfolioExpanded)}
        >
          <Label className="font-semibold cursor-pointer">About this Portfolio</Label>
          <div className="flex items-center gap-2">
            {charCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {charCount} chars
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 pointer-events-none"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAboutPortfolioExpanded ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>
        </div>
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isAboutPortfolioExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
        )}>
          <TooltipProvider>
            <ProseMirrorEditor
              initialContent={content}
              mentionableMembers={mentionableMembers}
              onBlur={handleContentChange}
              placeholder="Add portfolio description..."
              className="w-full h-full"
            />
          </TooltipProvider>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Linked Items */}
      <div className="space-y-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsLinkedItemsExpanded(!isLinkedItemsExpanded)}
        >
          <Label className="font-semibold cursor-pointer">Linked Items</Label>
          <div className="flex items-center gap-1">
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-y-auto p-2">
                  {linkedDocs.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase sticky top-0 bg-popover z-10">
                        Linked Documents
                      </div>
                      {linkedDocs.map((doc) => (
                        <DropdownMenuItem
                          key={doc.id}
                          className="cursor-pointer flex items-center justify-between group px-2 py-2 hover:bg-muted"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="truncate text-xs">{doc.title}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDocument(doc.id);
                            }}
                          >
                            <X className="w-3 h-3 text-red-500" />
                          </Button>
                        </DropdownMenuItem>
                      ))}
                      <div className="h-px bg-border my-2" />
                    </>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted cursor-pointer text-xs text-foreground mx-1 my-1">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <span>Link Docs</span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="w-56 p-0">
                      {availableDocs.length > 0 ? (
                        <>
                          <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                            Available Documents
                          </div>
                          {/* Only ONE scroll container */}
                          <div className="max-h-52 overflow-y-auto">
                            {availableDocs.map((doc) => (
                              <DropdownMenuItem
                                key={doc.id}
                                onClick={() => handleAddDocument(doc.id)}
                                className="cursor-pointer px-2 py-2 text-xs"
                              >
                                <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="truncate">{doc.title}</span>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-xs text-muted-foreground text-center">
                          No documents available to link
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {linkedDocs.length === 0 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground italic">
                      No documents linked yet
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 pointer-events-none"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isLinkedItemsExpanded ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>
        </div>

        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isLinkedItemsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
        )}>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {linkedDocs.length > 0 ? (
              linkedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between p-2 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium truncate">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/docs/${doc.id}`} target="_blank">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      >
                        <SquareArrowOutUpRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="h-6 w-6 text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic">No items linked yet.</div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Attachments */}
      <div className="space-y-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
        >
          <div className="flex gap-2">
            <Label className="font-semibold cursor-pointer">Attachments</Label>
            {portfolioAttachments.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {portfolioAttachments.length} items
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {portfolioAttachments.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAttachOpen(true);
                }}
                className="p-2 rounded-md bg-muted hover:bg-muted transition"
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 pointer-events-none"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAttachmentsExpanded ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>
        </div>

        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isAttachmentsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
        )}>
          {portfolioAttachments.length === 0 ? (
            <div
              className="rounded-lg p-6 text-center bg-muted cursor-pointer hover:bg-muted transition"
              onClick={() => setIsAttachOpen(true)}
              role="button"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-brand-orange" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium">Upload sources</p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or{" "}
                    <span className="text-brand-orange cursor-pointer">
                      choose file
                    </span>{" "}
                    to upload
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${showAll ? "max-h-250 opacity-100" : "max-h-50 opacity-100"}`}>
              {visibleAttachments.map((file) => (
                <PortfolioAttachments
                  key={file.id}
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}

              {portfolioAttachments.length > 2 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-muted-foreground text-center font-medium hover:underline"
                  >
                    {showAll
                      ? "Show less"
                      : `Show more (${portfolioAttachments.length - 2})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <AttachFileModal
          open={isAttachOpen}
          onClose={() => setIsAttachOpen(false)}
          onAttach={handleAttachFiles}
        />
      </div>
    </div>
  );
}