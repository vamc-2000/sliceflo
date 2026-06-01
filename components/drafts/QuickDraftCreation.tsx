// components/drafts/QuickDraftCreation.tsx

import { useState, useEffect, useMemo } from "react";
import {
  X, Calendar as CalendarIcon, Flag, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjectsStore, getProfilePictureUrl } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { cn } from "@/lib/utils";
import { ProseMirrorEditor } from "../proseMirror/ProseMirrorEditor";

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 'sm', src }: { name?: string; size?: 'sm' | 'md'; src?: string | null }) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8 text-sm';
  if (!name && !src) {
    return (
      <div className={`${dim} rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400`}>
        <User className="h-3 w-3" />
      </div>
    );
  }

  return (
    <UIAvatar className={cn(dim, "border shrink-0")}>
      {src && <AvatarImage src={src} className="object-cover" />}
      <AvatarFallback
        className="font-semibold text-white bg-gray-400 text-[10px]"
        style={{ backgroundColor: name ? getAvatarColor(name) : undefined }}
      >
        {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-3 w-3" />}
      </AvatarFallback>
    </UIAvatar>
  );
}

interface QuickDraftCreationProps {
  selectedDate: Date;
  open: boolean;
  projectId?: string;
  projectName?: string;
  initialDraftName?: string;
  initialAssigneeId?: string;
  onClose: () => void;
  onCreateDraft: (draftData: {
    projectId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    assignee?: string;
    priority?: string;
    status?: string;
  }) => void;
}

