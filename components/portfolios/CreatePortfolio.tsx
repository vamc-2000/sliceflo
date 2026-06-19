// components/portfolios/CreatePortfolio.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Image as ImageIcon,
  UserPlus2,
  ChevronDownIcon,
  LockKeyhole,
  Users2,
  Flag,
  LockIcon,
  ChevronUpIcon,
  CalendarIcon,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usePortfoliosStore,
  Portfolio as PortfolioType,
} from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { useTeamStore } from "@/stores/teams-store";
import ColorIconPicker, { IconData, iconLibrary } from '@/components/ColorIconPicker'
import { uploadIcon, uploadFile, deleteUpload } from '@/lib/api/uploads-api'
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatLocalDate, convertSelectedDateToUTC, convertUTCToCalendarDate } from "@/utils/timezone-utils";

type Privacy = "private" | "public";
type Priority = "low" | "medium" | "high" | "urgent";

const priorityConfig: Record<
  Priority,
  { label: string; iconColor: string; badgeColor: string }
> = {
  low: { label: "Low", iconColor: "text-green-500", badgeColor: "bg-green-100" },
  medium: { label: "Medium", iconColor: "text-yellow-500", badgeColor: "bg-yellow-100" },
  high: { label: "High", iconColor: "text-orange-500", badgeColor: "bg-orange-100" },
  urgent: { label: "Urgent", iconColor: "text-red-500", badgeColor: "bg-red-100" },
};

interface CreatePortfolioProps {
  teamId?: string;
  projectId?: string;
}

