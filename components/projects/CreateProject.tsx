'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Flag, Lock, Users2, ChevronDown, Image as ImageIcon, UserPlus, UserPlus2, ChevronDownIcon, LockKeyhole, ChevronUpIcon, LockIcon, Hexagon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input"
import { useProjectsStore, dummyPortfolios, Project as ProjectType } from '@/stores/projects-store'
import { cn } from '@/lib/utils'
import ColorIconPicker, { IconData, iconLibrary } from '@/components/ColorIconPicker'
import { uploadIcon, uploadFile, deleteUpload } from '@/lib/api/uploads-api'
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useProfileStore } from '@/stores/profile-store';
import { useTeamStore } from '@/stores/teams-store'
import { usePortfoliosStore } from '@/stores/portfolios-store'
import { toast } from "@/components/ui/sonner";
import { formatLocalDate, convertSelectedDateToUTC, convertUTCToCalendarDate } from '@/utils/timezone-utils';

interface Label {
    id: string
    name: string
    color: string
}

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Privacy = 'private' | 'public';

interface CreateProjectProps {
    teamId?: string;
    portfolioId?: string;
}

export const CreateProject = ({ teamId, portfolioId }: CreateProjectProps = {}) => {
    const router = useRouter()
    const { addProject } = useProjectsStore()
    const { assignProjectToTeam } = useTeamStore()
    const { addProjectsToPortfolio } = usePortfoliosStore()
    // Use currentWorkspace, workspaceMembers and projectPhases
    const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers, projectPhases } = useWorkspaceStore();
    const { user } = useProfileStore();

    const fileInputRef = useRef<HTMLInputElement>(null)
    const portfolioDropdownRef = useRef<HTMLDivElement>(null);

    // Form state
    const [projectName, setProjectName] = useState('')
    const [projectIdentifier, setProjectIdentifier] = useState('')
    // Updated icon state
    const [projectIcon, setProjectIcon] = useState<string | null>(null)
    const [projectIconType, setProjectIconType] = useState<'icon' | 'file'>('icon')
    const [projectIconId, setProjectIconId] = useState<string | null>(null) // Store API upload ID

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [projectLeader, setProjectLeader] = useState('')
    const [phase, setPhase] = useState('draft')
    const [priority, setPriority] = useState<Priority>('medium');
    const [privacy, setPrivacy] = useState<Privacy>('private')
    const [linkedPortfolios, setLinkedPortfolios] = useState<string[]>([]);
    const [portfolioDropdownOpen, setPortfolioDropdownOpen] = useState(false);
    const [labels, setLabels] = useState<Label[]>([])
    const [loading, setLoading] = useState(false);
    const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
    const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);

    // UI State
    const [selectedIconData, setSelectedIconData] = useState<IconData | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [permissionsDropdownOpen, setPermissionsDropdownOpen] = useState(false)

    // Permissions state
    const [workflowPermission, setWorkflowPermission] = useState<'Me' | 'Admins' | 'Everyone'>('Me')
    const [membershipPermission, setMembershipPermission] = useState<'Me' | 'Admins' | 'Everyone'>('Me')
    const [fieldsPermission, setFieldsPermission] = useState<'Me' | 'Admins' | 'Everyone'>('Me')

    // Fetch members when component mounts
    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [currentWorkspace?.id, fetchWorkspaceMembers]);

    useEffect(() => {
        if (user?.id && !projectLeader) {
            setProjectLeader(user.id);
        }
    }, [user?.id]);

    // ✅ workspaceMembers is already the array - no need to key by id
    const members = workspaceMembers;

    // Handle icon upload
    const handleIconUpload = async (file: File): Promise<{ id: string; url?: string }> => {
        try {
            console.log('🎨 Starting icon upload for project...');

            // This now includes the complete 3-step process
            const result = await uploadFile(file);

            console.log("✅ Icon upload completed:", result);

            // Store the uploaded file ID
            setProjectIconId(result.id);

            console.log("📝 Icon ID stored:", result.id);

            return result;
        } catch (error: any) {
            console.error("❌ Icon upload failed:", error);

            // Show error to user
            toast('error', { title: error?.message || 'Failed to upload icon. Please try again.' });

            throw error;
        }
    };

    // Handle icon delete
    const handleIconDelete = async (uploadId: string): Promise<void> => {
        try {
            console.log('🗑️ Deleting icon upload, ID:', uploadId);

            await deleteUpload(uploadId);

            console.log('✅ Icon deleted successfully');

            // Clear project icon state if it matches
            if (projectIconId === uploadId) {
                setProjectIconId(null);
                setProjectIcon(null);
                setSelectedIconData(null);
            }

        } catch (error: any) {
            console.error('❌ Icon delete failed:', error);
            throw new Error(error?.message || 'Failed to delete icon');
        }
    };

    // Handle icon selection
    const handleIconSelect = (iconData: IconData) => {
        setSelectedIconData(iconData);
        setProjectIconType(iconData.type);

        if (iconData.type === "icon") {
            setProjectIcon(iconData.icon ?? null);
            setProjectIconId(iconData.iconId ?? null);
        } else {
            // ✅ For images, the ID comes from the upload response
            setProjectIcon(iconData.image ?? null);
            setProjectIconId(iconData.imageId ?? null); // This will be set from handleIconUpload
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                portfolioDropdownRef.current &&
                !portfolioDropdownRef.current.contains(event.target as Node)
            ) {
                setPortfolioDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleLinkedPortfolio = (id: string) => {
        setLinkedPortfolios((prev) =>
            prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
        );
    };

    // In handleCreateOrUpdateProject function, ensure icon data is properly structured
    const handleCreateProject = async () => {
        if (!isFormValid) return;

        setLoading(true);

        try {
            let finalIconId = projectIconId;

            console.log('🚀 Starting project creation...');
            console.log('📊 Project icon state:', {
                selectedIconType: selectedIconData?.type,
                projectIconId,
                hasSelectedIcon: !!selectedIconData
            });

            // ✅ Handle icon upload if needed (icon from library)
            if (selectedIconData && selectedIconData.type === "icon" && !projectIconId) {
                console.log('📤 Uploading icon from library...');
                const iconUploadResult = await uploadIcon({
                    icon: {
                        name: selectedIconData.icon || "default",
                        color: selectedIconData.color,
                    },
                });
                finalIconId = iconUploadResult.id;
                console.log("✅ Icon library upload completed, ID:", finalIconId);
            }

            // ✅ For image type, the ID is already set from handleIconUpload
            // The image was uploaded via the 3-step process: create → upload → complete
            if (selectedIconData && selectedIconData.type === "file") {
                if (projectIconId) {
                    console.log("✅ Using uploaded image ID:", projectIconId);
                    finalIconId = projectIconId;
                } else {
                    console.error('❌ Image selected but no upload ID found');
                    toast('error', { title: 'Image upload incomplete. Please try uploading again.' });
                    throw new Error('Image upload incomplete. Please try uploading again.');
                }
            }

            console.log("📝 Final iconId to be sent to project API:", finalIconId);

            const projectData: ProjectType = {
                name: projectName,
                description: `${projectName} project`,
                slug: projectIdentifier.toUpperCase(),
                status: "active" as const,
                priority,
                projectLeader,
                phase,
                privacy,
                linkedPortfolios,
                startDate,
                endDate,
                iconId: finalIconId, // This is sent to API
                customFields: [],
                taskTypeConfig: [], // Add default empty config or populate as needed

                // Local UI state (not sent to API)
                icon: selectedIconData
                    ? {
                        iconId: finalIconId || "",
                        type: projectIconType,
                        name: projectIcon || projectIdentifier.charAt(0),
                        color: selectedIconData.color,
                    }
                    : undefined,
                color: selectedIconData?.color || "#3B82F6",
            };

            // Create the project
            const createdProjectId = await addProject(projectData);

            // Handle assignments and navigation
            try {
                if (teamId) {
                    await assignProjectToTeam(teamId, createdProjectId);
                } else if (portfolioId) {
                    await addProjectsToPortfolio(portfolioId, [createdProjectId]);
                }
            } catch (err) {
                console.error("Non-critical assignment error:", err);
                // We still want to navigate since the project WAS created successfully
            }

            if (teamId) {
                router.push(`/teams/${teamId}`);
            } else if (portfolioId) {
                router.push(`/portfolio/${portfolioId}`);
            } else {
                router.push(`/project/${createdProjectId}`);
            }

            setLoading(false);
        } catch (error: any) {
            console.error("Error creating project:", error);
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to create project. Please try again.";
            toast('error', { title: errorMessage });
            setLoading(false);
        }
    };

    // Render icon display
    const renderIcon = () => {
        if (!projectIcon) {
            return <ImageIcon size={20} className="text-muted-foreground" />
        }

        if (projectIconType === 'file') {
            return (
                <img
                    src={projectIcon}
                    alt="Project icon"
                    className="w-full h-full object-cover"
                />
            )
        }

        // Render icon from library
        const iconObj = iconLibrary.find(i => i.name === projectIcon)
        if (iconObj) {
            const IconComponent = iconObj.icon
            return (
                <IconComponent
                    size={20}
                    color={selectedIconData?.color || '#6366f1'}
                />
            )
        }

        return <span className="text-xs">{projectIcon}</span>
    }

    const priorityConfig = {
        critical: {
            label: "Critical",
            color: "bg-red-50",
            iconColor: "text-red-500",
            badgeColor: "bg-red-100"
        },
        high: {
            label: "High",
            color: "bg-orange-50",
            iconColor: "text-orange-500",
            badgeColor: "bg-orange-100"
        },
        medium: {
            label: "Medium",
            color: "bg-yellow-50",
            iconColor: "text-yellow-500",
            badgeColor: "bg-yellow-100"
        },
        low: {
            label: "Low",
            color: "bg-green-50",
            iconColor: "text-green-500",
            badgeColor: "bg-green-100"
        }
    };

    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        setProjectName(name)
        // Auto-generate identifier from first 3 characters
        const identifier = name.slice(0, 3).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        setProjectIdentifier(identifier)
    }


    const handlePriorityChange = (value: string) => {
        setPriority(value as Priority);
    };

    const isFormValid = () => {
        return projectName.trim() !== ''
    }

    const handleBack = () => {
        router.back()
    }

    // ✅ workspaceMembers is flat array, use directly
    const selectedUser = workspaceMembers.find(member => member.userId === projectLeader);
    const { portfolios } = usePortfoliosStore();
    const selectedPortfolios = portfolios.filter(p => linkedPortfolios.includes(p.id));

    return (
        <div className="bg-background flex flex-col w-full" data-testid="create-project-container">
            <div className="flex-1 flex flex-col ">
                <div className="w-full p-6 bg-background">
                    <div className="space-y-4">
 
                        {/* Project Info Section */}
                        <div className="rounded-lg p-4 bg-secondary">
                            <div className="flex items-start gap-4">
                                {/* Icon Section */}
                                <div >
                                    <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Icon</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowColorPicker(true)}
                                        className="w-10 h-10 bg-background border border-input rounded-md flex items-center justify-center hover:bg-accent transition-colors overflow-hidden"
                                        data-testid="project-icon-button"
                                    >
                                        {renderIcon()}
                                    </button>

                                    <ColorIconPicker
                                        isOpen={showColorPicker}
                                        onClose={() => setShowColorPicker(false)}
                                        onSelect={handleIconSelect}
                                        currentIcon={projectIcon}
                                        currentColor={selectedIconData?.color || '#6366f1'}
                                        currentType={projectIconType}
                                        onUpload={handleIconUpload}
                                        onDelete={handleIconDelete}
                                    />
                                </div>

                                {/* Project Name & Identifier */}
                                <div className="w-80">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Project name</label>
                                    <Input
                                        type="text"
                                        value={projectName}
                                        onChange={handleProjectNameChange}
                                        placeholder="e.g. Project name"
                                        className="h-10 bg-background"
                                        data-testid="project-name-input"
                                    />
                                </div>

                                <div className="w-80">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Project identifier</label>
                                    <Input
                                        type="text"
                                        value={projectIdentifier}
                                        onChange={(e) => setProjectIdentifier(e.target.value)}
                                        placeholder="e.g. PRO"
                                        className="h-10 bg-background uppercase"
                                        readOnly
                                        data-testid="project-identifier-input"
                                    />
                                </div>
                                <div className="w-80">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2 h-4">Start date</label>
                                    <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full h-10 bg-background justify-start text-left font-normal",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                                data-testid="project-start-date-button"
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
                                                    "w-full h-10 bg-background justify-start text-left font-normal",
                                                    !endDate && "text-muted-foreground"
                                                )}
                                                data-testid="project-end-date-button"
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

                        {/* Project leader */}
                        <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow" >
                            <div className="flex justify-between items-center">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-primary">Project Lead</h1>
                                    <p className="font-medium text-xs text-muted-foreground leading-relaxed">
                                        Assign a single accountable owner. All decisions and escalations route through this person
                                    </p>
                                </div>

                                <div>
                                    {/* Add users Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className={`w-xs focus-ring-none rounded-sm flex justify-between items-center px-2`}
                                                data-testid="project-lead-dropdown-trigger"
                                            >
                                                <div className={` border-dashed border-border rounded-full flex items-center gap-2`}>
                                                    {selectedUser ? (
                                                        <div className="flex items-center gap-2">
                                                            {selectedUser?.profilePicture ? (
                                                                <img
                                                                    src={selectedUser.profilePicture}
                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                                                    {selectedUser?.name?.charAt(0)?.toUpperCase()}
                                                                </span>
                                                            )}
                                                            <span className="text-muted-foreground">{selectedUser?.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <UserPlus2 className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Add user or email</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronDownIcon className={`h-4 w-4 text-muted-foreground`} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-xs border-0 border-b-[5px] border-primary">
                                            {workspaceMembers.map((member) => (
                                                <DropdownMenuItem
                                                    key={member.userId}
                                                    onClick={() => setProjectLeader(member.userId)}
                                                    className="cursor-pointer"
                                                    data-testid={`project-lead-option-${member.userId}`}
                                                >
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
                        </div>

                        {/* Priority */}
                        <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow" >
                            <div className="flex justify-between items-center">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-primary">Priority</h1>
                                    <p className="font-medium text-xs text-muted-foreground leading-relaxed">
                                        Set priority by business impact and deadlines. Aligns resourcing and sprint planning
                                    </p>
                                </div>

                                {/* Priority Dropdown */}
                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="lg"
                                                className={`w-xs ${priority ? priorityConfig[priority].badgeColor : 'bg-muted'} focus-ring-none rounded-sm flex justify-start items-center gap-2 px-2`}
                                                data-testid="project-priority-dropdown-trigger"
                                            >
                                                {priority ? (
                                                    <>
                                                        <div className={`h-6 w-6 rounded-full ${priorityConfig[priority].badgeColor} flex items-center justify-center shrink-0`}>
                                                            <Flag className={`h-4 w-4 ${priorityConfig[priority].iconColor}`} />
                                                        </div>
                                                        <span className={`${priorityConfig[priority].iconColor} capitalize font-medium`}>
                                                            {priorityConfig[priority].label}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <div className="flex justify-between items-center w-full px-2">
                                                        <span className="text-muted-foreground">Create or select a priority</span>
                                                        <ChevronDownIcon className={`h-4 w-4 text-muted-foreground`} />
                                                    </div>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-xs border-0 border-b-[5px] border-primary bg-background">
                                            {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                                                <DropdownMenuItem
                                                    key={p}
                                                    className="justify-between"
                                                    onClick={() => handlePriorityChange(p)}
                                                    data-testid={`project-priority-option-${p}`}
                                                >
                                                    <span className="capitalize">{priorityConfig[p].label}</span>
                                                    <div className={`h-6 w-6 rounded-full ${priorityConfig[p].badgeColor} flex items-center justify-center p-0.5`}>
                                                        <Flag className={`h-2.5 w-2.5 ${priorityConfig[p].iconColor}`} />
                                                    </div>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Project Phase */}
                        <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow" >
                            <div className="flex justify-between items-center">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-primary">Lifecycle Stage</h1>
                                    <p className="font-medium text-xs text-muted-foreground leading-relaxed">
                                        Define the current phase – from discovery to delivery. Keeps stakeholders synchronized
                                    </p>
                                </div>

                                <div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="w-xs rounded-sm flex justify-between items-center px-2"
                                                data-testid="project-stage-dropdown-trigger"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const selectedPhase = projectPhases
                                                            .flatMap(p => [p, ...(p.children || [])])
                                                            .find(p => p.value === phase);

                                                        if (selectedPhase) {
                                                            return (
                                                                <>
                                                                    <div
                                                                        className="w-2.5 h-2.5 rounded-full"
                                                                        style={{ backgroundColor: selectedPhase.color }}
                                                                    />
                                                                    <span className="text-muted-foreground">{selectedPhase.label}</span>
                                                                </>
                                                            );
                                                        }
                                                        return (
                                                            <>
                                                                <Hexagon className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-muted-foreground capitalize">{phase || "Select Phase"}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-xs border-0 border-b-[5px] border-primary bg-background">
                                            {projectPhases.map((p) => (
                                                <React.Fragment key={p._id}>
                                                    <DropdownMenuItem onClick={() => setPhase(p.value)} data-testid={`project-stage-option-${p.value}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                            <span>{p.label}</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                    {p.children?.map((child) => (
                                                        <DropdownMenuItem
                                                            key={child._id}
                                                            className="pl-6"
                                                            onClick={() => setPhase(child.value)}
                                                            data-testid={`project-stage-option-${child.value}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: child.color }} />
                                                                <span>{child.label}</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {/* Project Privacy */}
                        <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow" >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-primary">Privacy</h1>
                                    <p className="font-medium text-xs text-muted-foreground leading-relaxed">
                                        Control who can see and who is accountable. Separate viewing rights from ownership.
                                    </p>
                                </div>

                                {/* Privacy Options */}
                                <div className='flex flex-col gap-2'>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setPrivacy('private')}
                                        className={`w-xs ${privacy === 'private' ? 'border-l-4 border-l-primary' : ''} focus-ring-none rounded-sm flex justify-start items-center px-2 py-6`}
                                        data-testid="project-privacy-private-button"
                                    >
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center`}>
                                            <LockKeyhole className={`h-6 w-6 text-muted-foreground`} />
                                        </div>
                                        <div className='flex flex-col justify-center items-start'>
                                            <span className='text-xs text-muted-foreground font-bold'>Private</span>
                                            <span className='text-[10px] text-muted-foreground font-medium'>Accessible only by invite</span>
                                        </div>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setPrivacy('public')}
                                        className={`w-xs ${privacy === 'public' ? 'border-l-4 border-l-primary' : ''} focus-ring-none rounded-sm flex justify-start items-center px-2 py-6`}
                                        data-testid="project-privacy-public-button"
                                    >
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center`}>
                                            <Users2 className={`h-6 w-6 text-muted-foreground`} />
                                        </div>
                                        <div className='flex flex-col justify-center items-start'>
                                            <span className='text-xs text-muted-foreground font-bold'>Public</span>
                                            <span className='text-[10px] text-muted-foreground font-medium'>Anyone in the workspace except Guests can join</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Connected portfolios */}
                        <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                    <h1 className="font-semibold text-sm text-primary">Portfolios</h1>
                                    <p className="font-medium text-xs text-muted-foreground leading-relaxed">Connect this project to a portfolio (optional),for strategic project governance</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 min-w-[260px]">
                                    {linkedPortfolios.length > 0 && (
                                        <div className="flex flex-wrap gap-2 justify-end mb-1">
                                            {portfolios.filter(p => linkedPortfolios.includes(p.id)).map((p) => (
                                                <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded border text-xs text-foreground">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: p.color || "#3B82F6" }}
                                                    />
                                                    {p.name}
                                                    <button type="button" onClick={() => toggleLinkedPortfolio(p.id)} className="text-muted-foreground hover:text-red-500 ml-1">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative w-xs" ref={portfolioDropdownRef}>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full rounded-sm flex justify-between items-center px-2"
                                            onClick={() => setPortfolioDropdownOpen((prev) => !prev)}
                                            type="button"
                                            data-testid="project-portfolios-dropdown-trigger"
                                        >
                                            <span className="text-muted-foreground">
                                                {linkedPortfolios.length > 0
                                                    ? `${linkedPortfolios.length} portfolio(s) linked`
                                                    : "Select"}
                                            </span>
                                            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                                        </Button>

                                        {portfolioDropdownOpen && (
                                            <div className="absolute z-50 right-0 bottom-full mb-1 w-full bg-popover text-popover-foreground border border-border border-b-[5px] border-b-primary rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {portfolios.length === 0 ? (
                                                    <div className="px-3 py-2 text-xs text-muted-foreground">No portfolios available</div>
                                                ) : (
                                                    portfolios.map((portfolio) => {
                                                        const isSelected = linkedPortfolios.includes(portfolio.id);
                                                        return (
                                                            <label
                                                                key={portfolio.id}
                                                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleLinkedPortfolio(portfolio.id)}
                                                                    className="h-4 w-4 accent-primary rounded"
                                                                    data-testid={`project-portfolio-checkbox-${portfolio.id}`}
                                                                />
                                                                <div
                                                                    className="w-5 h-5 rounded flex items-center justify-center text-xs text-white flex-shrink-0"
                                                                    style={{ backgroundColor: portfolio.color || "#3B82F6" }}
                                                                >
                                                                    {portfolio.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <span className="text-xs text-foreground">{portfolio.name}</span>
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

                        {/* Project permissions */}
                        {/* <div className="border-l-4 border-l-primary border border-border rounded-lg p-4 bg-card shadow" >
                            <div className="flex flex-col justify-between">
                                <div className="flex-1">
                                    <h1 className="font-semibold text-sm text-primary">Project permssions</h1>
                                    <div className='flex items-center py-2'>
                                        <div className='flex justify-between w-full p-2 bg-brand-orange/20 rounded-md'>
                                            <div className='flex items-center gap-2'>
                                                <LockIcon className={`h-4 w-4 text-foreground`} />
                                                <p className="font-normal text-xs text-primary leading-relaxed">
                                                    Upgrade to SliceFlo Enterprise+ to use this feature.
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`focus-ring-none rounded-sm bg-brand-orange px-6 text-primary-foreground hover:bg-brand-orange/90`}
                                            >
                                                Upgrade
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`focus-ring-none text-muted-foreground rounded-sm  mx-2 py-0`}
                                            onClick={() => setPermissionsDropdownOpen(!permissionsDropdownOpen)}
                                        >
                                            {permissionsDropdownOpen ? (
                                                <ChevronUpIcon className={`h-6 w-6`} />
                                            ) : (
                                                <ChevronDownIcon className={`h-6 w-6`} />
                                            )}
                                        </Button>
                                    </div>

                                </div>
                                {permissionsDropdownOpen && (
                                    <div className="pt-6 p-2 space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-sm text-muted-foreground font-semibold">General</h1>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground font-medium">Who can modify this project's workflow?</span>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setWorkflowPermission('Me')}
                                                        className={`flex-1 border text-xs ${workflowPermission === 'Me'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Me
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setWorkflowPermission('Admins')}
                                                        className={`flex-1 border text-xs ${workflowPermission === 'Admins'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Admin
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setWorkflowPermission('Everyone')}
                                                        className={`flex-1 border text-xs ${workflowPermission === 'Everyone'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Everyone
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground font-medium">Who can manage project memberships?</span>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setMembershipPermission('Me')}
                                                        className={`flex-1 border text-xs ${membershipPermission === 'Me'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Me
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setMembershipPermission('Admins')}
                                                        className={`flex-1 border text-xs ${membershipPermission === 'Admins'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Admin
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setMembershipPermission('Everyone')}
                                                        className={`flex-1 border text-xs ${membershipPermission === 'Everyone'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Everyone
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-border"></div>

                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-sm text-muted-foreground font-semibold">Project fields</h1>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground font-medium">Who can modify this project level fields(Priority, Labels, Project dates, Project name)</span>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setFieldsPermission('Me')}
                                                        className={`flex-1 border text-xs ${fieldsPermission === 'Me'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Me
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setFieldsPermission('Admins')}
                                                        className={`flex-1 border text-xs ${fieldsPermission === 'Admins'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        Admin
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setFieldsPermission('Everyone')}
                                                        className={`flex-1 border text-xs ${fieldsPermission === 'Everyone'
                                                            ? 'border-border border-b-primary border-b-2 text-muted-foreground'
                                                            : 'text-muted-foreground'
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
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="min-w-40 text-muted-foreground"
                                data-testid="project-cancel-button"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateProject}
                                disabled={!isFormValid || loading}
                                className="min-w-40 font-inter text-[14px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="project-submit-button"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Project"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
