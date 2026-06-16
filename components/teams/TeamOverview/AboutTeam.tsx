'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '../../rich-text-editor'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Hash, Plus, SquareUser, User, ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useProfileStore } from "@/stores/profile-store";
import { ProseMirrorEditor } from '@/components/proseMirror/ProseMirrorEditor'
import LabelManager, { Label } from '../LabelManager'
import { useCallback } from 'react'
import { debounce } from 'lodash'
import { useWorkspaceStore } from '@/stores/workspace-store'
import PlusLabelManager from './PlusLabelManager'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface AboutTeamProps {
  teamDescription?: string
  teamName?: string
  teamOwner?: {
    name?: string;
    avatar?: string | null;
    profilePicture?: string | null;
    profilePictureUrl?: string | null;
  }
  teamPicture?: string

  onDescriptionChange?: (description: string) => void
  onNameChange?: (value: string) => void
  onIdentifierChange?: (value: string) => void
  onOwnerChange?: (value: string) => void
  teamLabels?: (string | Label)[]  // API may return IDs (strings) or full Label objects
}

export default function AboutTeam({
  teamDescription = '',
  teamName = '',
  teamOwner = {},
  teamPicture = '',
  onDescriptionChange,
  onNameChange,
  onIdentifierChange,
  onOwnerChange,
  teamLabels = [] as (string | Label)[],
}: AboutTeamProps) {
  // console.log("AboutTeam received teamOwner:", teamOwner);
  const [content, setContent] = useState<string>(teamDescription)
  const [charCount, setCharCount] = useState(0);
  const [localLabels, setLocalLabels] = useState<Label[]>([]);
  const [showLabelManager, setShowLabelManager] = useState(false);

  // Collapsible sections state
  const [isTeamDetailsExpanded, setIsTeamDetailsExpanded] = useState(true);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);
  const [isAboutTeamExpanded, setIsAboutTeamExpanded] = useState(false);

  const { user: profile, fetchUserProfile } = useProfileStore();
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const fetchLabels = useWorkspaceStore(state => state.fetchLabels);
  const fetchWorkspaceMembers = useWorkspaceStore(state => state.fetchWorkspaceMembers);
  const workspaceMembers = useWorkspaceStore(state => state.workspaceMembers);
  const workspaceId = currentWorkspace?.id;
  // All workspace labels — used as the pool to select from
  const allWorkspaceLabels = currentWorkspace?.labels || [];

  const userName = profile?.name || "User";

  const mentionableMembers = workspaceMembers.map(m => ({
    id: m.userId,
    name: m.name,
    avatar: m.avatar || m.profilePicture || ''
  }));

  // Fetch workspace labels and members on mount
  useEffect(() => {
    if (workspaceId) {
      fetchLabels(workspaceId as string);
      fetchWorkspaceMembers(workspaceId as string);
    }
  }, [workspaceId, fetchLabels, fetchWorkspaceMembers]);

  // Resolve team label IDs (string) or objects against workspace labels
  useEffect(() => {
    if (!teamLabels.length) {
      setLocalLabels([]);
      return;
    }
    const resolved = teamLabels
      .map(l => {
        if (typeof l === 'string') {
          // API returned a label ID — look it up in workspace labels
          return allWorkspaceLabels.find(wl => wl.id === l) || null;
        }
        // Already a full label object
        return (l?.id && l?.name && l?.color) ? l : null;
      })
      .filter(Boolean) as Label[];
    setLocalLabels(resolved);
  }, [teamLabels, allWorkspaceLabels]);

  const getTextLength = (html: string): number => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent?.trim().length || 0
  }

  const handleContentChange = useCallback(
    debounce((newContent: string) => {
      setContent(newContent)
      setCharCount(getTextLength(newContent))
      onDescriptionChange?.(newContent)
    }, 150), // ✅ 300ms debounce
    [onDescriptionChange]
  )

  useEffect(() => {
    if (teamDescription) {
      setContent(teamDescription)
      setCharCount(getTextLength(teamDescription))
    }
  }, [teamDescription])

  const getIdentifier = (name?: string) => {
    if (!name) return ""
    return name.substring(0, 3).toUpperCase()
  }

  const getInitials = (name?: string) => {
    if (!name) return "T"
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  const owner = teamOwner

  const ownerImage = owner?.avatar || "";

  const ownerInitials = getInitials(owner?.name || userName)

  const handleLabelsChange = (updatedLabels: Label[]) => {
    setLocalLabels(updatedLabels);
    // TODO: persist to team via API if needed
  };

  return (
    <TooltipProvider>
      <div data-testid="about-team-container" className="w-full mb-4 space-y-4">

        {/* Team Details Section */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsTeamDetailsExpanded(!isTeamDetailsExpanded)}
          >
            <h3 className="text-sm font-semibold">Team Details</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 pointer-events-none"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isTeamDetailsExpanded ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>

          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden space-y-3",
            isTeamDetailsExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
          )}>
            {/* Team Name */}
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                <SquareUser className="h-4 w-4" />
                Team Name
              </label>
              <span className="text-xs font-medium text-foreground truncate max-w-[150px]">
                {teamName || ""}
              </span>
            </div>

            {/* Team Identifier */}
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                <Hash className="h-4 w-4" />
                Team Identifier
              </label>
              <span className="text-xs font-medium text-foreground truncate max-w-[150px]">
                {getIdentifier(teamName)}
              </span>
            </div>

            {/* Team Owner */}
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                <User className="h-4 w-4" />
                Team Owner
              </label>
              <div className="flex items-center gap-2">
                {ownerImage ? (
                  <img
                    src={ownerImage}
                    alt={owner?.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="bg-muted rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-foreground text-[10px] font-semibold">
                      {ownerInitials}
                    </span>
                  </span>
                )}
                <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                  {owner?.name || userName}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Labels Section */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
          >
            <h3 className="text-sm font-semibold cursor-pointer">Labels</h3>
            <div className="flex items-center gap-1">
              <Popover open={showLabelManager} onOpenChange={setShowLabelManager}>
                <PopoverTrigger asChild>
                  <Button
                    data-testid="aboutteam-add-label-btn"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  data-testid="popover-label-manager"
                  className="p-0 border-0 border-b-[5px] border-primary"
                  align="end"
                  side="bottom"
                >
                  <PlusLabelManager
                    labels={localLabels}
                    allLabels={allWorkspaceLabels}
                    onLabelsChange={handleLabelsChange}
                    showBorder={false}
                  />
                </PopoverContent>
              </Popover>
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
            <div className="flex flex-wrap gap-2 pt-2">
              {localLabels.length > 0 ? (
                localLabels.map((label) => (
                  <span
                    key={label.id}
                    data-testid={`label-badge-${label.id}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No labels</span>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* About this Team Section */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsAboutTeamExpanded(!isAboutTeamExpanded)}
          >
            <h3 className="text-sm font-semibold cursor-pointer">About this Team</h3>
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
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAboutTeamExpanded ? "rotate-180" : "rotate-0")} />
              </Button>
            </div>
          </div>

          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isAboutTeamExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none !mt-0"
          )}>
            <ProseMirrorEditor
              data-testid="editor-team-description"
              initialContent={teamDescription || ""}
              mentionableMembers={mentionableMembers}
              onBlur={handleContentChange}
              placeholder="Write something about the team..."
              className="w-full h-full"
              editable={true}
            />
          </div>
        </div>

      </div>
    </TooltipProvider>
  )
}