export function QuickDraftCreation({
  selectedDate,
  open,
  projectId,
  projectName = "Project name",
  initialDraftName = "",
  initialAssigneeId = "",
  onClose,
  onCreateDraft,
}: QuickDraftCreationProps) {
  const { projects, getTaskStatusConfigs, fetchProjectById, getTaskPriorityConfigs, getMembersByProject } = useProjectsStore();
  const { workspaceMembers } = useWorkspaceStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);
  const [draftName, setDraftName] = useState(initialDraftName);
  const [draftDescription, setDraftDescription] = useState("");
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(initialAssigneeId || undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);
  const taskStatusConfigs = getTaskStatusConfigs(selectedProjectId || "");
  const taskPriorityConfigs = getTaskPriorityConfigs(selectedProjectId || "");

  const projectMembers = useMemo(() => {
    return selectedProjectId ? getMembersByProject(selectedProjectId) : [];
  }, [selectedProjectId, getMembersByProject]);

  const mentionableMembers = useMemo(() => {
    return projectMembers.map(m => ({
      id: m.userId,
      name: m.name ?? m.email ?? m.userId,
      avatar: getProfilePictureUrl(m.avatar)
    }));
  }, [projectMembers]);

  const members = projectMembers;


  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProjectId && (taskStatusConfigs.length === 0 || taskPriorityConfigs.length === 0)) {
      fetchProjectById(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectById]);

  useEffect(() => {
    if (initialDraftName) {
      setDraftName(initialDraftName);
    }
  }, [initialDraftName]);

  useEffect(() => {
    if (initialAssigneeId) {
      setSelectedAssignee(initialAssigneeId);
    }
  }, [initialAssigneeId]);

  useEffect(() => {
    setStartDate(selectedDate);
  }, [selectedDate]);

  const handleCreate = () => {
    if (draftName.trim() && selectedProjectId) {
      onCreateDraft({
        projectId: selectedProjectId,
        name: draftName,
        description: draftDescription.trim() || undefined,
        startDate: startDate,
        endDate: endDate,
        assignee: selectedAssignee,
        priority: selectedPriority,
        status: selectedStatus,
      });
      setDraftName(initialDraftName);
      setDraftDescription("");
      setSelectedAssignee(undefined);
      setSelectedPriority(undefined);
      setSelectedStatus(undefined);
      setStartDate(selectedDate);
      setEndDate(undefined);
      onClose();
    }
  };

  const assignedMember = members.find((m) => m.userId === selectedAssignee);
  const selectedPriorityOption = taskPriorityConfigs.find((p) => p.value === selectedPriority);
  const selectedStatusOption = taskStatusConfigs.find(
    (c) => c.value === selectedStatus
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "w-[80vw] max-w-[750px]",
            "max-h-[75vh] overflow-hidden",
            "bg-white shadow-lg border-2 border-gray-300",
            "rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "border-b-5 border-b-[#001F3F]"
          )}
        >
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>Create New Draft</DialogPrimitive.Title>
          </VisuallyHidden.Root>

          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">
              Drafts / {draftName || "New draft"} {project ? `(${project.name})` : ""}
            </h2>
            <DialogPrimitive.Close asChild>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex max-h-[calc(75vh-120px)] overflow-y-auto">
            <div className="flex-1 p-5 space-y-3">
              <Input
                placeholder="Draft name...."
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleCreate();
                  if (e.key === "Escape") onClose();
                }}
                autoFocus
                className="border-0 border-b border-gray-200 rounded-none shadow-none px-0 focus-visible:ring-0 focus-visible:border-gray-400 text-base"
              />

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <ProseMirrorEditor
                  initialContent={draftDescription}
                  mentionableMembers={mentionableMembers}
                  onBlur={setDraftDescription}
                  placeholder="Enter draft description..."
                  className="min-h-[100px]"
                  editable={true}
                />
              </div>
            </div>

            <div className="w-[200px] p-4 space-y-2.5 ">
              {!projectId && (
                <Popover open={isProjectOpen} onOpenChange={setIsProjectOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-500 hover:border-gray-300 transition-colors">
                      {project ? (
                        <span className="truncate">{project.name}</span>
                      ) : (
                        <span className="text-red-500">Select Project</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="max-h-60 overflow-y-auto">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsProjectOpen(false);
                            setSelectedStatus(undefined);
                            setSelectedPriority(undefined);
                            setSelectedAssignee(undefined);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm",
                            selectedProjectId === p.id && "bg-blue-50 text-blue-600 font-medium"
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-500 hover:border-gray-300 transition-colors">
                    {selectedStatusOption ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: selectedStatusOption.color }}
                        />
                        <span className="truncate">{selectedStatusOption.label}</span>
                      </span>
                    ) : (
                      "Status"
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  {taskStatusConfigs.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-2">Loading statuses...</p>
                  ) : (
                    taskStatusConfigs.map((config) => (
                      <button
                        key={config._id}
                        onClick={() => {
                          setSelectedStatus(config.value);
                          setIsStatusOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-500 hover:border-gray-300 transition-colors">
                    {selectedPriorityOption ? (
                      <span className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selectedPriorityOption.color }} />
                        <span className="truncate">{selectedPriorityOption.label}</span>
                      </span>
                    ) : (
                      "Priority"
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  {taskPriorityConfigs.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-gray-400 italic">No priorities configured</p>
                  ) : (
                    taskPriorityConfigs.map((priority) => (
                      <button
                        key={priority._id}
                        onClick={() => {
                          setSelectedPriority(priority.value);
                          setIsPriorityOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 text-sm"
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: priority.color }} />
                        <span style={{ color: priority.color }}>{priority.label}</span>
                      </button>
                    ))
                  )}
                </PopoverContent>
              </Popover>

              <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-500 hover:border-gray-300 transition-colors">
                    {assignedMember ? (
                      <span className="flex items-center gap-2">
                        <Avatar
                          name={assignedMember.name}
                          src={getProfilePictureUrl(assignedMember.avatar)}
                        />
                        <span className="truncate">{assignedMember.name}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Assignee</span>
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  {members.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => {
                        setSelectedAssignee(member.userId);
                        setIsAssigneeOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm"
                    >
                      <Avatar
                        name={member.name}
                        src={getProfilePictureUrl(member.avatar)}
                      />
                      {member.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-500 hover:border-gray-300 transition-colors flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        if (endDate && endDate < date) {
                          setEndDate(undefined);
                        }
                      }
                      setIsStartCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-sm text-gray-500 hover:border-gray-300 transition-colors flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{endDate ? format(endDate, "MMM d, yyyy") : "Due Date"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setIsEndCalendarOpen(false);
                    }}
                    disabled={(date) => (startDate ? date < new Date(new Date(startDate).setHours(0, 0, 0, 0)) : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-200 flex justify-end bg-white">
            <Button
              onClick={handleCreate}
              disabled={!draftName.trim() || !selectedProjectId}
              className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Done
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