export const CreatePortfolio = ({ teamId, projectId }: CreatePortfolioProps) => {
  const router = useRouter();
  const { addPortfolio } = usePortfoliosStore();
  const { projects } = useProjectsStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const { user } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioIdentifier, setPortfolioIdentifier] = useState("");
  const [portfolioIcon, setPortfolioIcon] = useState<string | null>(null)
  const [portfolioIconType, setPortfolioIconType] = useState<'icon' | 'file'>('icon')
  const [portfolioIconId, setPortfolioIconId] = useState<string | null>(null)
  const [selectedIconData, setSelectedIconData] = useState<IconData | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [portfolioLeader, setPortfolioLeader] = useState("");
  const [priority, setPriority] = useState<Priority | undefined>('medium');
  const [privacy, setPrivacy] = useState<Privacy>("private");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([]);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [workflowPermission, setWorkflowPermission] = useState<"Me" | "Admins" | "Everyone">("Me");
  const [membershipPermission, setMembershipPermission] = useState<"Me" | "Admins" | "Everyone">("Me");
  const [fieldsPermission, setFieldsPermission] = useState<"Me" | "Admins" | "Everyone">("Me");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (user?.id && !portfolioLeader) {
      setPortfolioLeader(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (projectId && !linkedProjectIds.includes(projectId)) {
      setLinkedProjectIds([projectId]);
    }
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setProjectDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleIconUpload = async (file: File) => {
    const result = await uploadFile(file)
    setPortfolioIconId(result.id)
    return result
  }

  const handleIconDelete = async (uploadId: string) => {
    await deleteUpload(uploadId)

    if (portfolioIconId === uploadId) {
      setPortfolioIconId(null)
      setPortfolioIcon(null)
      setSelectedIconData(null)
    }
  }

  const handleIconSelect = (iconData: IconData) => {
    setSelectedIconData(iconData)
    setPortfolioIconType(iconData.type)

    if (iconData.type === "icon") {
      setPortfolioIcon(iconData.icon ?? null)
      setPortfolioIconId(iconData.iconId ?? null)
    } else {
      setPortfolioIcon(iconData.image ?? null)
      setPortfolioIconId(iconData.imageId ?? null)
    }
  }

  const handlePortfolioNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPortfolioName(name);
    setPortfolioIdentifier(
      name.slice(0, 3).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    );
  };

  const toggleLinkedProject = (projectId: string) => {
    setLinkedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCreatePortfolio = async () => {
    if (!isFormValid()) return;
    setLoading(true);
    setError(null);

    try {
      let finalIconId: string | null = portfolioIconId;

      // Upload library icon if not already uploaded
      if (selectedIconData && selectedIconData.type === "icon" && !portfolioIconId) {
        const iconUploadResult = await uploadIcon({
          icon: {
            name: selectedIconData.icon || "default",
            color: selectedIconData.color,
          },
        });
        finalIconId = iconUploadResult.id;
      }

      // For file type, ID is already set from handleIconUpload
      if (selectedIconData && selectedIconData.type === "file") {
        finalIconId = portfolioIconId;
      }

      const payload: any = {
        name: portfolioName,
        workspaceId: currentWorkspace?.id || "",
        slug: portfolioIdentifier.toLowerCase(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        leaderIds: portfolioLeader ? [portfolioLeader] : [],
        priority: priority || "low",
        status: "open",
        projectIds: linkedProjectIds,
        iconId: finalIconId || undefined,
        // members: portfolioLeader ? [{ userId: portfolioLeader, role: "admin" }] : [],
        // Optional permissions can be added if backend supports them later
      };

      const newPortfolio = await addPortfolio(payload);

      if (teamId) {
        try {
          const { assignPortfolioToTeam } = useTeamStore.getState();
          await assignPortfolioToTeam(teamId, newPortfolio.id);
        } catch (linkErr) {
          console.error("Error linking portfolio to team:", linkErr);
          // Non-blocking error, we still proceed to the portfolio page
        }
      } else if (projectId) {
        try {
          const { attachPortfoliosToProject } = useProjectsStore.getState();
          await attachPortfoliosToProject(projectId, [newPortfolio.id]);
        } catch (linkErr) {
          console.error("Error linking portfolio to project:", linkErr);
        }
      }

      if (teamId) {
        router.push(`/teams/${teamId}`);
      } else if (projectId) {
        router.push(`/project/${projectId}`);
      } else {
        router.push(`/portfolio/${newPortfolio.id}`);
      }

      // router.push(`/portfolio/${newPortfolio.id}`);
    } catch (err: any) {
      console.error("Error creating portfolio:", err);
      setError(err.response?.data?.message || "Failed to create portfolio. Please try again.");
      setLoading(false);
    }
  };

  const isFormValid = () => portfolioName.trim() !== "";

  const handleBack = () => {
    router.back();
  };

  const selectedLeader = workspaceMembers.find(
    (m) => m.userId === portfolioLeader
  );
  const linkedProjects = projects.filter((p) => linkedProjectIds.includes(p.id ?? ""));

  const renderIcon = () => {
    if (!portfolioIcon) {
      return <ImageIcon size={20} className="text-gray-400" />
    }

    if (portfolioIconType === 'file') {
      return (
        <img
          src={portfolioIcon}
          className="w-full h-full object-cover"
        />
      )
    }

    const iconObj = iconLibrary.find(i => i.name === portfolioIcon)
    if (iconObj) {
      const IconComponent = iconObj.icon
      return (
        <IconComponent
          size={20}
          color={selectedIconData?.color || '#6366f1'}
        />
      )
    }

    return <span>{portfolioIcon}</span>
  }

  return (
    <div className="bg-background flex flex-col w-full">
      <div className="flex-1 flex flex-col">
        <div className="w-full p-6 bg-background">
          <div className="space-y-4">

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            {/* Header Info Row */}
            <div className="rounded-lg p-4 bg-muted">
              <div className="flex items-start gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Icon</label>

                  <button
                    type="button"
                    onClick={() => setShowColorPicker(true)}
                    className="w-10 h-10 bg-card border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors overflow-hidden"
                  >
                    {renderIcon()}
                  </button>

                  <ColorIconPicker
                    isOpen={showColorPicker}
                    onClose={() => setShowColorPicker(false)}
                    onSelect={handleIconSelect}
                    currentIcon={portfolioIcon}
                    currentColor={selectedIconData?.color || '#6366f1'}
                    currentType={portfolioIconType}
                    onUpload={handleIconUpload}
                    onDelete={handleIconDelete}
                  />
                </div>

                <div className="w-80">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Portfolio name</label>
                  <Input type="text" value={portfolioName} onChange={handlePortfolioNameChange} placeholder="e.g. Portfolio name" className="h-10 bg-card" />
                </div>

                <div className="w-80">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Portfolio identifier</label>
                  <Input type="text" value={portfolioIdentifier} onChange={(e) => setPortfolioIdentifier(e.target.value.toUpperCase())} placeholder="e.g. PRO" className="h-10 bg-card uppercase" readOnly />
                </div>

                <div className="w-80">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Start date</label>
                  <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-10 bg-card justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? formatLocalDate(startDate) : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate ? convertUTCToCalendarDate(startDate) : undefined}
                        onSelect={(date) => {
                          const newDate = date ? convertSelectedDateToUTC(date) : "";
                          setStartDate(newDate);
                          // If there's an end date and the new start date is after it, clear the end date
                          if (endDate && date && new Date(endDate) < date) {
                            setEndDate("");
                          }
                          setIsStartDatePopoverOpen(false);
                        }}
                        disabled={(date) => {
                          const endDateCal = endDate ? convertUTCToCalendarDate(endDate) : undefined;
                          return endDateCal ? date > endDateCal : false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-80">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">End date</label>
                  <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-10 bg-card justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? formatLocalDate(endDate) : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate ? convertUTCToCalendarDate(endDate) : undefined}
                        onSelect={(date) => {
                          setEndDate(date ? convertSelectedDateToUTC(date) : "");
                          setIsEndDatePopoverOpen(false);
                        }}
                        disabled={(date) => {
                          const startDateCal = startDate ? convertUTCToCalendarDate(startDate) : undefined;
                          return startDateCal ? date < startDateCal : false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Portfolio Leader */}
            <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow">
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-6">
                  <h1 className="font-semibold text-sm text-foreground">Portfolio leader</h1>
                  <p className="font-medium text-xs text-muted-foreground leading-relaxed">Assign an accountable leader who approves project alignment</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="w-xs rounded-sm flex justify-between items-center px-2">
                      <div className="flex items-center gap-2">
                        {selectedLeader ? (
                          <div className="flex items-center gap-2">
                            {selectedLeader?.profilePicture ? (
                              <img
                                src={selectedLeader.profilePicture}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {selectedLeader?.name?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                            <span className="text-muted-foreground">{selectedLeader?.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserPlus2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Add user or email</span>
                          </div>
                        )}
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-xs border border-border bg-popover text-popover-foreground shadow-md">
                    {workspaceMembers.map((member) => (
                      <DropdownMenuItem key={member.userId} onClick={() => setPortfolioLeader(member.userId)} className="cursor-pointer">
                        <div className="flex items-center gap-2 w-full">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={member.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span>{member.name}</span>
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Priority */}
            <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow">
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-6">
                  <h1 className="font-semibold text-sm text-foreground">Priority</h1>
                  <p className="font-medium text-xs text-muted-foreground leading-relaxed">Set priority based on strategic business value and urgency which drives executive attention.</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="lg" className={cn("w-xs rounded-sm flex justify-start items-center px-2", priority ? priorityConfig[priority].badgeColor : "bg-gray-100")}>
                      {priority ? (
                        <>
                          <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", priorityConfig[priority].badgeColor)}>
                            <Flag className={cn("h-4 w-4", priorityConfig[priority].iconColor)} />
                          </div>
                          <span className="capitalize">{priority}</span>
                        </>
                      ) : (
                        <div className="flex justify-between items-center w-full px-2">
                          <span className="text-muted-foreground">Create or select a priority</span>
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-xs border border-border bg-popover text-popover-foreground shadow-md">
                    {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                      <DropdownMenuItem key={p} className="justify-between" onClick={() => setPriority(p)}>
                        <span className="capitalize">{p}</span>
                        <div className={cn("h-6 w-6 rounded-full flex items-center justify-center p-0.5", priorityConfig[p].badgeColor)}>
                          <Flag className={cn("h-2.5 w-2.5", priorityConfig[p].iconColor)} />
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Portfolio Privacy */}
            <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-6">
                  <h1 className="font-semibold text-sm text-foreground">Portfolio privacy</h1>
                  <p className="font-medium text-xs text-muted-foreground leading-relaxed">Control and separate who can view and who is accountable for strategic ownership</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="lg" onClick={() => setPrivacy("private")} className={cn("w-xs rounded-sm flex justify-start items-center px-2 py-6", privacy === "private" && "border-l-4 border-l-foreground")}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center`}>
                      <LockKeyhole className={`h-6 w-6 text-muted-foreground`} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start">
                      <span className="text-xs text-muted-foreground font-bold">Private</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Accessible only by invite</span>
                    </div>
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setPrivacy("public")} className={cn("w-xs rounded-sm flex justify-start items-center px-2 py-6", privacy === "public" && "border-l-4 border-l-foreground")}>
                    <div className="h-6 w-6 rounded-full flex items-center justify-center">
                      <Users2 className="h-6 w-6 text-muted-foreground" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col justify-center items-start">
                      <span className="text-xs text-muted-foreground font-bold">Public</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Anyone in the workspace except Guests can join</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Link Projects */}
            <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-6">
                  <h1 className="font-semibold text-sm text-foreground">Attached Projects</h1>
                  <p className="font-medium text-xs text-muted-foreground leading-relaxed">Select existing projects to include</p>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[260px]">
                  {linkedProjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end mb-1">
                      {linkedProjects.map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded border border-border text-sm text-foreground">
                          {p.name}
                          <button type="button" onClick={() => toggleLinkedProject(p.id ?? "")} className="text-muted-foreground hover:text-red-500 ml-1">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative w-xs" ref={projectDropdownRef}>
                    {/* Trigger Button */}
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full rounded-sm flex justify-between items-center px-2"
                      onClick={() => setProjectDropdownOpen((prev) => !prev)}
                      type="button"
                    >
                      <span className="text-muted-foreground">
                        {linkedProjectIds.length > 0
                          ? `${linkedProjectIds.length} project(s) linked`
                          : "Select"}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {/* Dropdown List */}
                    {projectDropdownOpen && (
                      <div className="absolute z-50 right-0 bottom-full mb-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {projects.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No projects available</div>
                        ) : (
                          projects.map((project) => {
                            const isSelected = linkedProjectIds.includes(project.id ?? "");
                            return (
                              <label
                                key={project.id}
                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleLinkedProject(project.id ?? "")}
                                  className="h-4 w-4 accent-foreground rounded"
                                />
                                <div
                                  className="w-5 h-5 rounded flex items-center justify-center text-xs text-white flex-shrink-0"
                                  style={{ backgroundColor: project.color || "#6366f1" }}
                                >
                                  {project.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-sm text-foreground">{project.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Permissions */}
            {/* <div className="border-l-4 border-l-[#001F3F] border border-gray-200 rounded-lg p-4 bg-white mb-6 shadow" >
              <div className="flex flex-col justify-between">
                <div className="flex-1">
                  <h1 className="font-semibold text-sm text-[#001F3F]">Portfolio permssions</h1>
                  <div className='flex items-center py-2'>
                    <div className='flex justify-between w-full p-2 bg-[#FF9500]/20 rounded-md'>
                      <div className='flex items-center gap-2'>
                        <LockIcon className={`h-4 w-4`} />
                        <p className="font-normal text-xs text-[#001F3F] leading-relaxed">
                          Upgrade to SliceFlo Enterprise+ to use this feature.
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`focus-ring-none rounded-sm bg-[#F68C1F] px-6 text-white`}
                      >
                        Upgrade
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`focus-ring-none text-gray-500 rounded-sm  mx-2 py-0`}
                      onClick={() => setPermissionsOpen((v) => !v)}
                    >
                      {permissionsOpen ? (
                        <ChevronUpIcon className={`h-6 w-6`} />
                      ) : (
                        <ChevronDownIcon className={`h-6 w-6`} />
                      )}
                    </Button>
                  </div>

                </div>
                {permissionsOpen && (
                  <div className="pt-6 p-2 space-y-6">
                    <div className="flex flex-col gap-2">
                      <h1 className="text-sm text-[#8E8E93] font-semibold">General</h1>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8E8E93] font-medium">Who can modify this portfolio's workflow?</span>
                        <div className="grid grid-cols-3 gap-4">
                          <Button
                            variant="ghost"
                            onClick={() => setWorkflowPermission('Me')}
                            className={`flex-1 border text-xs ${workflowPermission === 'Me'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Me
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setWorkflowPermission('Admins')}
                            className={`flex-1 border text-xs ${workflowPermission === 'Admins'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Admins
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setWorkflowPermission('Everyone')}
                            className={`flex-1 border text-xs ${workflowPermission === 'Everyone'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Everyone
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8E8E93] font-medium">Who can manage portfolio memberships?</span>
                        <div className="grid grid-cols-3 gap-4">
                          <Button
                            variant="ghost"
                            onClick={() => setMembershipPermission('Me')}
                            className={`flex-1 border text-xs ${membershipPermission === 'Me'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Me
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setMembershipPermission('Admins')}
                            className={`flex-1 border text-xs ${membershipPermission === 'Admins'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Admins
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setMembershipPermission('Everyone')}
                            className={`flex-1 border text-xs ${membershipPermission === 'Everyone'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Everyone
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200"></div>

                    <div className="flex flex-col gap-2">
                      <h1 className="text-sm text-[#8E8E93] font-semibold">portfolio fields</h1>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8E8E93] font-medium">Who can modify this portfolio level fields(Priority, Labels, Portfolio name)</span>
                        <div className="grid grid-cols-3 gap-4">
                          <Button
                            variant="ghost"
                            onClick={() => setFieldsPermission('Me')}
                            className={`flex-1 border text-xs ${fieldsPermission === 'Me'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Me
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setFieldsPermission('Admins')}
                            className={`flex-1 border text-xs ${fieldsPermission === 'Admins'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Admins
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setFieldsPermission('Everyone')}
                            className={`flex-1 border text-xs ${fieldsPermission === 'Everyone'
                              ? 'border-gray-200 border-b-[#001F3F] border-b-2 text-[#8E8E93]'
                              : 'text-[#8E8E93]'
                              }`}
                          >
                            Everyone
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div> */}

            {/* Action Buttons */}
            <div className="flex justify-end gap-x-4 items-center pt-4">
              <Button variant="outline" onClick={handleBack} className="min-w-40 text-muted-foreground">Cancel</Button>
              <Button
                onClick={handleCreatePortfolio}
                disabled={!isFormValid() || loading}
                className="min-w-40 bg-foreground hover:bg-foreground/90 text-background"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Portfolio"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};