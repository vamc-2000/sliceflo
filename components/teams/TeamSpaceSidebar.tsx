'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowDownUp,
  Ellipsis,
  Trash2,
  Mail,
  Table2,
  CirclePlus,
  Target,
  Pencil,
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';


interface Team {
  id: string;
  name?: string;
  teamName?: string;
  createdAt?: string;
  icon?: string;
}

interface TeamSpaceSidebarProps {
  allTeams: Team[];
  deleteTeam: (id: string) => void;
  renameTeam: (id: string, newName: string) => void;
  onCreateTeam?: () => void;
}

const TeamSpaceSidebar: React.FC<TeamSpaceSidebarProps> = ({
  allTeams,
  deleteTeam,
  renameTeam,
  onCreateTeam,
}) => {
  const router = useRouter();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortOldest, setSortOldest] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const getTeamName = (team: Team): string => {
    if ('name' in team) return team.name || '';
    if ('teamName' in team) return team.teamName || '';
    return '';
  };

  const filteredTeams = allTeams.filter((team) =>
    getTeamName(team).toLowerCase().includes(searchText.trim().toLowerCase())
  );

  const sortedTeams = [...(isSearching ? filteredTeams : allTeams)].sort((a, b) =>
    sortOldest
      ? new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
      : new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );

  const handleRename = () => {
    if (selectedTeamId && renameValue.trim()) {
      renameTeam(selectedTeamId, renameValue.trim());
      setIsRenaming(false);
      setRenameValue('');
      setSelectedTeamId(null);
    }
  };

  const options = [
    {
      label: 'Rename',
      icon: <Pencil className="w-4 h-4 text-[#002F54]" />,
      action: () => {
        const team = allTeams.find((t) => t.id === selectedTeamId);
        if (team) {
          setRenameValue(getTeamName(team));
          setIsRenaming(true);
          setPopoverOpen(false);
        }
      },
    },
    { isDivider: true },
    {
      label: 'Create Boards',
      icon: <Table2 className="w-4 h-4 text-[#002F54]" />,
      action: () => console.log('Create Boards'),
    },
    {
      label: 'Create Goals',
      icon: <Target className="w-4 h-4 text-[#002F54]" />,
      action: () => console.log('Create Goals'),
    },
    { isDivider: true },
    {
      label: 'Send a message via email',
      icon: <Mail className="w-4 h-4 text-[#002F54]" />,
      action: () => console.log('Send Email'),
    },
    { isDivider: true },
    {
      label: 'Delete Team',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      textColor: 'text-red-500',
      action: () => {
        if (selectedTeamId) {
          deleteTeam(selectedTeamId);
          setPopoverOpen(false);
          setSelectedTeamId(null);
        }
      },
    },
  ];

  useEffect(() => {
    if (allTeams.length === 0) {
      router.push('/team');
    }
  }, [allTeams, router]);

  return (
    <div className="p-3 w-full bg-[#001F3F] text-white relative">
      {/* Rename Dialog */}
      <Dialog open={isRenaming} onOpenChange={(open) => !open && setIsRenaming(false)}>
        <DialogContent className="max-w-sm rounded-lg p-4 bg-white text-gray-800">
          <DialogHeader>
            <DialogTitle>Rename Team</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-3"
            placeholder="Enter new team name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRenaming(false);
                setRenameValue('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </div>
          <DialogClose asChild>
            <button className="absolute top-2 right-2 rounded p-1 hover:bg-gray-200 transition">
              ✕
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Top Controls */}
      <div className="flex justify-between items-center mb-2">
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-[#FFA500] border border-transparent hover:border-[#FFA500]"
          onClick={() => {
            onCreateTeam ? onCreateTeam() : router.push('/team');
          }}
        >
          <CirclePlus className="w-4 h-4" />
          <span className="text-sm text-white">Create New Team</span>
        </Button>

        <div className="flex gap-2">
          <Search
            size={14}
            className="cursor-pointer text-white hover:text-gray-300"
            onClick={() => setIsSearching((prev) => !prev)}
          />
          <ArrowDownUp
            size={14}
            className="cursor-pointer text-white hover:text-gray-300"
            onClick={() => setSortOldest((p) => !p)}
          />
        </div>
      </div>

      {/* Search Input */}
      {isSearching && (
        <input
          autoFocus
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search teams"
          className="w-full bg-[#1a2942] text-white text-sm p-2 rounded placeholder-white/50 mb-2 focus:outline-none"
        />
      )}

      {/* Empty State */}
      {allTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Image src="/assets/Team/TeamEmptys.svg" alt="Empty Team Illustration" width={64} height={64} />
          <p className="mt-3 text-sm font-medium text-white">Your Team is empty</p>
          <p className="text-xs text-white/70">Add Team Members</p>
        </div>
      ) : (
        // Team List
        sortedTeams.map((team) => (
          <div
            key={team.id}
            className="flex justify-between items-center p-2 hover:bg-[#1a2942] cursor-pointer rounded transition-colors"
            onClick={() => {
              const teamName = getTeamName(team);
              router.push(`/team/${encodeURIComponent(teamName)}`);
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                {team.icon ? (
                  <img
                    src={team.icon}
                    alt={`${getTeamName(team)} icon`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span
                  className="text-xs text-white font-medium"
                  style={{ display: team.icon ? 'none' : 'flex' }}
                >
                  {getTeamName(team)?.[0]?.toUpperCase()}
                </span>
              </div>

              <span className="truncate text-sm text-white">{getTeamName(team)}</span>
            </div>

            {/* Options Popover */}
            <Popover open={popoverOpen && selectedTeamId === team.id} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeamId(team.id);
                    setPopoverOpen((open) => !open);
                  }}
                  className="p-1 hover:bg-[#2a3952] rounded transition-colors"
                >
                  <Ellipsis size={16} className="text-white" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0">
                <div className="flex flex-col">
                  {options.map((opt, idx) => {
                    if ('isDivider' in opt && opt.isDivider) {
                      return <Separator key={`divider-${idx}`} className="my-1" />;
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          opt.action?.();
                          setPopoverOpen(false);
                          setSelectedTeamId(null);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${
                          opt.textColor || 'text-[#001F3F]'
                        } hover:bg-gray-100 w-full text-left`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ))
      )}
    </div>
  );
};

export default TeamSpaceSidebar;
