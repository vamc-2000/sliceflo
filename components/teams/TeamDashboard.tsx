'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Users, House, Ellipsis, Flag, Settings, MessageSquare } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import TeamMembersPage from './TeamMembersPage'
import { Trash2 } from 'lucide-react'
import { useTeamStore } from '@/stores/teams-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { Separator } from '../ui/separator'
import TeamAllWork from './TeamAllWork'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import TeamStandUpCall from './TeamStandUpCall'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import TeamOverviewShell from './TeamOverviewShell'
import { iconLibrary } from '@/components/ColorIconPicker'
import { CreateNewTeam } from './CreateNewTeam'
import { BsPersonRaisedHand } from "react-icons/bs";
import DiscussionPage from '../disucssions/DiscussionPage'
import { toast } from 'sonner'
import { useProjectsStore } from '@/stores/projects-store'
import { Loader } from '../Loader'

export const TeamsDashboard: React.FC = () => {
  const teams = useTeamStore(state => state.teams);
  const activeTeamId = useTeamStore(state => state.activeTeamId);
  const fetchTeams = useTeamStore(state => state.fetchTeams);
  const fetchTeamById = useTeamStore(state => state.fetchTeamById);
  const deleteTeam = useTeamStore(state => state.deleteTeam);
  const isStoreLoading = useTeamStore(state => state.loading);
  const { projects, fetchProjects, isLoading: projectsLoading } = useProjectsStore();

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'Overview')

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam, activeTab])

  const router = useRouter();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const teamIdFromUrl = decodeURIComponent(pathname.split("/").pop() ?? "") as string;

  const [ellipsisOpen, setEllipsisOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Derived state from store instead of local state
  const displayTeam = teams.find(t => String(t.id) === String(teamIdFromUrl));
  const teamName = displayTeam ? (displayTeam.name || '') : (isStoreLoading ? 'Loading...' : 'Team not found');

  const teamID = activeTeamId || null;

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  useEffect(() => {
    if (!teamIdFromUrl || teamIdFromUrl === 'teams') return;

    // Fetch in background for freshness, store update will trigger re-render
    fetchTeamById(teamIdFromUrl).catch(error => {
      console.error("❌ FAILED to load team:", error);
    });
  }, [teamIdFromUrl, fetchTeamById]);

  useEffect(() => {
    if (displayTeam && isSwitching) {
      setIsSwitching(false);
    }
  }, [displayTeam, isSwitching]);

  useEffect(() => {
    if (activeTab === "Team Members" && teamIdFromUrl) {
      // Prefetch projects if not already loaded
      if (projects.length === 0) {
        fetchProjects();
      }
      // Ensure team data is fresh
      fetchTeamById(teamIdFromUrl);
    }
  }, [activeTab, teamIdFromUrl, fetchProjects, fetchTeamById, projects.length]);

  const mentionableMembers = useMemo(() => {
    return (displayTeam?.teamMembers ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      profilePictureUrl: m.avatar,
    }))
  }, [displayTeam?.teamMembers]);

  const handleDeleteTeam = async () => {
    if (!teamID) return;

    try {
      await deleteTeam(teamID);  // Use existing deleteTeam
      await fetchTeams();        // Use existing fetchTeams

      // Get fresh teams after delete/fetch
      const freshTeams = useTeamStore.getState().teams;
      const currentIndex = freshTeams.findIndex(t => t.id === teamID);
      const nextTeam = currentIndex !== -1 && currentIndex + 1 < freshTeams.length
        ? freshTeams[currentIndex + 1]
        : freshTeams[0] || null;

      if (nextTeam) {
        router.push(`/teams/${encodeURIComponent(nextTeam.id)}`);
      } else {
        router.push('/teams');
      }

      toast.success(`${teamName} deleted successfully`);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error("Failed to delete team");
    }
  };

  const handleEditModeDelete = async () => {
    if (!displayTeam?.id) return;

    const id = displayTeam.id;

    // Get current teams BEFORE deletion
    const currentTeams = useTeamStore.getState().teams;

    const currentIndex = currentTeams.findIndex(t => t.id === id);

    const nextTeam =
      currentIndex !== -1 && currentIndex + 1 < currentTeams.length
        ? currentTeams[currentIndex + 1]
        : currentTeams[0] || null;

    // ✅ Close modal
    setSettingsOpen(false);

    // ✅ Navigate FIRST (prevents flicker)
    if (nextTeam) {
      setIsSwitching(true);
      setIsExiting(true);

      setTimeout(() => {
        router.replace(`/teams/${encodeURIComponent(nextTeam.id)}`);
      }, 200);

    } else {
      router.replace('/teams');
    }

    // ✅ Delete in background
    deleteTeam(id)
      .then(() => {
        toast.success(`${teamName} deleted successfully.`);
      })
      .catch(() => {
        toast.error('Failed to delete team.');
      });

    // Optional: refresh silently
    fetchTeams();
  };

  return (
    <div
      data-testid="dashboard-teams"
      className={cn(
        "w-full flex flex-col h-full overflow-hidden transition-all duration-300 bg-background text-foreground",
        isExiting && "opacity-0 scale-95"
      )}
    >
      <Breadcrumbs />
      {/* Title & icons row */}
      <div className="flex items-center justify-between py-1.5 bg-background">
        {/* Left group */}
        <div className="flex items-center ml-3">
          {displayTeam ? (
            <TeamAvatar team={displayTeam} teamName={teamName} />
          ) : (
            <div className="w-10 h-10 rounded animate-pulse flex items-center justify-center bg-muted" />
          )}
          <div className="flex flex-col ml-2">
            {teamName === 'Loading...' ? (
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-semibold text-foreground">{teamName}</span>
            )}
          </div>
          {/* <Lock size={18} className="text-gray-600" />
          <Tag size={18} className="text-gray-600" /> */}
          <DropdownMenu open={ellipsisOpen} onOpenChange={setEllipsisOpen}>
            <DropdownMenuTrigger asChild>
              <button
                data-testid={`btn-team-more-menu-${teamIdFromUrl}`}
                className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Ellipsis className="h-5 w-5 text-foreground" strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">

              <DropdownMenuItem
                data-testid={`btn-team-settings-${teamIdFromUrl}`}
                onClick={() => {
                  setSettingsOpen(true);
                  setEllipsisOpen(false);
                }}>
                <Settings className="mr-2 h-4 w-4" />
                Team Settings
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => console.log('Copy Shareable Link')}>
                <span className="mr-2 w-4 h-4">🔗</span>
                Copy Shareable Link
              </DropdownMenuItem> */}
              <DropdownMenuItem
                data-testid={`btn-copy-team-link-${teamIdFromUrl}`}
                onClick={() => {
                  if (displayTeam?.id) {
                    const shareableUrl = `${window.location.origin}/teams/${encodeURIComponent(displayTeam.id)}`;
                    navigator.clipboard.writeText(shareableUrl).then(() => {
                      toast.success('Team link copied!');
                    }).catch((err) => {
                      console.error('Failed to copy:', err);
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = shareableUrl;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.body.removeChild(textArea);
                      toast.success('Shareable link copied to clipboard!');
                    });
                  }
                  setEllipsisOpen(false);
                }}>
                <span className="mr-2 w-4 h-4">🔗</span>
                Copy Shareable Link
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-0" />
              <DropdownMenuItem
                data-testid={`btn-open-delete-team-${teamIdFromUrl}`}
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setDeleteDialogOpen(true)
                  setEllipsisOpen(false)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        {/* Right group */}
        <div className="flex items-center space-x-2 mr-4">
          {/* Overview Button - Standalone */}
          <div className="bg-muted rounded-lg ">
            <Button
              data-testid="btn-tab-overview"
              variant="ghost"
              size="icon"
              onClick={() => handleTabChange('Overview')}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md transition-colors cursor-pointer",
                activeTab === 'Overview'
                  ? 'text-primary-foreground bg-primary shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title='Overview'
            >
              <House className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Button Group */}
          <div className="flex items-center bg-muted rounded-md p-1 gap-1">
            {/* Team Members */}
            <Button
              data-testid="btn-tab-team-members"
              variant="ghost"
              size="icon"
              onClick={() => handleTabChange('Team Members')}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded transition-colors cursor-pointer",
                activeTab === 'Team Members'
                  ? 'text-primary-foreground bg-primary shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
              title='Team Members'
            >
              <Users className="w-4 h-4" />
            </Button>

            {/* All Work */}
            <Button
              data-testid="btn-tab-all-work"
              variant="ghost"
              size="icon"
              onClick={() => handleTabChange('All Work')}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded transition-colors cursor-pointer",
                activeTab === 'All Work'
                  ? 'text-primary-foreground bg-primary shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
              title='All Work'
            >
              <Flag className="w-4 h-4" />
            </Button>

            {/* standup call */}
            <Button
              data-testid="btn-tab-standup-call"
              variant="ghost"
              size="icon"
              onClick={() => handleTabChange('StandupCall')}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded transition-colors cursor-pointer",
                activeTab === 'StandupCall'
                  ? 'text-primary-foreground bg-primary shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
              title='Standup Call'
            >
              <BsPersonRaisedHand className="w-6 h-4" />
            </Button>


            {/* Discussions */}
            <Button
              data-testid="btn-tab-discussions"
              variant="ghost"
              size="icon"
              onClick={() => handleTabChange('Discussions')}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded transition-colors cursor-pointer",
                activeTab === 'Discussions'
                  ? 'text-primary-foreground bg-primary shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
              title='Discussions'
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <Separator />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative bg-background">
        {/* <div className="flex-1 overflow-y-auto flex items-center justify-center"> */}
        {isSwitching || isStoreLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <Loader
              // message="Switching team..."
              size="md"
            />
          </div>
        ) : (
          <>
            {activeTab === 'Overview' && <TeamOverviewShell team={displayTeam} />}
            {activeTab === 'Discussions' && (
              displayTeam ? (
                <DiscussionPage
                  entityType="team"
                  entityId={displayTeam.id}
                  mentionableMembers={mentionableMembers}
                />
              ) : (
                <div className="p-6 text-muted-foreground">Loading discussions…</div>
              )
            )}

            {activeTab === 'Team Members' && <TeamMembersPage teamMembers={displayTeam} />}
            {activeTab === 'StandupCall' && <TeamStandUpCall />}
            {activeTab === 'All Work' && <TeamAllWork />}
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          data-testid={`modal-delete-team-${teamIdFromUrl}`}
          className='border-0 border-b-[5px] border-primary rounded-lg bg-card text-foreground'
        >
          <DialogHeader className='text-center'>
            <DialogTitle className="text-foreground text-center text-lg font-semibold mt-2">
              Are you sure want to delete this team?
            </DialogTitle>
            <Image
              src="/images/teams/Delete.svg"
              alt="Delete Team Illustration"
              width={200}
              height={200}
              className="my-4 mx-auto"
            />
            <DialogDescription className='text-center text-base text-muted-foreground'>
              Deleting this team will remove access everywhere. Once deleted, the team and its members will lose access to all associated projects, tasks, and data.
              Double-check before proceeding to avoid disruptions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              data-testid="btn-delete-team-cancel"
              onClick={() => setDeleteDialogOpen(false)}
              className="mr-2 px-4 py-2 rounded border border-input text-muted-foreground bg-background hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              data-testid="btn-delete-team-confirm"
              onClick={handleDeleteTeam}
              className="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogOverlay
          className="
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
          "
        />
        <DialogContent
          data-testid={`modal-team-settings-${teamIdFromUrl}`}
          className={cn(
            "max-w-6xl! w-full! min-h-[30vh]! h-[80vh]! p-0! overflow-auto border-0 border-b-[5px] border-primary bg-background rounded-lg text-foreground",
            // 🔥 Animation
            "transition-all duration-300 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4"
          )}
        >
          <DialogTitle className="sr-only">
            Team Settings
          </DialogTitle>
          {/* Header */}
          <div className="px-6 pt-4 pb-0 bg-background">
            <button
              data-testid="btn-settings-back"
              onClick={() => setSettingsOpen(false)}
              className="text-sm font-medium text-primary hover:underline hover:text-primary/80"
            >
              ← Back to App
            </button>
          </div>
          {/* Separator */}
          <Separator />

          <div className='p-0 bg-background'>
            {displayTeam && (
              <CreateNewTeam
                mode="edit"
                spacing='compact'
                teamId={displayTeam.id}
                teamData={displayTeam}
                // onComplete={() => setSettingsOpen(false)}
                onComplete={() => {
                  fetchTeamById(displayTeam.id);  // Refresh specific team
                  setSettingsOpen(false);
                }}
                onBack={() => setSettingsOpen(false)}
                // onDelete={() => setSettingsOpen(false)}
                onDelete={handleEditModeDelete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const TeamAvatar: React.FC<{ team: any; teamName: string }> = ({ team, teamName }) => {
  const iconColor = team?.icon?.color || '#3B82F6'; // Default to blue

  const renderTeamIcon = () => {
    // Handle new icon object structure from API
    if (team?.icon?.type === 'file' && team.icon.presignedUrl) {
      // Image URL
      return (
        <Image
          src={team.icon.presignedUrl}
          alt={teamName}
          fill
          className="w-full h-full object-cover rounded-lg"
        />
      )
    }

    if (team?.icon?.type === 'icon' && team.icon.name) {
      // Library icon with name and color
      const iconObj = iconLibrary.find(i => i.name === team.icon.name)
      if (iconObj) {
        const IconComponent = iconObj.icon
        return (
          <div
            className="w-full h-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconColor }}
          >
            <IconComponent
              size={24}
              color="#FFFFFF"
              className="shrink-0"
            />
          </div>
        )
      }
    }

    // Fallback: old string icon
    if (typeof team?.icon === 'string' && team.icon) {
      return (
        <img
          src={team.icon}
          alt={teamName}
          className="w-full h-full object-cover rounded-lg"
        />
      )
    }

    if (team?.iconId) {
      // Fallback for iconId only
      const iconObj = iconLibrary.find(i => i.name === team.iconId)
      if (iconObj) {
        const IconComponent = iconObj.icon
        return (
          <div
            className="w-full h-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconColor }}
          >
            <IconComponent
              size={24}
              color="#FFFFFF"
              className="shrink-0"
            />
          </div>
        )
      }
    }

    // Final fallback: blue background with white "users" icon
    return (
      <div
        className="w-full h-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#3B82F6' }}
      >
        <Users
          size={24}
          color="#FFFFFF"
          className="shrink-0"
        />
      </div>
    )
  }

  return (
    <div
      data-testid={`avatar-team-${teamName}`}
      className="relative w-10 h-10 rounded-lg overflow-hidden border flex items-center justify-center"
    >
      {renderTeamIcon()}
    </div>
  )
}