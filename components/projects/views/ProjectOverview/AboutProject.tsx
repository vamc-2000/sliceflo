'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ProseMirrorEditor } from '@/components/proseMirror/ProseMirrorEditor'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toast } from "@/components/ui/sonner";
import { Hash, Plus, Flag, User, X, FileText, SquareArrowOutUpRight, Calendar as CalendarIcon, Users, Hexagon, BadgeCent, Upload, Paperclip, Check } from 'lucide-react'
import { useProfileStore } from '@/stores/profile-store'
import { useProjectsStore } from '@/stores/projects-store'
import { useDocStore } from '@/stores/useDoc-store'
import { useTasksStore } from '@/stores/tasks-store'
import { LabelPicker } from '@/components/shared/labels/LabelPicker';
import { LabelBadge } from '@/components/shared/labels/LabelBadge';
import { Tag } from 'lucide-react';
import { uploadFile, getUpload } from "@/lib/api/uploads-api"
import { updateDocument as updateDocumentApi } from "@/lib/api/documents-api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import Link from 'next/link'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { cn } from '@/lib/utils'
import AttachFileModal from '@/components/disucssions/AttachFileModal'
import { ProjectAttachments } from './ProjectAttachments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePortfoliosStore } from '@/stores/portfolios-store'

interface AboutProjectProps {
  projectDescription?: string
  projectName?: string
  projectLeader?: {
    name?: string
    avatar?: string | null
  }
  projectPriority?: string
  projectStatus?: string
  projectStartDate?: string
  projectEndDate?: string
  projectId?: string
  workspaceId?: string
  customFieldValues?: Record<string, string>
}

import { FileAttachment } from '@/types/attachment.types'

