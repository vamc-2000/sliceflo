'use client'

import React, { useEffect, useState } from 'react'
import { X, Image, ChevronDown, Users, Plus, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import LabelManager from './LabelManager'
import { Team, Label, CreateTeamRequest, TeamApiResponse } from '@/types/teams.types'
import { teamsApi } from '@/lib/api/teams.api'
import { useTeamStore } from '@/stores/teams-store'
import { uploadIcon, uploadFile, putUpload } from '@/lib/api/uploads-api'
import ColorIconPicker, { IconData, iconLibrary } from '@/components/ColorIconPicker'
// import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { toast } from '../ui/sonner'

interface CreateNewTeamInlineProps {
  initialStep?: 'setup' | 'preferences' | 'invite'
  mode?: 'create' | 'edit'
  onComplete?: () => void
  onBack?: () => void
  onDelete?: () => void
  teamId?: string
  teamData?: Team
  spacing?: 'compact' | 'normal'
}

export const CreateNewTeam: React.FC<CreateNewTeamInlineProps> = ({
  onComplete,
  onBack,
  onDelete,
  mode = 'create',
  teamId,
  teamData: passedTeamData,
  spacing,
}) => {
  const router = useRouter()

  const { fetchTeams, deleteTeam } = useTeamStore();
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const fetchLabels = useWorkspaceStore(state => state.fetchLabels);
  const addLabel = useWorkspaceStore(state => state.addLabel);
  const workspaceId = currentWorkspace?.id;
  const storeLabels = currentWorkspace?.labels || [];

  // Local state management (no Zustand store)
  const [localTeamName, setLocalTeamName] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.name || '') : ''
  )
  const [localIdentifier, setLocalIdentifier] = useState('')

  const [teamDescription, setTeamDescription] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.description || '') : ''
  )

  const isDeleteActive = mode === 'edit'

  const [teamStatus, setTeamStatus] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.teamStatus || false) : false
  )
  const [teamType, setTeamType] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.teamType || 'Private') : 'Private'
  )
  const [timezone, setTimezone] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.timezone || '') : ''
  )

  const [localLabels, setLocalLabels] = useState<Label[]>([]);

  const [approveRequests, setApproveRequests] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.approveRequests || 'Me') : 'Me'
  )
  const [editTeamPage, setEditTeamPage] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.editTeamPage || 'Me') : 'Me'
  )
  const [editPrivacy, setEditPrivacy] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.editPrivacy || 'Me') : 'Me'
  )

  const [inviteMembersApproval, setInviteMembersApproval] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.inviteMembersApproval || false) : false
  )
  const [inviteGuestsApproval, setInviteGuestsApproval] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.inviteGuestsApproval || false) : false
  )
  const [adminsOnlyRemoval, setAdminsOnlyRemoval] = useState(
    mode === 'edit' && passedTeamData ? (passedTeamData.adminsOnlyRemoval || false) : false
  )
  // const [teamIcon, setTeamIcon] = useState<string | null>(
  //   mode === 'edit' && passedTeamData ? passedTeamData.icon || null : null
  // )
  // const [teamIconType, setTeamIconType] = useState<'icon' | 'file'>('icon')
  const [teamIcon, setTeamIcon] = useState<string | null>(
    mode === 'edit' && passedTeamData && passedTeamData.icon
      ? (
        passedTeamData.icon.type === 'file'
          ? passedTeamData.icon.image ?? null
          : passedTeamData.icon.name ?? null
      )
      : null
  )

  const [teamIconType, setTeamIconType] = useState<'icon' | 'file'>(
    mode === 'edit' && passedTeamData && passedTeamData.icon
      ? passedTeamData.icon.type
      : 'icon'
  )
  const [isExiting, setIsExiting] = useState(false);

  const [teamIconId, setTeamIconId] = useState<string | null>(null) // Store API upload ID
  const [selectedIconData, setSelectedIconData] = useState<IconData | null>(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [membershipDropdownOpen, setMembershipDropdownOpen] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null);

  const timezones = [
    "GMT+5:30 - India Standard Time - Kolkata",
    "(UTC-12:00) International Date Line West",
    "(UTC-11:00) Coordinated Universal Time-11",
    "(UTC-10:00) Hawaii",
    "(UTC-09:00) Alaska",
    "(UTC-08:00) Pacific Time (US & Canada)",
    "(UTC-07:00) Mountain Time (US & Canada)",
    "(UTC-06:00) Central Time (US & Canada)",
    "(UTC-05:00) Eastern Time (US & Canada)",
    "(UTC+00:00) London, Dublin, Edinburgh",
    "(UTC+01:00) Berlin, Paris, Rome, Madrid",
    "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
  ]

  useEffect(() => {
    if (localTeamName.trim()) {
      const identifier = localTeamName.slice(0, 3).replace(/[^a-zA-Z]/g, '').toUpperCase();
      setLocalIdentifier(identifier);
    }
  }, []);  // Runs once on mount (empty deps)

  useEffect(() => {
    if (workspaceId) {
      fetchLabels(workspaceId as string);
    }
  }, [workspaceId]);


  // NOTE: localLabels = user's currently *selected* labels for this team
  // It should NOT be synced from storeLabels (which are ALL workspace labels)


  // For edit mode initial load:
  useEffect(() => {
    if (mode === 'edit' && passedTeamData?.labels) {
      setLocalLabels(passedTeamData.labels.filter((l: any) => l?.id && l?.name && l?.color));
    }
  }, [mode, passedTeamData]);

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setLocalTeamName(name)

    const identifier = name.slice(0, 3).replace(/\s/g, '').toUpperCase()
    setLocalIdentifier(identifier)
  }

  // Handle icon upload
  const handleIconUpload = async (file: File): Promise<{ id: string; url?: string }> => {
    try {
      // Step 1: Get presigned URL
      const uploadResponse = await uploadFile(file);

      return {
        id: uploadResponse.id,
        url: uploadResponse.url,
      };
    } catch (error) {
      console.error('Icon upload error:', error);
      throw error;
    }
  };

  // Handle icon selection
  const handleIconSelect = (iconData: IconData) => {
    setSelectedIconData(iconData);
    setTeamIconType(iconData.type);

    if (iconData.type === 'icon') {
      setTeamIcon(iconData.icon ?? null);
      setTeamIconId(iconData.iconId ?? null);
      setImageFile(null); // Clear image file
    } else {
      setTeamIcon(iconData.image ?? null);
      setTeamIconId(iconData.imageId ?? null);
      // ColorIconPicker should pass File via onUpload callback, not IconData.image
      setImageFile(null); // Will be set via handleIconUpload
    }
  };

  const handleLabelsChange = async (updatedLabels: Label[]) => {
    // Optimistically update local UI
    setLocalLabels(updatedLabels);

    if (!workspaceId) return;

    // Identify truly new labels (the ones with 'temp-' prefix from LabelManager)
    const newLabelsToCreate = updatedLabels.filter(l => l.id.startsWith('temp-'));

    if (newLabelsToCreate.length === 0) return;

    const labelsWithRealIds = [...updatedLabels];

    for (const tempLabel of newLabelsToCreate) {
      try {
        const createdLabel = await addLabel(workspaceId, {
          name: tempLabel.name,
          color: tempLabel.color
        });

        // Find the temp label in our local copy and replace its ID
        const index = labelsWithRealIds.findIndex(l => l.id === tempLabel.id);
        if (index !== -1) {
          labelsWithRealIds[index] = createdLabel;
        }
      } catch (err) {
        console.error("Failed to create label:", err);
      }
    }

    // Update local labels with real IDs
    setLocalLabels(labelsWithRealIds);
  };

  const handleCreateTeam = async () => {
    if (!isFormValid()) return
    setIsSaving(true)
    setError(null)

    try {
      // Handle icon upload if needed (for icons without ID)
      let finalIconId = teamIconId
      let finalIcon = teamIcon

      if (selectedIconData && selectedIconData.type === 'icon' && !teamIconId) {
        const iconUploadResult = await uploadIcon({
          icon: {
            name: selectedIconData.icon || 'default',
            color: selectedIconData.color,
          },
        })
        finalIconId = iconUploadResult.id
      }

      const createPayload: CreateTeamRequest = {
        name: localTeamName,
        iconId: finalIconId || teamIcon,
        icon: finalIcon,
        description: teamDescription,
        members: (mode === "edit" && passedTeamData ? passedTeamData.teamMembers : [])
          .map(m => ({
            userId: m.id,
            role: m.role as "admin" | "member" | "guest" || "member"
          })),
        labels: localLabels.map(l => l.id),
        timezone,
        // slug: localIdentifier,
      }

      console.log('Create team payload:', JSON.stringify(createPayload, null, 2));

      let result: TeamApiResponse | null = null
      let createdTeamId: string | null = null;

      if (mode === "edit" && passedTeamData?.id) {
        result = await teamsApi.updateTeam(passedTeamData.id, createPayload);  // Assume updateTeam exists
        toast("success", { title: "Team updated successfully" });

      } else {
        // CREATE TEAM
        result = await teamsApi.createTeam(createPayload)
        // const teamId = (result as any).id || result.team?.id;
        createdTeamId = (result as any).id || result.team?.id;
        // console.log("API Response:", result)
        // toast.success("Team created successfully");
        toast("success", {
          title: "Team created",
          primaryAction: {
            label: "View",
            onClick: () => {
              router.push(`/teams/${encodeURIComponent(createdTeamId!)}`);
            },
          },
        });
      }

      setIsSaving(false)

      await fetchTeams();

      if (onComplete) {
        onComplete()
      } else {
        if (!result) {
          // console.error("Create Team API returned null")
          setError("Team created but response missing. Check manually.")
          return
        }

        // API returns team directly with .id
        const teamId = createdTeamId || (result as any).id || result.team?.id;
        if (!teamId) {
          // console.error("No team ID found in response:", result)
          setError("Team created but ID missing from response.")
          return
        }

        // console.log("Navigating to team:", teamId)
        setTimeout(() => {
          router.push(`/teams/${encodeURIComponent(teamId)}`);
        }, 800); // 0.8s delay for smooth UX
      }
    } catch (err: any) {
      // console.error("Create error:", err);

      if (err.response) {
        const message =
          err.response.data?.message || "Something went wrong";

        // 🔥 Sonner toast
        toast("error", { title: message });

        setError(message);
      } else if (err.request) {
        toast("error", { title: "No response from server. Please try again." });
        setError("No response from server.");
      } else {
        toast("error", { title: err.message || "Unexpected error occurred." });
        setError(err.message);
      }

      setIsSaving(false);
    }
  }

  const isFormValid = () => {
    return localTeamName.trim() &&
      (teamIconId || !imageFile); // Allow submission without icon
  };

  const handleDeleteTeam = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(); // Wait for deletion if it's a promise
      } catch (err) {
        setIsDeleting(false); // Only reset on error, or if parent doesn't unmount
      }
    }
  };

  const iconObj = teamIcon ? iconLibrary.find(i => i.name === teamIcon) : null

  const renderIcon = () => {
    if (uploadingIcon) {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )
    }

    if (!teamIcon) {
      return <Image size={20} className="text-[#C7C7CC]" />
    }

    if (teamIconType === 'file') {
      return <img src={teamIcon} alt="Team Icon" className="w-full h-full object-cover rounded" />
    }

    // Render icon from library
    const iconObj = iconLibrary.find(i => i.name === teamIcon)
    if (iconObj) {
      const IconComponent = iconObj.icon;
      if (!IconComponent) return <span>{teamIcon}</span>;
      return <IconComponent size={28} color={selectedIconData?.color || '#6366f1'} />
    }

    return <span className="text-sm">{teamIcon}</span>
  }

  // Temporary debug — add before your return()
  if (!LabelManager) {
    console.error('LabelManager is undefined!');
  }

  return (
    // <div className="bg-white flex flex-col w-full">
    <div
      data-testid="create-new-team-container"
      className={cn(
        "bg-background text-foreground flex flex-col w-full transition-all duration-300",
        isExiting && "opacity-0 scale-95"
      )}
    >
      <div className="flex-1 flex flex-col ">
        <div
          className={cn(
            "w-full px-6 bg-background",
            spacing === 'compact' ? 'py-1' : 'py-6'
          )}
        >
          <div className=" space-y-2">

            {/* Team Info Section */}
            <div className="rounded-lg p-4 bg-muted border border-border">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Icon</label>
                  
                  <button
                    type="button"
                    data-testid="team-icon-picker"
                    onClick={() => setShowColorPicker(true)}
                    className="w-10 h-10 bg-background border border-input rounded-md flex items-center justify-center hover:bg-muted transition-colors overflow-hidden cursor-pointer text-foreground"
                    disabled={uploadingIcon}
                  >
                    {renderIcon()}
                  </button>
                  {uploadError && (
                    <p className="text-red-500 text-xs mt-1">{uploadError}</p>
                  )}
                  {uploadError && (
                    <p className="text-red-500 text-xs mt-1">{uploadError}</p>
                  )}
                </div>

                <ColorIconPicker
                  isOpen={showColorPicker}
                  onClose={() => setShowColorPicker(false)}
                  onSelect={handleIconSelect}
                  currentIcon={teamIcon}
                  currentColor={selectedIconData?.color ?? '#6366f1'}
                  currentType={teamIconType}
                  onUpload={async (file: File) => {  // File comes from file input
                    // setImageFile(file); // Store File reference
                    setUploadingIcon(true);
                    setUploadError(null);
                    try {
                      const result = await handleIconUpload(file);
                      setImageFile(file);
                      setTeamIconId(result.id);
                      if (result.url) {
                        setTeamIcon(result.url);
                      }
                      return result;
                    } catch (error) {
                      setUploadError('Upload failed. Please try again.');
                      throw error;
                    } finally {
                      setUploadingIcon(false);
                    }
                  }}
                />

                <div className="w-80">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Team name</label>
                  <Input
                    type="text"
                    value={localTeamName}
                    onChange={handleTeamNameChange}
                    placeholder="e.g. Marketing"
                    data-testid="input-team-name"
                    className="h-10 bg-background placeholder:text-muted-foreground"
                  />
                </div>

                <div className="w-80">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Team identifier</label>
                  <Input
                    type="text"
                    value={localIdentifier}
                    onChange={(e) => setLocalIdentifier(e.target.value)}
                    placeholder="e.g. MAR"
                    data-testid="input-team-identifier"
                    className="h-10 bg-background uppercase"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Label Manager */}
            <LabelManager
              labels={localLabels}
              allLabels={storeLabels}
              onLabelsChange={handleLabelsChange}
              title="Labels"
              description="Create, tag and filter teams instantly so your team spends less time searching and more time executing"
              borderColor="#001F3F"
              dropdownWidth="w-[350px]"
            />

            {/* Setup a Timezone */}
            <div className="border border-border border-l-4 border-l-primary rounded-lg p-4 bg-card">
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-foreground mb-1">Setup a Timezone</h3>
                  <p className="text-xs text-muted-foreground leading-snug w-xl">
                    Sync your team's clock. Set the timezone where most members work. All deadlines, cycles, and notifications will align to this timezone
                  </p>
                </div>
                <div className="w-87.5">
                  <Select value={timezone} onValueChange={setTimezone} data-testid="select-team-timezone">
                    <SelectTrigger 
                      data-testid="select-trigger-timezone"
                      className="w-full border-input bg-background rounded text-foreground"
                    >
                      <SelectValue placeholder="GMT+5:30 - India Standard Time - Kolkata" />
                    </SelectTrigger>
                    <SelectContent className="w-87.5">
                      <SelectGroup>
                        {timezones.map((tz, index) => (
                          <SelectItem key={index} value={tz} data-testid={`select-item-timezone-${index}`}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Select team privacy */}
            <div className="border border-border border-l-4 border-l-primary rounded-lg p-4 bg-card">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-foreground mb-1">Select team&apos;s privacy</h3>
                  <p className="text-xs text-muted-foreground leading-snug w-xl">
                    Choose who sees what. Private teams are visible only to members and admins. Only admins and team owners can invite new users to a private team. Public teams are open to the entire workspace. Match visibility to your need for confidentiality or transparency.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-87.5">
                  <Button
                    data-testid="team-privacy-private-btn"
                    variant="ghost"
                    onClick={() => setTeamType('Private')}
                    className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${teamType === 'Private'
                      ? 'border-b-2 border-b-primary text-foreground font-semibold'
                      : 'text-muted-foreground'
                      }`}
                  >
                    Private
                  </Button>
                  <Button
                    data-testid="team-privacy-public-btn"
                    variant="ghost"
                    onClick={() => setTeamType('Public')}
                    className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${teamType === 'Public'
                      ? 'border-b-2 border-b-primary text-foreground font-semibold'
                      : 'text-muted-foreground'
                      }`}
                  >
                    Public
                  </Button>
                </div>
              </div>
            </div>

            {/* Team accessibility & permissions */}
            <div className="border border-border border-l-4 border-l-primary rounded-lg p-4 bg-card">
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => setMembershipDropdownOpen(!membershipDropdownOpen)}
                data-testid="permissions-toggle-row"
              >
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-foreground mb-1">Team accessibility & permission settings</h3>
                  <p className="text-xs text-muted-foreground leading-snug w-162.5">
                    Control who can act. Define permissions for editing team details, managing privacy, approving join requests, and restricting membership. Delegate authority without losing alignment.
                  </p>
                </div>
                <Button
                  data-testid="membership-dropdown-btn"
                  variant="ghost"
                  size="icon"
                >
                  <ChevronDown
                    size={20}
                    className={`text-muted-foreground transition-transform duration-200 ${membershipDropdownOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </Button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${membershipDropdownOpen ? "max-h-250 opacity-100 mt-2 pt-2" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="pt-3 border-t border-border space-y-4">
                  {/* <div className="mt-6 pt-6 border-t border-gray-200 space-y-6"> */}
                  {/* Who can approve requests */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Who can approve requests to join this team?</span>
                    <div className="flex gap-4 w-87.5">
                      <Button
                        data-testid="approve-requests-me-btn"
                        variant="ghost"
                        onClick={() => setApproveRequests('Me')}
                        className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${approveRequests === 'Me'
                          ? 'border-b-2 border-b-primary text-foreground font-semibold'
                          : 'text-muted-foreground'
                          }`}
                      >
                        Me
                      </Button>
                      <Button
                        data-testid="approve-requests-all-btn"
                        variant="ghost"
                        onClick={() => setApproveRequests('All team members')}
                        className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${approveRequests === 'All team members'
                          ? 'border-b-2 border-b-primary text-foreground font-semibold'
                          : 'text-muted-foreground'
                          }`}
                      >
                        All team members
                      </Button>
                    </div>
                  </div>

                  {/* Who can edit team page */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Who can edit the team page?</span>
                    <div className="flex gap-4 w-87.5">
                      <Button
                        data-testid="edit-team-page-me-btn"
                        variant="ghost"
                        onClick={() => setEditTeamPage('Me')}
                        className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${editTeamPage === 'Me'
                          ? 'border-b-2 border-b-primary text-foreground font-semibold'
                          : 'text-muted-foreground'
                          }`}
                      >
                        Me
                      </Button>
                      <Button
                        data-testid="edit-team-page-all-btn"
                        variant="ghost"
                        onClick={() => setEditTeamPage('All team members')}
                        className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${editTeamPage === 'All team members'
                          ? 'border-b-2 border-b-primary text-foreground font-semibold'
                          : 'text-muted-foreground'
                          }`}
                      >
                        All team members
                      </Button>
                    </div>
                  </div>

                  {/* Who can edit privacy level */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Who can edit the team privacy level and delete the team?</span>
                    <div className="flex gap-4 w-87.5">
                      <Button
                        data-testid="edit-privacy-me-btn"
                        variant="ghost"
                        onClick={() => setEditPrivacy('Me')}
                        className={`flex-1 rounded border border-input bg-background transition-all duration-200 ${editPrivacy === 'Me'
                          ? 'border-b-2 border-b-primary text-foreground font-semibold'
                          : 'text-muted-foreground'
                          }`}
                      >
                        Me
                      </Button>
                      <Button
                        data-testid="edit-privacy-all-btn"
                        variant="ghost"
                        onClick={() => setEditPrivacy('All team members')}
                        className={`flex-1 rounded-sm border border-input bg-background transition-all duration-200 ${editPrivacy === 'All team members'
                          ? 'border-b-2 border-b-primary text-foreground font-semibold'
                          : 'text-muted-foreground'
                          }`}
                      >
                        All team members
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-border"></div>

                  {/* Invitations section */}
                  <div className="space-y-0">
                    <h4 className="font-medium text-sm text-muted-foreground pb-0">Invitations</h4>
                    <div className="flex justify-between items-center space-y-1">
                      <span className="text-xs text-muted-foreground">New members invited to this team must be approved by a team admin</span>
                      <Switch
                        checked={inviteMembersApproval}
                        onCheckedChange={setInviteMembersApproval}
                        className="w-8 h-4"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">New guests invited to this team must be approved by a team admin</span>
                      <Switch
                        checked={inviteGuestsApproval}
                        onCheckedChange={setInviteGuestsApproval}
                        className="w-8 h-4"
                      />
                    </div>
                  </div>

                  {/* Removals section */}
                  <div className="space-y-0">
                    <h4 className="font-medium text-sm text-muted-foreground pb-0">Removals</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Only team admins can remove members or guests from this team</span>
                      <Switch
                        checked={adminsOnlyRemoval}
                        onCheckedChange={setAdminsOnlyRemoval}
                        data-testid="switch-admins-only-removal"
                        className="w-8 h-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team status - Endorsed */}
            <div className="border border-border border-l-4 border-l-primary rounded-lg p-4 bg-card">
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-6">
                  <h3 className="font-semibold text-sm text-foreground mb-0">Team status</h3>
                  <p className="text-xs text-muted-foreground leading-snug w-162.5">
                    Highlight trusted teams. Admins can endorse teams to signal strategic importance. Endorsed teams appear prominently, helping everyone navigate to the right collaboration hubs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Endorsed</span>
                  <Switch
                    checked={teamStatus}
                    onCheckedChange={setTeamStatus}
                    data-testid="switch-team-status-endorsed"
                    className="w-8 h-4"
                  />
                </div>
              </div>
            </div>

            {/* Delete Team Section */}
            <div
              className={cn(
                "border border-l-4 rounded-lg p-4 transition-all duration-200",
                isDeleteActive
                  ? "border-border border-l-red-500 bg-red-500/10"
                  : "border-border border-l-muted-foreground bg-muted text-muted-foreground/60"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={cn(
                    "font-semibold text-sm mb-0 transition-colors duration-200",
                    isDeleteActive ? "text-red-600 dark:text-red-400" : "text-muted-foreground/60"
                  )}>
                    Delete team
                  </h3>
                  <p className={cn(
                    "text-xs transition-colors duration-200",
                    isDeleteActive ? "text-red-500 dark:text-red-400/80" : "text-muted-foreground/60"
                  )}>
                    Delete this team
                  </p>
                </div>
                <Button
                  data-testid="delete-team-btn"
                  onClick={handleDeleteTeam}
                  disabled={!isDeleteActive || isSaving || isDeleting}
                  variant={isDeleteActive ? 'destructive' : 'ghost'}
                  className={cn(
                    !isDeleteActive && 'cursor-not-allowed text-muted-foreground/60',
                    isDeleting && 'animate-pulse'
                  )}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-x-4 items-center pt-2">
              <Button
                data-testid="cancel-team-btn"
                variant="outline"
                onClick={onBack}
                className='w-32 border-input text-muted-foreground hover:bg-muted transition-colors'
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={!isFormValid() || isSaving || isDeleting}
                data-testid="btn-save-team"
                className={`w-32 flex items-center justify-center gap-2 text-primary-foreground ${isFormValid()
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground'
                  }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  mode === 'edit' ? 'Update Team' : 'Create Team'
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
