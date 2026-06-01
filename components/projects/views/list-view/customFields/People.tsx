"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useTeamStore } from "@/stores/teams-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface PeopleFieldProps {
    onSubmit: (data: {
        name: string;
        type: 'people';
        description: string;
        showMembers: boolean;
        showGuests: boolean;
        includeFromTeam: boolean;
        selectedTeams: string[];
    }) => void;
    onCancel: () => void;
    initialData?: {
        name: string;
        description?: string;
        showMembers?: boolean;
        showGuests?: boolean;
        includeFromTeam?: boolean;
        selectedTeams?: string[];
    };
}

export function PeopleField({ onSubmit, onCancel, initialData }: PeopleFieldProps) {
  const [loading, setLoading] = useState(false);
    const [fieldName, setFieldName] = useState(initialData?.name ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [memberSource, setMemberSource] = useState<'showMembers' | 'showGuests' | 'includeFromTeam' | null>(
        initialData?.showMembers ? 'showMembers'
        : initialData?.showGuests ? 'showGuests'
        : initialData?.includeFromTeam ? 'includeFromTeam'
        : null
    );
    const [selectedTeams, setSelectedTeams] = useState<string[]>(initialData?.selectedTeams ?? []);
    const [showMoreSettings, setShowMoreSettings] = useState(false);
    const { teams, fetchTeams } = useTeamStore();
    const { currentWorkspace } = useWorkspaceStore();
    const [settingsError, setSettingsError] = useState('');
    const [teamError, setTeamError] = useState('');

    useEffect(() => {
        if (currentWorkspace?.id) fetchTeams();
    }, [currentWorkspace?.id]);

    const handleSubmit = async () => {
    if (loading) return;
    if (!fieldName.trim()) return;

        // Validate: one radio must be selected
        if (!memberSource) {
            setSettingsError('Please select one of the settings options.');
            return;
        }

        // Validate: if includeFromTeam selected, a team must be chosen
        if (memberSource === 'includeFromTeam' && selectedTeams.length === 0) {
            setTeamError('Please select a team.');
            return;
        }

        // Clear errors and submit
        setSettingsError('');
        setTeamError('');
    setLoading(true);
    try {
      await onSubmit({
            name: fieldName,
            type: 'people',
            description,
            showMembers: memberSource === 'showMembers',
            showGuests: memberSource === 'showGuests',
            includeFromTeam: memberSource === 'includeFromTeam',
            selectedTeams: memberSource === 'includeFromTeam' ? selectedTeams : [],
            // multiple: true,
        });
      if (!initialData) {
        // Reset
        setFieldName('');
        setDescription('');
        setSelectedTeams([]);
        setShowMoreSettings(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

                {/* Field Name */}
                <div className="space-y-2">
                    <label className="text-xs font-medium block">Field name</label>
                    <Input
            disabled={!!initialData}
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="Enter name..."
                        className="h-9"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-medium block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description...."
                        rows={2}
                        className="w-full text-xs border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Settings Section */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold block">Settings <span className="text-red-500"> </span></label>

                    {/* Warning banner — keep as is */}
                    <div className="flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-orange-700">
                            These settings affect only the workspace you're currently working in.
                        </p>
                    </div>

                    {/* RADIO: Show members */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="people-source"
                            checked={memberSource === 'showMembers'}
                            onChange={() => {
                                setMemberSource('showMembers');
                                setSelectedTeams([]);
                                setSettingsError('');
                                setTeamError('');
                            }}
                            className="border-input"
                        />
                        <span className="text-xs text-foreground">Show members</span>
                    </label>

                    {/* RADIO: Show guests */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="people-source"
                            checked={memberSource === 'showGuests'}
                            onChange={() => {
                                setMemberSource('showGuests');
                                setSelectedTeams([]);
                                setSettingsError('');
                                setTeamError('');
                            }}
                            className="border-input"
                        />
                        <span className="text-xs text-foreground">Show guests</span>
                    </label>

                    {/* RADIO: Include members from team */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="people-source"
                            checked={memberSource === 'includeFromTeam'}
                            onChange={() => {
                                setMemberSource('includeFromTeam');
                                setSettingsError('');
                            }}
                            className="border-input"
                        />
                        <span className="text-xs text-foreground">Include members from team</span>
                    </label>

                    {settingsError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {settingsError}
                        </p>
                    )}

                    {/* Team list — only when includeFromTeam is selected */}
                    {memberSource === 'includeFromTeam' && (
                        <div className="ml-6 space-y-2">
                            {memberSource === 'includeFromTeam' && (
                                <div className="ml-6 space-y-2">
                                    {teams.map((team) => (
                                        <label key={team.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="team-select"
                                                value={team.id}
                                                checked={selectedTeams[0] === team.id}
                                                onChange={() => {
                                                    setSelectedTeams([team.id]);
                                                    setTeamError('');
                                                }}
                                                className="border-input"
                                            />
                                            <span className="text-xs text-foreground">{team.name}</span>
                                        </label>
                                    ))}
                                    {teams.length === 0 && (
                                        <p className="text-xs text-muted-foreground">No teams available</p>
                                    )}
                                    {/* Team error — shown below team list */}
                                    {teamError && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {teamError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* More Settings */}
                <button
                    type="button"
                    onClick={() => setShowMoreSettings(!showMoreSettings)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-muted hover:bg-muted rounded-md transition-colors"
                >
                    <span className="text-xs text-muted-foreground">More settings and permissions</span>
                    <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${showMoreSettings ? 'rotate-90' : ''}`}
                    />
                </button>
                {showMoreSettings && (
                    <div className="space-y-3 p-3 border rounded-md bg-muted">
                        <p className="text-xs text-muted-foreground">Additional settings coming soon...</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 bg-card">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9">
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={(
                        !fieldName.trim() ||
                        !memberSource ||
                        (memberSource === 'includeFromTeam' && selectedTeams.length === 0)
                    ) || loading}
                    className="flex-1 h-9"
                >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <>{initialData ? 'Update Field' : 'Create'}</>
          )}
        </Button>
            </div>
        </div>
    );
}