export default function AboutProject({
  projectDescription = '',
  projectName = '',
  projectLeader = {},
  projectPriority = 'medium',
  projectStatus = 'active',
  projectStartDate,
  projectEndDate,
  projectId,
  workspaceId,
  customFieldValues = {},
}: AboutProjectProps) {
  const [content, setContent] = useState(projectDescription)
  const [charCount, setCharCount] = useState(0)
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showAll, setShowAll] = useState(false);
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);

  const { user: profile } = useProfileStore()
  const {
    projects,
    updateProject,
    updateProjectPriority,
    updateProjectDates,
    updateProjectCustomFieldValue,
    updateProjectPhase,
    attachUploadsToProject,
    removeUploadsFromProject,
    getProjectPriorityConfigs,
    updateProjectLabels,
    updateProjectLeaders,
  } = useProjectsStore()
  const { portfolios, fetchPortfolios } = usePortfoliosStore()
  const { documents, addProjectToDocument, removeProjectFromDocument } = useDocStore()

  const {
    workspaceCustomFieldsConfig,
    currentWorkspace,
    workspaceMembers,
    projectPhases,
    fetchWorkspaceCustomFieldsConfig,
  } = useWorkspaceStore()

  const { tasks, fetchTasks } = useTasksStore()

  const resolvedWorkspaceId = workspaceId || currentWorkspace?.id || ''
  const workspaceCustomFields = workspaceCustomFieldsConfig[resolvedWorkspaceId] || []

  // Get current project
  const currentProject = projects.find(p => p.id === projectId)

  const projectCustomFieldValues = currentProject?.customFieldValues ?? {};

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId)
    }
  }, [projectId])
  const [projectAttachments, setProjectAttachments] = useState<FileAttachment[]>([]);
  const visibleAttachments = showAll
    ? projectAttachments
    : projectAttachments.slice(0, 2);

  // Sync attachments from the store to component state
  useEffect(() => {
    const projAttachmentsList = currentProject?.attachments || [];
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const taskAttachmentsList = projectTasks.flatMap(t => t.attachments || []);

    const allAttachments = [...projAttachmentsList, ...taskAttachmentsList];

    if (!allAttachments.length) {
      setProjectAttachments([]);
      return;
    }

    const resolved = allAttachments.filter(Boolean).map((att: any, index: number) => {
      const isString = typeof att === 'string';
      const attId = isString ? att : (att.id || att._id);

      // Use fileName from project store or name/id as fallback
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

    setProjectAttachments(resolved as FileAttachment[]);
  }, [currentProject?.attachments, tasks, projectId, workspaceMembers]);

  // Get current project's linked docs
  const linkedDocs = useMemo(() => {
    if (!projectId) return [];
    return Array.from(documents.values()).filter(
      (doc) =>
        doc.linkedProjects?.includes(projectId) &&
        !doc.parentId
    );
  }, [documents, projectId]);

  // Get available docs not yet linked
  const availableDocs = useMemo(() => {
    if (!projectId) return [];
    return Array.from(documents.values()).filter(
      (doc) =>
        !doc.linkedProjects?.includes(projectId) &&
        !doc.parentId
    );
  }, [documents, projectId]);

  const getTextLength = (html: string): number => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent?.trim().length || 0
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setCharCount(getTextLength(newContent))
  }

  const mentionableMembers = useMemo(() => {
    if (!currentProject?.members || !workspaceMembers) return [];

    // Create a set of project member user IDs for efficient lookup
    const projectUserIds = new Set(currentProject.members.map(m => m.userId));

    // Filter workspace members to only those who are in the project
    return workspaceMembers
      .filter(m => projectUserIds.has(m.userId))
      .map(m => ({
        id: m.userId,
        name: m.name,
        avatar: m.avatar || m.profilePicture || ''
      }));
  }, [currentProject?.members, workspaceMembers]);

  useEffect(() => {
    if (projectDescription) {
      setContent(projectDescription)
      setCharCount(getTextLength(projectDescription))
    }
  }, [projectDescription])

  useEffect(() => {
    if (resolvedWorkspaceId && workspaceCustomFields.length === 0) {
      // Already imported: fetchWorkspaceCustomFieldsConfig
      // Add to destructuring from useWorkspaceStore:
      fetchWorkspaceCustomFieldsConfig(resolvedWorkspaceId)
    }
  }, [resolvedWorkspaceId])
  const handleAttachFiles = async (files: File[]) => {
    if (!projectId) return

    setIsUploading(true)
    try {
      const uploadPromises = files.map(file => uploadFile(file))
      const results = await Promise.all(uploadPromises)

      const uploadIds = results.map(r => r.id)
      await attachUploadsToProject(projectId, uploadIds)

      setIsAttachModalOpen(false)
    } catch (error: any) {
      toast('error', { title: error?.message || "Failed to upload files" })
    } finally {
      setIsUploading(false)
    }
  }

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
      toast('error', { title: "Failed to download file" });
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
      toast('error', { title: "Failed to view file" });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!projectId) return;
    try {
      await removeUploadsFromProject(projectId, [attachmentId]);
    } catch (error) {
      toast('error', { title: 'Failed to delete attachment' });
      throw error;
    }
  };

  const handleAddDocument = async (docId: string) => {
    if (projectId) {
      addProjectToDocument(docId, projectId);
      try {
        const doc = documents.get(docId);
        if (doc) {
          const currentProjects = doc.linkedProjects || [];
          if (!currentProjects.includes(projectId)) {
            await updateDocumentApi(docId, { linkedProjects: [...currentProjects, projectId] });
          }
        }
      } catch (err: any) {
        toast('error', { title: err?.message ?? "Failed to link document" });
      }
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    if (projectId) {
      removeProjectFromDocument(docId, projectId);
      try {
        const doc = documents.get(docId);
        if (doc) {
          const currentProjects = doc.linkedProjects || [];
          await updateDocumentApi(docId, { linkedProjects: currentProjects.filter(id => id !== projectId) });
        }
      } catch (err: any) {
        toast('error', { title: err?.message ?? "Failed to unlink document" });
      }
    }
  };

  // Update handlers
  const handleUpdateStatus = (status: string) => {
    if (projectId) {
      updateProject(projectId, { status: status as any });
    }
  };

  const handleUpdatePriority = (priority: string) => {
    if (projectId) {
      updateProjectPriority(projectId, priority);
    }
  };

  const handleUpdateStartDate = (date: Date | undefined) => {
    if (projectId && date) {
      updateProjectDates(projectId, date.toISOString(), currentProject?.endDate);
    }
  }

  const handleUpdateEndDate = (date: Date | undefined) => {
    if (projectId && date) {
      updateProjectDates(projectId, currentProject?.startDate, date.toISOString());
    }
  }

  const handleUpdateLeader = (userId: string) => {
    if (!projectId || !currentProject) return;

    const currentLeaders = currentProject.leaders || [];
    const isLeader = currentLeaders.includes(userId) || currentProject.projectLeader === userId;

    if (isLeader) {
      // Prevent self-leader removal
      if (userId === profile?.id) {
        toast('error', { title: "You cannot remove yourself as a leader" });
        return;
      }
      const newLeaders = currentLeaders.filter(id => id !== userId);
      updateProjectLeaders(projectId, newLeaders);
    } else {
      const newLeaders = [...currentLeaders, userId];
      updateProjectLeaders(projectId, newLeaders);
    }
  };

  const assignedLabels = useMemo(() => {
    const workspaceLabels = currentWorkspace?.labels || [];
    const projectLabelIds = currentProject?.labelIds || currentProject?.labels?.map(l => l.id) || [];
    return workspaceLabels.filter(label => projectLabelIds.includes(label.id));
  }, [currentProject, currentWorkspace]);

  const handleSelectLabel = async (labelId: string) => {
    if (!projectId) return;
    const currentIds = assignedLabels.map((l) => l.id);
    if (!currentIds.includes(labelId)) {
      const newLabelIds = [...currentIds, labelId];
      await updateProjectLabels(projectId, newLabelIds);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!projectId) return;
    const newLabelIds = assignedLabels
      .filter(l => l.id !== labelId)
      .map(l => l.id);
    await updateProjectLabels(projectId, newLabelIds);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    planning: 'bg-blue-100 text-blue-700',
    'on-hold': 'bg-orange-100 text-orange-700',
    completed: 'bg-muted text-foreground',
  }

  // Get avatar color
  const getAvatarColor = (name: string): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Priority options — from project config, fallback to empty
  const projectPriorityConfigs = projectId ? getProjectPriorityConfigs(projectId) : [];

  const priorityLevels = projectPriorityConfigs.length > 0
    ? projectPriorityConfigs.map(p => ({
      value: p.value,
      label: p.label,
      color: p.color, // use raw hex color
    }))
    : [];

  const assignedPhase = projectPhases
    .flatMap(p => [p, ...(p.children || [])])
    .find(p => p.value === currentProject?.phase) ?? null

  return (
    <div className="space-y-3">
      {/* Project Details */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Project Details</h3>

        {/* ✅ State - Left-Right Alignment */}
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground flex items-center gap-2 text-xs">
            <Hexagon className="h-4 w-4" />
            Phase
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={cn("h-8 px-3 hover:bg-muted",
                  !assignedPhase && "text-muted-foreground")}>
                {assignedPhase ? (
                  <Badge
                    className={cn("h-6", statusColors[projectStatus as keyof typeof statusColors])}
                  // style={{ background: assignedPhase.color }}
                  >
                    {assignedPhase.label}
                  </Badge>

                ) : (
                  "—"
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className='w-40'>
              <DropdownMenuItem onClick={() => projectId && updateProjectPhase(projectId, '')} className="text-xs">
                Clear
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projectPhases.map(phase => (
                <React.Fragment key={phase._id}>
                  <DropdownMenuItem
                    onClick={() => projectId && updateProjectPhase(projectId, phase.value)}
                    className="text-xs"
                  >
                    <span className="w-2 h-2 rounded-full mr-2" style={{ background: phase.color }} />
                    {phase.label}
                  </DropdownMenuItem>
                  {phase.children?.map(child => (
                    <DropdownMenuItem
                      key={child._id}
                      className="pl-6 text-xs"
                      onClick={() => projectId && updateProjectPhase(projectId, child.value)}
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ background: child.color }} />
                      {child.label}
                    </DropdownMenuItem>
                  ))}
                </React.Fragment>
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
                  "h-8 transition-all duration-200",
                  projectPriority ? "w-8 p-0 rounded-full" : "px-3 bg-secondary hover:bg-muted",
                  !projectPriority && "text-muted-foreground"
                )}
                style={projectPriority ? (() => {
                  const matched = projectPriorityConfigs.find(p => p.value === projectPriority);
                  return { backgroundColor: matched ? matched.color + '15' : '#e5e7eb15' };
                })() : {}}
              >
                {projectPriority ? (() => {
                  const matched = projectPriorityConfigs.find(p => p.value === projectPriority);
                  return (
                    <Flag
                      className="h-4 w-4"
                      style={{ color: matched ? matched.color : '#6b7280' }}
                    />
                  );
                })() : "—"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {priorityLevels.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground italic">
                  No priorities configured
                </div>
              ) : (
                priorityLevels.map((level) => (
                  <DropdownMenuItem
                    key={level.value}
                    onSelect={() => handleUpdatePriority(level.value)}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Flag
                        className="h-3.5 w-3.5"
                        style={{ color: level.color }}
                      />
                      <span>{level.label}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ✅ Start Date - Left-Right Alignment */}
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground flex items-center gap-2 text-xs">
            <CalendarIcon className="h-4 w-4" />
            Start Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={cn(
                  "h-8 px-3 font-normal hover:bg-muted text-xs",
                  !currentProject?.startDate && "text-muted-foreground"
                )}
              >
                {currentProject?.startDate ? format(new Date(currentProject.startDate), "PP") : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentProject?.startDate ? new Date(currentProject.startDate) : undefined}
                onSelect={handleUpdateStartDate}
                initialFocus
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={cn(
                  "h-8 px-3 font-normal hover:bg-muted text-xs",
                  !currentProject?.endDate && "text-muted-foreground"
                )}
              >
                {currentProject?.endDate ? format(new Date(currentProject.endDate), "PP") : "—"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentProject?.endDate ? new Date(currentProject.endDate) : undefined}
                onSelect={handleUpdateEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* ✅ Leader - Multi-Avatar Display */}
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground flex items-center gap-2 text-xs">
            <User className="h-4 w-4" />
            Leaders
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 hover:bg-muted flex items-center gap-1",
                  (!currentProject?.leaders || currentProject.leaders.length === 0) && !currentProject?.projectLeader && "text-muted-foreground"
                )}
              >
                {(() => {
                  const leaderIds = currentProject?.leaders?.length
                    ? currentProject.leaders
                    : (currentProject?.projectLeader ? [currentProject.projectLeader] : []);

                  if (leaderIds.length === 0) return "—";

                  return (
                    <div className="flex -space-x-2 overflow-hidden">
                      {leaderIds.map((id, i) => {
                        const m = workspaceMembers.find(member => member.userId === id);
                        return (
                          <Avatar
                            key={id}
                            className="h-6 w-6 border-2 border-white"
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold py-1 px-2.5">Project Leaders</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaceMembers.map((member) => {
                const isLeader = (currentProject?.leaders || []).includes(member.userId) || currentProject?.projectLeader === member.userId;
                return (
                  <DropdownMenuItem
                    key={member.userId}
                    onSelect={() => handleUpdateLeader(member.userId)}
                    className="flex items-center justify-between pointer-events-auto text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border">
                        {member.profilePicture && <AvatarImage src={member.profilePicture} />}
                        <AvatarFallback
                          className="text-white text-[10px] font-semibold"
                          style={{ backgroundColor: getAvatarColor(member.name) }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                    {isLeader && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Workspace Custom Fields - Left-Right Alignment */}
      {workspaceCustomFields.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold">Custom Fields</h3>
          {workspaceCustomFields.map((field) => {
            const fieldId = field._id || ''
            const fieldKey = field.name || field.label || '';
            const currentValue = projectCustomFieldValues[fieldKey] ?? '';

            return (
              <div key={fieldId} className="flex items-center justify-between">
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Hash className="h-4 w-4" />
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>

                {/* text — string value */}
                {field.type === 'text' && (
                  <Input
                    defaultValue={currentValue}
                    onBlur={(e) =>
                      projectId && updateProjectCustomFieldValue(projectId, fieldId, fieldKey, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur() // triggers onBlur which calls the update
                      }
                    }}
                    className="h-8 w-auto max-w-[180px] text-xs"
                  />
                )}

                {/* number — send as number, not string */}
                {field.type === 'number' && (
                  <Input
                    type="number"
                    defaultValue={currentValue}
                    onBlur={(e) =>
                      projectId && updateProjectCustomFieldValue(
                        projectId,
                        fieldId,
                        fieldKey,
                        e.target.value ? Number(e.target.value) : ''  // 👈 cast to number
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur() // triggers onBlur which calls the update
                      }
                    }}
                    className="h-8 w-auto max-w-[180px] text-xs"
                  />
                )}

                {/* date — send as ISO date string */}
                {field.type === 'date' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-xs text-muted-foreground">
                        {currentValue ? format(new Date(currentValue), 'PP') : '—'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={currentValue ? new Date(currentValue) : undefined}
                        onSelect={(date) => {
                          if (date && projectId) {
                            updateProjectCustomFieldValue(
                              projectId,
                              fieldId,
                              fieldKey,
                              format(date, 'yyyy-MM-dd')  // 👈 plain date string
                            );
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {/* dropdown — send option value string */}
                {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-xs text-muted-foreground">
                        {currentValue
                          ? field.options.find(o => o.value === currentValue)?.label || currentValue
                          : '—'}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => projectId && updateProjectCustomFieldValue(projectId, fieldId, fieldKey, '')}
                        className="text-xs"
                      >
                        Clear
                      </DropdownMenuItem>
                      {field.options.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() =>
                            projectId && updateProjectCustomFieldValue(projectId, fieldId, fieldKey, option.value)
                          }
                          className="text-xs"
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* fallback for unknown types */}
                {!['text', 'number', 'date', 'dropdown'].includes(field.type) && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Separator className="my-4" />

      {/* Linked Items Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Linked Items</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-0">
              {linkedDocs.length > 0 && (
                <>

                  <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                    Linked Documents
                  </div>
                  {/* linked docs */}
                  <div className="max-h-48 overflow-y-auto p-2">
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
                  </div>
                  <div className="h-px bg-border" />
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
                      {/* Fixed header outside scroll */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                        Available Documents
                      </div>
                      {/* Single scroll container */}
                      <div className="max-h-52 overflow-y-auto">
                        {availableDocs.map((doc) => (
                          <DropdownMenuItem
                            key={doc.id}
                            onClick={() => handleAddDocument(doc.id)}
                            className="cursor-pointer px-2 py-2"
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

      <Separator className="my-4" />

      {/* Labels */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Labels</Label>
          <LabelPicker
            selectedLabelIds={assignedLabels.map(l => l.id)}
            onSelect={handleSelectLabel}
            onRemove={handleRemoveLabel}
          >
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </LabelPicker>
        </div>

        <div className="flex flex-wrap gap-2">
          {assignedLabels.length > 0 ? (
            assignedLabels.map((label) => (
              <LabelBadge
                key={label.id}
                label={label}
                onRemove={handleRemoveLabel}
              />
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic">No labels assigned yet.</div>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* About this Project */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">About this Project</Label>
          {charCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {charCount} chars
            </span>
          )}
        </div>
        <TooltipProvider>
          <ProseMirrorEditor
            initialContent={content}
            mentionableMembers={mentionableMembers}
            onBlur={(newContent) => {
              if (projectId) {
                updateProject(projectId, { description: newContent });
              }
            }}
            placeholder="Add project description..."
          />
        </TooltipProvider>
      </div>

      <Separator className="my-4" />

      {/* Attachments */}
      <div className="space-y-3 ">
        <div className="flex items-center justify-between">
          <div className="flex  gap-2">
            <Label className="font-semibold">Attachments</Label>

            {projectAttachments.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {projectAttachments.length} items
              </span>
            )}
          </div>

          {projectAttachments.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAttachModalOpen(true)}
              className="p-2 rounded-md bg-muted hover:bg-muted transition"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
        {projectAttachments.length === 0 ? (
          <div
            className="rounded-lg p-6 text-center bg-muted cursor-pointer hover:bg-muted transition"
            onClick={() => setIsAttachModalOpen(true)}
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
          <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${showAll ? "max-h-250 opacity-100" : "max-h-50 opacity-100"
            }`}>
            {visibleAttachments.map((file) => (
              <ProjectAttachments
                key={file.id}
                file={file}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}

            {projectAttachments.length > 2 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-muted-foreground text-center font-medium hover:underline"
                >
                  {showAll
                    ? "Show less"
                    : `Show more (${projectAttachments.length - 2})`}
                </button>
              </div>
            )}
          </div>
          // <Collapsible
          //   open={showAll}
          //   onOpenChange={setShowAll}
          //   className="space-y-2"
          // >
          //   {/* Always Visible (First 2 files) */}
          //   {projectAttachments.slice(0, 2).map((file) => (
          //     <ProjectAttachments
          //       key={file.id}
          //       file={file}
          //       onDelete={handleDelete}
          //     />
          //   ))}

          //   {/* Hidden Files */}
          //   {projectAttachments.length > 2 && (
          //     <>
          //       <CollapsibleContent className="space-y-2 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          //         {projectAttachments.slice(2).map((file) => (
          //           <ProjectAttachments
          //             key={file.id}
          //             file={file}
          //             onDelete={handleDelete}
          //           />
          //         ))}
          //       </CollapsibleContent>

          //       <div className="text-center pt-1">
          //         <CollapsibleTrigger asChild>
          //           <button className="text-xs text-muted-foreground font-medium hover:underline transition">
          //             {showAll
          //               ? "Show less"
          //               : `Show more (${projectAttachments.length - 2})`}
          //           </button>
          //         </CollapsibleTrigger>
          //       </div>
          //     </>
          //   )}
          // </Collapsible>
        )}

        <AttachFileModal
          open={isAttachModalOpen}
          onClose={() => setIsAttachModalOpen(false)}
          onAttach={handleAttachFiles}
        />
      </div>
    </div>
  )
}
