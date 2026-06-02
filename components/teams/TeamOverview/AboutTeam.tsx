'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '../../rich-text-editor'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Hash, Plus, SquareUser, User } from 'lucide-react'
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

interface AboutTeamProps {
  teamDescription?: string
  teamName?: string
  teamOwner?: {
    name?: string
    avatar?: string | null;
    profilePicture?: string | null
    profilePictureUrl?: string | null
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
      <div data-testid="about-team-container" className="w-full mb-4">

        {/* Team Info Grid */}
        <div className="grid grid-cols-[24px_180px_1fr] gap-y-4 items-center mb-6 px-2">

          {/* Team Name */}
          <SquareUser className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Team Name
          </h3>
          <p className="text-xs font-medium text-foreground truncate">
            {teamName || ""}
          </p>

          {/* Team Identifier */}
          <Hash className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Team Identifier
          </h3>
          <p className="text-xs font-medium text-foreground truncate">
            {getIdentifier(teamName)}
          </p>

          {/* Team Owner */}
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Team Owner
          </h3>
          <p className="text-xs font-medium text-foreground truncate">
            {ownerImage ? (
              <img
                src={ownerImage}
                alt={owner?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-foreground text-xs font-semibold">
                  {ownerInitials}
                </span>
              </span>
            )}

          </p>

        </div>

        <div className="grid grid-cols-[180px_1fr] gap-y-2 items-start mb-6 px-0">

          {/* Row 1: Label + Plus */}
          <h3 className="font-semibold text-sm text-foreground">Labels</h3>

          <div className="flex justify-end">
            <Popover open={showLabelManager} onOpenChange={setShowLabelManager}>
              <PopoverTrigger asChild>
                <button
                  data-testid="aboutteam-add-label-btn"
                  type="button"
                  className="p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                data-testid="popover-label-manager"
                className="p-0"
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
          </div>

          {/* Row 2: Labels list */}

          <div className="flex flex-wrap gap-2">
            {localLabels.length > 0 &&
              localLabels.map((label) => (
                <span
                  key={label.id}
                  data-testid={`label-badge-${label.id}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
          </div>
        </div>

        {/* ------------------ Team Description ------------------ */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm text-foreground">About this Team</h3>
        </div>
        <ProseMirrorEditor
          data-testid="editor-team-description"
          initialContent={teamDescription || ""}
          mentionableMembers={mentionableMembers}
          onBlur={handleContentChange}
          placeholder="Write something about the team..."
          className="w-full h-full"
          editable={true}
        />

        {charCount > 0 && (
          <div className="flex justify-end mt-0">
            <Badge variant="secondary" className="text-xs">
              {charCount} chars
            </Badge>
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}
