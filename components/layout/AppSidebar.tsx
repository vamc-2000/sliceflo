"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { TeamIcon } from '@/components/teams/TeamIcon';
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Home,
  Focus,
  Mail,
  MoreHorizontal,
  Target,
  FileText,
  Clipboard,
  Watch,
  TrendingUp,
  Star,
  PanelsTopLeft,
  Users,
  DollarSign,
  UserPlus,
  Pin,
  PinOff,
  CircleHelp,
  Loader2,
  Briefcase,
  ChevronsUpDown,
  Plus,
  Settings,
  KeyRound,
  Puzzle,
  FileStack,
  Search,
  Shapes,
  ArrowBigUpDash,
  Wrench,
  SquarePen,
  Command,
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  Inbox,
  ListIndentIncrease,
  ArrowUpDown,
  MessageSquare,
  Bug,
  Lightbulb,
  MessageCircle,
  Calendar,
  FileQuestion,
  Globe,
  Share2,
  Scale,
  Smartphone,
  Monitor,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Music,
  BookOpen,
  Shield,
  ChevronRight,
  Mails,
  Hammer,
  Users2,
  ChevronDown,
  Router,
  PlusCircle,
  Eye,
  RefreshCw,
  Paperclip,
  StickyNote,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SubMenuItem, useSidebarStore } from "@/stores/sidebar-store"
import { useTeamStore } from "@/stores/teams-store"
import { useProjectsStore } from "@/stores/projects-store"
import { usePortfoliosStore } from "@/stores/portfolios-store"
import { useFavoritesStore } from "@/stores/favorites-store"
import { useWorkspaceStore } from "@/stores/workspace-store"
import { Input } from "../ui/input"
import CreateWorkspace from "../workspace/CreateWorkspace"
import MobileAppPopup from "../settings/Mobileappspopup"
import CommandHubModal from "../workspace/commandHub/CommandHubModel"
import { selectUnreadCount, useMailStore } from "@/stores/mailbox-store"
import { useProfileStore } from "@/stores/profile-store"
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog"
import { CreatePortfolioDialog } from "@/components/portfolios/CreatePortfolioDialog"
import { useAuthStore } from "@/stores/auth-store"
import { TeamActionsMenu } from "../teams/TeamActionsMenu"
import { iconComponentMap } from "@/components/ColorIconPicker";
import { ProjectIconAvatar } from "@/components/projects/ProjectIconAvatar";
import { IntegrationHubModal } from "../workspace/integrationHub/IntegrationHubModal";
import { TemplateHubModal } from "../workspace/templateHub/TemplateHubModal";
import { cn } from "@/lib/utils";
import InviteMemberModal from "../workspace/InviteMemberModal";
import { inviteWorkspaceMembers } from "@/lib/api/workspace-api";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "@/components/ui/sonner";
import { useTasksStore } from '@/stores/tasks-store';
import { ScrollArea } from "@/components/ui/scroll-area";
import { resetWorkspaceData } from "@/stores/reset-stores";
import { Loader } from "../Loader";

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  house: Home,
  focus: Focus,
  envelope: Mail,
  readMore: MoreHorizontal,
  target: Target,
  fileText: FileText,
  clipboard: Clipboard,
  watch: Watch,
  trendUp: TrendingUp,
  star: Star,
  panelsTopLeft: PanelsTopLeft,
  users: Users,
  briefcase: Briefcase,
  settings: Settings,
  keyRound: KeyRound,
  puzzle: Puzzle,
  fileStack: FileStack,
  dollarSign: DollarSign,
  userPlus: UserPlus,
  shapes: Shapes,
  chartNoAxesColumnIncreasing: ChartNoAxesColumnIncreasing,
  layoutDashboard: LayoutDashboard,
  listIndentIncrease: ListIndentIncrease,
  messageSquare: MessageSquare,
  bug: Bug,
  lightbulb: Lightbulb,
  mail: Mail,
  messageCircle: MessageCircle,
  calendar: Calendar,
  fileQuestion: FileQuestion,
  globe: Globe,
  share2: Share2,
  scale: Scale,
  smartphone: Smartphone,
  monitor: Monitor,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  music: Music,
  bookOpen: BookOpen,
  shield: Shield,
  squarePen: SquarePen,
  eye: Eye,
  refreshCw: RefreshCw,
  paperclip: Paperclip,
  stickyNote: StickyNote
}

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state, open, isMobile } = useSidebar()
  const {
    menuItems,
    pinnedItems,
    initializeDynamicData,
    pinSubmenuItem,
    unpinItem,
    isItemPinned
  } = useSidebarStore()
  const { fetchTeams, teams, setActiveTeamById, updateTeam, deleteTeam } = useTeamStore()
  const { fetchProjects, projects } = useProjectsStore()
  const { fetchPortfolios, portfolios } = usePortfoliosStore()
  const { fetchFavorites, favorites } = useFavoritesStore()
  const { workspaces, currentWorkspace, setCurrentWorkspace, fetchWorkspaces, fetchProjectPhases, isWorkspaceSwitching, setIsWorkspaceSwitching, addMembersToWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore()
  const { user } = useProfileStore();
  const { clearAllTasks } = useTasksStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [openModal, setOpenModal] = React.useState(false);
  const [openMobileApp, setOpenMobileApp] = React.useState(false);
  const [isCommandHubOpen, setIsCommandHubOpen] = React.useState(false);
  const [isIntegrationHubOpen, setIsIntegrationHubOpen] = React.useState(false);
  const [isTemplateHubOpen, setIsTemplateHubOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = React.useState("");
  const [isSavingTeam, setIsSavingTeam] = React.useState(false);
  const [deleteTeamId, setDeleteTeamId] = React.useState<string | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = React.useState(false);
  const editingFormRef = React.useRef<HTMLFormElement>(null);
  const [tempSubmitTeamId, setTempSubmitTeamId] = React.useState<string | null>(null);
  const [inviteData, setInviteData] = React.useState<{
    members: { email: string; role: string }[];
    message?: string;
  } | null>(null);
  const [isInviting, setIsInviting] = React.useState(false);

  const [openProjectSubmenu, setOpenProjectSubmenu] = React.useState<string | null>(null);

  // console.log("currentWorkspace", currentWorkspace)

  const { switchWorkspace } = useAuthStore();
  const defaultWorkspace = workspaces.find(ws => ws.id === user?.defaultWorkspaceId);

  const workspaceToDisplay = defaultWorkspace || currentWorkspace;

  const unreadCount = useMailStore(selectUnreadCount);

  const closeMenu = useSidebarStore(state => state.closeMenu);
  const isMenuOpen = useSidebarStore((state) => state.isMenuOpen);
  const router = useRouter();

  const mailboxItem = menuItems.find(item => item.key === "mailbox");
  const updateMailboxBadge = useSidebarStore(state => state.updateMailboxBadge);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = React.useState(false);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = React.useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

  // Example: simulate fetch unread emails count and update badge on mount
  React.useEffect(() => {
    updateMailboxBadge(unreadCount);
  }, [unreadCount, updateMailboxBadge]);

  React.useEffect(() => {
    if (isInviteModalOpen && currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [isInviteModalOpen, currentWorkspace?.id, fetchWorkspaceMembers]);

  React.useEffect(() => {
    // Initial sync from local stores (cached data)
    initializeDynamicData();

    // Background re-validation from API
    const refreshData = async () => {
      try {
        await Promise.allSettled([
          fetchTeams(),
          fetchProjects(),
          fetchPortfolios(),
          fetchFavorites(),
          fetchWorkspaces(),
        ]);
        // Re-sync after API data is loaded
        await initializeDynamicData();
      } catch (error) {
        console.error("Background data refresh failed:", error);
      }
    };

    refreshData();
  }, [fetchTeams, fetchProjects, fetchPortfolios, fetchFavorites, fetchWorkspaces, initializeDynamicData]);


  React.useEffect(() => {
    // Reset search when navigating away
    return () => {
      setSearchQuery("");
      setIsSearchOpen(false);
    };
  }, [pathname]);

  React.useEffect(() => {
    if (currentWorkspace?.id) {
      fetchTeams(); // Refetch teams for new workspace
      fetchProjects();
      fetchPortfolios(currentWorkspace.id);
      fetchProjectPhases(currentWorkspace.id); // Centralized project phases fetch
    }
  }, [currentWorkspace?.id, fetchTeams, fetchProjects, fetchPortfolios, fetchProjectPhases]);

  const getIcon = (iconKey: string) => {
    const Icon = iconMap[iconKey] || Home
    return Icon
  }

  const getTeamIcon = (iconKey: string | undefined) => {
    if (!iconKey) return null;
    return iconComponentMap[iconKey] || iconComponentMap["people"]; // fallback to "people"
  };

  // console.log('Raw teams data:', teams);
  // console.log('First team full data:', teams?.[0]);

  const enhancedMenuItems = React.useMemo(() => {
    const actualTeams = Array.isArray(teams) ? teams : (teams as any)?.teams || [];

    return menuItems.map((item) => {
      // Teams submenu
      if (item.key === "teams") {
        return {
          ...item,
          submenu: actualTeams.map((team: any) => ({
            key: team.id,
            label: team.name || team.teamName || "Unnamed Team",
            href: `/teams/${team.id}`,
            iconKey: team.icon?.name || 'users',
            iconColor: team.icon?.color || '#6366f1',
          })),
        };
      }

      // Projects submenu
      if (item.key === "project") {
        return {
          ...item,
          submenu: projects.map((project: any) => ({
            key: `project-${project.id}`,
            label: project.name,
            href: `/project/${project.id}`,
            iconKey: project.icon?.name || 'panelsTopLeft',
            iconColor: project.icon?.color || project.color || '#6366f1',
            nestedItems: [
              { key: 'overview', label: 'Overview', href: `/project/${project.id}?view=overview`, iconKey: 'layoutDashboard' },
              { key: 'views', label: 'Views', href: `/project/${project.id}/views`, iconKey: 'eye' },
              { key: 'cycles', label: 'Cycles', href: `/project/${project.id}/cycles`, iconKey: 'refreshCw' },
              { key: 'attachments', label: 'Attachments', href: `/project/${project.id}?view=attachments`, iconKey: 'paperclip' },
              { key: 'notes', label: 'Notes', href: `/project/${project.id}?view=notes`, iconKey: 'stickyNote' },
            ]
          })),
        };
      }

      // Portfolio submenu
      if (item.key === "portfolio") {
        return {
          ...item,
          submenu: portfolios.map((portfolio: any) => ({
            key: `portfolio-${portfolio.id}`,
            label: portfolio.name,
            href: `/portfolio/${portfolio.id}`,
            iconKey: 'layoutDashboard',
            iconColor: '#6366f1',
          })),
        };
      }

      // Favorites submenu
      if (item.key === "favorites") {
        return {
          ...item,
          submenu: favorites.map((favorite: any) => ({
            key: `favorite-${favorite.id}`,
            label: favorite.name,
            href: favorite.href || `/favorites/${favorite.id}`,
            iconKey: 'star',
            iconColor: '#facc15',
          })),
        };
      }

      return item;
    });
  }, [menuItems, teams, projects, portfolios, favorites]);


  // Filter and sort submenu items
  const filterAndSortItems = (items: SubMenuItem[] | undefined) => {
    if (!items) return [];

    let filtered = items;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort itemss
    return filtered.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.label.localeCompare(b.label);
      } else {
        return b.label.localeCompare(a.label);
      }
    });
  };

  const renderEmptyState = (imageName: string, message: string, description: string) => {
    return (
      <div className="flex flex-col items-center justify-center py-7 px-4 text-center">
        <div className="relative w-16 h-16 mb-5">
          <Image
            src={`/images/${imageName}.svg`}
            alt={message}
            fill
            className="object-contain"
          />
        </div>
        <p className="text-md">{message}</p>
        <p className="text-xs">{description}</p>
      </div>
    )
  }

  // Add these handler functions after other handler functions (around line 250)
  const handleCreateProject = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Close the dropdown
    setActiveDropdown(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsCreateProjectOpen(true); // Open the create project dialog
  };

  const handleCreateTeam = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // setDropdownOpen(false);
    // Router navigation or open dialog
    router.push("/teams");
  };

  const handleCreatePortfolio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(null);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsCreatePortfolioOpen(true); // Open the create portfolio dialog
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      setIsWorkspaceSwitching(true);
      setActiveDropdown(null) // Close other dropdowns
      setDropdownOpen(false); // Close workspace dropdown
      resetWorkspaceData();
      const res = await switchWorkspace(workspaceId) // API call + store updates
      // console.log("Switch Workspace", res.currentWorkspaceId);

      await Promise.all([
        fetchTeams(),
        fetchProjects(),
        fetchPortfolios(workspaceId)
      ]);
      router.push('/dashboard');

      // Keep loader visible for a smooth transition
      setTimeout(() => {
        setIsWorkspaceSwitching(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to switch workspace:', error)
      setIsWorkspaceSwitching(false);
      // Optional: toast.error('Failed to switch workspace')
    }
  }

  // Help Dropdown Content
  const helpDropdownContent = (
    <DropdownMenuContent
      side="right"
      align="start"
      className="w-56 bg-sidebar text-sidebar-foreground border-none shadow-xl transition-colors duration-200"
    >
      {/* Support Section */}
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        SUPPORT
      </div>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <Mails className="mr-2 h-4 w-4" />
        Share feedback
      </DropdownMenuItem>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <Bug className="mr-2 h-4 w-4" />
        Report a bug or improvement
      </DropdownMenuItem>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <Hammer className="mr-2 h-4 w-4" />
        Request feature
      </DropdownMenuItem>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <Mail className="mr-2 h-4 w-4" />
        Email support
      </DropdownMenuItem>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Chat on Discord
      </DropdownMenuItem>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <Calendar className="mr-2 h-4 w-4" />
        Schedule a call
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Resources Section */}
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        RESOURCES
      </div>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <FileQuestion className="mr-2 h-4 w-4" />
        API docs
      </DropdownMenuItem>

      {/* Website Submenu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            <Globe className="mr-2 h-4 w-4" />
            <span className="flex-1">Website</span>
            <ChevronRight className="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48 bg-sidebar text-sidebar-foreground border-none">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Home className="mr-2 h-4 w-4" />
            Homepage
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <FileText className="mr-2 h-4 w-4" />
            Changelog
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Target className="mr-2 h-4 w-4" />
            Status
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Briefcase className="mr-2 h-4 w-4" />
            Careers
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <BookOpen className="mr-2 h-4 w-4" />
            Blog
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Social Submenu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            <Users2 className="mr-2 h-4 w-4" />
            <span className="flex-1">Social</span>
            <ChevronRight className="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48 bg-sidebar text-sidebar-foreground border-none">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Instagram className="mr-2 h-4 w-4" />
            Instagram
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Twitter className="mr-2 h-4 w-4" />
            Threads
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Share2 className="mr-2 h-4 w-4" />
            Bluesky
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Twitter className="mr-2 h-4 w-4" />
            X
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Youtube className="mr-2 h-4 w-4" />
            Youtube
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Music className="mr-2 h-4 w-4" />
            TikTok
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Legal Submenu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            <Scale className="mr-2 h-4 w-4" />
            <span className="flex-1">Legal</span>
            <ChevronRight className="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48 bg-sidebar text-sidebar-foreground border-none">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <FileText className="mr-2 h-4 w-4" />
            Terms of use
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Shield className="mr-2 h-4 w-4" />
            Privacy policy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <BookOpen className="mr-2 h-4 w-4" />
        Read the help
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Download Section */}
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        DOWNLOAD
      </div>

      <div className="flex gap-2 px-2 py-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex-col h-auto py-2 bg-muted-foreground/10 border-0"
          onClick={(e) => {
            e.preventDefault()
            setOpenMobileApp(true)
          }
          }
        >
          <Smartphone className="h-4 w-4 mb-1" />
          <span className="text-xs">Mobile app</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 flex-col h-auto py-2 bg-muted-foreground/10 border-0"
          onClick={(e) => e.preventDefault()}
        >
          <Monitor className="h-4 w-4 mb-1" />
          <span className="text-xs">Windows app</span>
        </Button>
      </div>
    </DropdownMenuContent >
  )

  const handleInviteData = async (data: { members: { email: string; role: string }[]; message?: string; }, isSubmit: boolean) => {
    setInviteData(data);

    if (isSubmit && data.members.length > 0) {
      if (!currentWorkspace || !currentWorkspace.id) {
        toast("error", { title: "No active workspace found" });
        return;
      }

      setIsInviting(true);
      try {
        const emails = data.members.map(m => m.email);
        await inviteWorkspaceMembers(currentWorkspace.id, emails);
        toast("success", { title: "Invitations sent successfully" });
        setIsInviteModalOpen(false);
        setInviteData(null); // Clear after sending
      } catch (error: any) {
        toast("error", { title: error?.response?.data?.message || "Failed to send invitations" });
      } finally {
        setIsInviting(false);
      }
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border pt-8 transition-colors duration-300">
        {/* Header with Logo and Trigger */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* <div className="flex items-center justify-between w-full">
              <Image
                src={open ? "/sidebarlogo.png" : "/smallLogo.png"}
                alt="SliceFlo Logo"
                width={open ? 120 : 32}
                height={32}
                className="transition-all duration-200"
              />
            </div> */}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Main Navigation */}
        <SidebarContent className="overflow-y-auto sidebar-scroll">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Main Menu Items (includes pinned items automatically) */}
                {enhancedMenuItems.map((item) => {
                  const Icon = getIcon(item.iconKey)

                  // Comprehensive active state detection
                  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
                  const normalizedItemHref = item.href.replace(/\/$/, "") || "/";

                  const isExactlyActive = normalizedPathname === normalizedItemHref;
                  const isSubPathActive = normalizedItemHref !== "/" && normalizedPathname.startsWith(normalizedItemHref + "/");
                  const isAnySubItemActive = item.submenu?.some((sub: SubMenuItem) => {
                    const normalizedSubHref = sub.href.replace(/\/$/, "");
                    return normalizedPathname === normalizedSubHref || normalizedPathname.startsWith(normalizedSubHref + "/");
                  });

                  const isItemActive = isExactlyActive || isSubPathActive || isAnySubItemActive;

                  // Check if this item is a pinned item (has sourceKey)
                  const isPinnedItem = item.sourceKey !== undefined && isItemPinned(item.href);

                  if (item.key === "workspace") {
                    return (
                      <SidebarMenuItem key={item.key}>
                        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                          <DropdownMenuTrigger asChild>

                            {/* <SidebarMenuButton
                            tooltip={currentWorkspace?.name || "Select Workspace"}
                          >
                            {open ? (
                              <>
                                <Icon />
                                <span className="truncate">
                                  {currentWorkspace?.name || "Select Workspace"}
                                </span>
                                <SidebarMenuBadge>
                                  <ChevronDown className="h-4 w-4" />
                                </SidebarMenuBadge>
                              </>
                            ) : (
                              <Icon />
                            )}
                          </SidebarMenuButton> */}
                            <SidebarMenuButton
                              size="lg"
                              tooltip={currentWorkspace?.name || "Select Workspace"}
                            >
                              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground/30">
                                {currentWorkspace?.icon ? (
                                  <Image
                                    src={currentWorkspace.icon}
                                    alt={currentWorkspace.name || "Workspace"}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Icon />
                                )}
                              </div>
                              <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{currentWorkspace ? currentWorkspace.name : "Select Workspace"}</span>
                                {/* <span className="truncate font-semibold">{workspaceToDisplay ? workspaceToDisplay.name : "Select Workspace"}</span> */}

                                <span className="truncate text-xs">Enterprise</span>
                              </div>
                              <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            side="right"
                            align="start"
                            className="w-56 bg-sidebar text-sidebar-foreground border-none duration-200"
                          >
                            <DropdownMenuLabel className="flex flex-row items-center gap-2">
                              {/* <Briefcase className="h-4 w-4" /> */}
                              {currentWorkspace?.icon ? (
                                <div className="size-8 rounded overflow-hidden flex-shrink-0">
                                  <Image
                                    src={currentWorkspace.icon}
                                    alt={currentWorkspace.name || "Workspace"}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                              <div className="flex flex-col items-start leading-none">
                                <span className="font-medium">
                                  {currentWorkspace?.name || "Select Workspace"}
                                </span>
                                <p className="text-xs text-muted-foreground">Default</p>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-muted-foreground/50" />

                            {/* Action Items - Same structure as "More" submenu items */}
                            <DropdownMenuItem
                              onClick={(e) => e.preventDefault()}
                              className="cursor-pointer"
                            >
                              <ArrowBigUpDash className="h-4 w-4" />
                              <span>Upgrade Plan</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link
                                href="/settings?tab=workspace&section=userManagement"
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span>Invite & manage users</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setIsCommandHubOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Wrench className="h-4 w-4" />
                              <span>Command Hub</span>

                            </DropdownMenuItem>
                            <CommandHubModal
                              isOpen={isCommandHubOpen}
                              onClose={() => setIsCommandHubOpen(false)}
                            />

                            {/* <DropdownMenuItem
                              onClick={(e) => e.preventDefault()}
                              className="cursor-pointer"
                            >
                              <Command className="h-4 w-4" />
                              <span>Integration Hub</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                setIsTemplateHubOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Command className="h-4 w-4" />
                              <span>Template Hub</span>
                            </DropdownMenuItem> */}

                            {/* <TemplateHubModal
                                isOpen={isTemplateHubOpen}
                                onClose={() => setIsTemplateHubOpen(false)}
                              /> */}

                            <DropdownMenuItem asChild>
                              <Link
                                href="/settings?tab=workspace&section=general"
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Settings className="h-4 w-4" />
                                <span>Workspace settings</span>
                              </Link>
                            </DropdownMenuItem>


                            <DropdownMenuSeparator className="bg-muted-foreground/50" />

                            {/* Switch Workspaces Section */}
                            <DropdownMenuLabel className="flex items-center justify-between">
                              <span className="text-muted-foreground">Switch Workspaces</span>
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </DropdownMenuLabel>

                            <div className="max-h-[280px] overflow-y-auto py-1 scrollbar-none pr-2" >
                              {workspaces
                                .filter((workspace) => workspace.id !== currentWorkspace?.id)
                                .map((workspace) => (
                                  <DropdownMenuItem
                                    key={workspace.id}
                                    onClick={() => handleSwitchWorkspace(workspace.id!)}
                                    className="cursor-pointer"
                                  >
                                    {workspace.icon ? (
                                      <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
                                        <Image
                                          src={workspace.icon}
                                          alt={workspace.name}
                                          width={16}
                                          height={16}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <Icon className="h-4 w-4" />
                                    )}
                                    <span>{workspace.name}</span>
                                  </DropdownMenuItem>
                                ))}
                            </div>

                            <DropdownMenuSeparator className="bg-muted-foreground/50" />

                            {/* Add Workspace */}
                            <div className="p-">
                              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-inter" onClick={(e) => {
                                e.preventDefault();
                                setDropdownOpen(false);
                                setOpenModal(true);
                              }}>
                                <Plus className="h-4 w-4" />
                                <span>Add Workspace</span>
                              </Button>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    )
                  }

                  // Items with submenu - use DropdownMenu for BOTH collapsed and expanded
                  if (item.submenu !== undefined) {
                    // Determine empty state message based on menu key
                    const getEmptyState = (key: string): { imageName: string; message: string; description: string } => {
                      switch (key) {
                        case 'teams':
                          return { imageName: 'team-empty', message: 'Your Team is empty', description: 'Add Team Members' }
                        case 'project':
                          return { imageName: 'project-empty', message: 'Your Project is empty', description: 'Add new Projects' }
                        case 'portfolio':
                          return { imageName: 'portfolio-empty', message: 'Your Portfolio is empty', description: 'Add new portfolios' }
                        case 'favorites':
                          return { imageName: 'favorite-empty', message: 'Your Favorites is empty', description: 'Add your boards, docs, or dashboards for a quick access.' }
                        default:
                          return { imageName: 'empty', message: 'Your Items is empty', description: 'Add new items to get started.' }
                      }
                    }

                    return (
                      <SidebarMenuItem key={item.key}>
                        <DropdownMenu
                          open={activeDropdown === item.key} // Check if THIS dropdown is active
                          // open={dropdownOpen}
                          onOpenChange={(isOpen) => {
                            // setDropdownOpen(isOpen);
                            if (isOpen) {
                              // When opening, set active and clear previous search
                              setActiveDropdown(item.key);
                              setSearchQuery("");
                              setIsSearchOpen(false);
                              setSortOrder("asc");
                            } else {
                              // When closing, clear everything
                              setActiveDropdown(null);
                              setSearchQuery("");
                              setIsSearchOpen(false);
                            }
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.label}
                              isActive={isItemActive}
                              className={cn(
                                "transition-colors duration-200",
                                isItemActive &&
                                "!text-[#F68C1F] hover:!text-[#F68C1F] [&_svg]:!text-[#F68C1F]"
                              )}
                            >
                              <Icon className={cn(isItemActive && "!text-[#F68C1F]")} />

                              {open && (
                                <>
                                  <span
                                    className={cn(
                                      "flex-1 truncate text-left",
                                      isItemActive && "!text-[#F68C1F]"
                                    )}
                                  >
                                    {item.label}
                                  </span>

                                  {item.submenu && item.submenu.length > 0 && (
                                    <ChevronRight
                                      className={cn(
                                        "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                                        isItemActive ? "text-[#F68C1F]" : "text-sidebar-foreground"
                                      )}
                                      strokeWidth={2.5}
                                    />
                                  )}
                                </>
                              )}
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            side="right"
                            align="start"
                            className="w-56 bg-sidebar text-sidebar-foreground border-none shadow-xl transition-colors duration-200"
                          >
                            {/* Remove DropdownMenuLabel for "More" menu */}
                            {item.key !== "more" && item.submenu && item.submenu.length > 0 && (
                              <>
                                {/* Header with Search and Sort Icons */}
                                <div className="sticky top-0 z-10 bg-sidebar">
                                  <div className="flex items-center justify-between px-2 py-1 gap-2">
                                    {!isSearchOpen ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="flex-1 bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            setActiveDropdown(null);
                                            setSearchQuery("");
                                            setIsSearchOpen(false);

                                            // Dynamic handler based on menu item type
                                            switch (item.key) {
                                              case "project":
                                                handleCreateProject(e);
                                                break;
                                              case "teams":
                                                handleCreateTeam(e);
                                                break;
                                              case "portfolio":
                                                handleCreatePortfolio(e);
                                                break;
                                              default:
                                                console.log("Create new item");
                                            }
                                          }}
                                        >
                                          <PlusCircle className="h-4 w-4 mr-1 text-[#F68C1F]" />
                                          <span>Create New</span>
                                        </Button>

                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-background"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsSearchOpen(true);
                                          }}
                                        >
                                          <Search className="h-4 w-4" />
                                        </Button>

                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-background"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
                                          }}
                                        >
                                          <ArrowUpDown className="h-4 w-4" />
                                        </Button>

                                      </>
                                    ) : (
                                      <>
                                        <Input
                                          type="text"
                                          placeholder="Search..."
                                          value={searchQuery}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setSearchQuery(e.target.value);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          onKeyDown={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          className="flex-1 h-8 bg-sidebar-accent/50   text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-0"
                                          autoFocus
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-sidebar-accent"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
                                          }}
                                        >
                                          <ArrowUpDown className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                  <DropdownMenuSeparator className="bg-muted-foreground/50" />
                                </div>
                              </>

                            )}


                            {/* Show empty state if submenu is empty OR no search results */}
                            <div className="max-h-[280px] overflow-y-auto scrollbar-none">
                              {(() => {
                                const filteredItems = filterAndSortItems(item.submenu);

                                if (filteredItems.length === 0) {
                                  const { imageName, message, description } = getEmptyState(item.key);
                                  return (
                                    <>
                                      {/* Create New Button in Empty State */}
                                      <div className="flex items-center justify-center px-0 py-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground transition-all"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveDropdown(null);   // 👈 close dropdown immediately
                                            setSearchQuery("");
                                            setIsSearchOpen(false);

                                            // Dynamic handler based on menu item type
                                            switch (item.key) {
                                              case "project":
                                                handleCreateProject(e);
                                                break;
                                              case "teams":
                                                handleCreateTeam(e);
                                                break;
                                              case "portfolio":
                                                handleCreatePortfolio(e);
                                                break;
                                              default:
                                                console.log("Create new item");
                                            }
                                          }}
                                        >
                                          <PlusCircle className="h-4 w-4 mr-1 text-[#F68C1F]" />
                                          <span>
                                            {item.key === "teams" ? "Create New Team" :
                                              item.key === "project" ? "Create New Project" :
                                                item.key === "portfolio" ? "Create New Portfolio" :
                                                  "Create New"}
                                          </span>
                                        </Button>
                                      </div>
                                      <DropdownMenuSeparator className="bg-muted-foreground/50" />

                                      {renderEmptyState(imageName, message, description)}
                                    </>
                                  );
                                }

                                //               } else {
                                //                 pinSubmenuItem({
                                //                   subItem,
                                //                   parentKey: item.key,
                                //                   parentIconKey: item.iconKey,
                                //                 });
                                //               }
                                //             }}
                                //           >
                                //             {isSubItemPinned ? (
                                //               <PinOff className="h-3 w-3 group-hover:text-white transition-colors" />
                                //             ) : (
                                //               <Pin className="h-3 w-3 group-hover:text-white transition-colors" />
                                //             )}
                                //           </Button>
                                //         )}
                                //       </div>
                                //     </DropdownMenuItem>
                                //   );
                                // });

                                return filteredItems.map((subItem, subIndex) => {
                                  // Get team data for teams menu OR icon component for others
                                  let iconElement = null;
                                  const iconColor = subItem.iconColor || '#6366f1';
                                  const fallbackLetter = subItem.label?.[0]?.toUpperCase() || '?';

                                  const isSubActive = normalizedPathname === (subItem.href?.replace(/\/$/, "") || "/") || ((subItem.href?.replace(/\/$/, "") || "/") !== "/" && normalizedPathname.startsWith((subItem.href?.replace(/\/$/, "") || "/") + "/"));
                                  const isSubItemPinned = isItemPinned(subItem.href!);

                                  if (subItem.key === "goals") {
                                    iconElement = (
                                      <div className="w-4 h-4 rounded-md flex items-center justify-center mr-2 shrink-0">
                                        <Image
                                          src="/images/rewarded_ads.svg"
                                          alt="Goals"
                                          width={12}
                                          height={12}
                                          className={cn("w-full h-full", isSubActive ? "filter-orange" : "brightness-0 invert")}
                                        />
                                      </div>
                                    );
                                  } else if (subItem.key === "docs") {
                                    iconElement = (
                                      <div className="w-4 h-4 rounded-md flex items-center justify-center mr-2 shrink-0">
                                        <Image
                                          src="/images/DocsIcon.svg"
                                          alt="Docs"
                                          width={12}
                                          height={12}
                                          className={cn("w-full h-full", isSubActive ? "filter-orange" : "brightness-0 invert")}
                                        />
                                      </div>
                                    );
                                  } else if (subItem.key === "whiteboard") {
                                    iconElement = (
                                      <div className="w-4 h-4 rounded-md flex items-center justify-center mr-2 shrink-0">
                                        <Image
                                          src="/images/whiteboard.svg"
                                          alt="Whiteboard"
                                          width={12}
                                          height={12}
                                          className={cn("w-full h-full", isSubActive ? "filter-orange" : "brightness-0 invert")}
                                        />
                                      </div>
                                    );
                                  } else if (subItem.key === "timesheet") {
                                    iconElement = (
                                      <div className="w-4 h-4 rounded-md flex items-center justify-center mr-2 shrink-0">
                                        <Image
                                          src="/images/File.svg"
                                          alt="Timesheet"
                                          width={12}
                                          height={12}
                                          className={cn("w-full h-full", isSubActive ? "filter-orange" : "brightness-0 invert")}
                                        />
                                      </div>
                                    );
                                  } else if (item.key === "teams") {
                                    // Find team data by ID (subItem.key contains team ID)
                                    const teamData = teams?.find((t: any) => t.id === subItem.key);

                                    if (teamData?.icon) {
                                      iconElement = (
                                        <TeamIcon
                                          team={teamData}
                                          size={4}
                                          className="w-5 h-5 flex-shrink-0 mr-2"
                                        />
                                      );
                                    } else {
                                      // Fallback for teams without icon
                                      iconElement = (
                                        <div
                                          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold mr-2"
                                          style={{ backgroundColor: iconColor }}
                                        >
                                          {fallbackLetter}
                                        </div>
                                      );
                                    }
                                  } else if (subItem.iconKey && iconComponentMap[subItem.iconKey as keyof typeof iconComponentMap]) {
                                    // Regular icon components (projects, portfolios, etc.)
                                    const IconComp = iconComponentMap[subItem.iconKey as keyof typeof iconComponentMap];
                                    iconElement = (
                                      <div
                                        className={cn(
                                          "flex items-center justify-center w-4 h-4 rounded-md mr-2",
                                          isSubActive && "!bg-[#F68C1F]"
                                        )}
                                        style={!isSubActive ? { backgroundColor: iconColor } : {}}
                                      >
                                        <IconComp className="h-3 w-3 text-white" />
                                      </div>
                                    );
                                  } else {
                                    // Generic fallback for everything else
                                    iconElement = (
                                      <div
                                        className={cn(
                                          "flex items-center justify-center w-5 h-5 rounded-md mr-2 font-semibold text-white text-[8px]",
                                          isSubActive && "!bg-[#F68C1F]"
                                        )}
                                        style={!isSubActive ? { backgroundColor: iconColor } : {}}
                                      >
                                        {fallbackLetter}
                                      </div>
                                    );
                                  }
                                  return (
                                    <DropdownMenuItem
                                      key={subItem.key}
                                      asChild
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        // Close dropdown and reset states
                                        if (!subItem.nestedItems) {
                                          setActiveDropdown(null);
                                          setSearchQuery("");
                                          setIsSearchOpen(false);
                                        }

                                        // Set active team FIRST (key fix)
                                        if (item.key === 'teams' && subItem.key) {
                                          const { setActiveTeamById } = useTeamStore.getState();
                                          setActiveTeamById(subItem.key);  // subItem.key is team.id [file:2][file:1]
                                        }

                                        // If it has nested items, toggle expansion instead of navigating
                                        if (subItem.nestedItems) {
                                          setOpenProjectSubmenu(openProjectSubmenu === subItem.key ? null : subItem.key);
                                          return;
                                        }

                                        // Then navigate
                                        router.push(subItem.href!);
                                      }}
                                      className={cn(
                                        "cursor-pointer group/item transition-colors duration-200",
                                        isSubActive && "text-[#F68C1F] focus:text-[#F68C1F]"
                                      )}
                                    >
                                      <div className="flex flex-col w-full">
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-2 flex-1">
                                            {iconElement}
                                            {editingTeamId === subItem.key ? (
                                              <form
                                                ref={editingFormRef}
                                                className="flex items-center gap-1 flex-1"
                                                onSubmit={async (e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  if (!editingTeamName.trim()) return;
                                                  try {
                                                    setIsSavingTeam(true);
                                                    await updateTeam(subItem.key!, { name: editingTeamName.trim() });
                                                    setEditingTeamId(null);
                                                  } finally {
                                                    setIsSavingTeam(false);
                                                  }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Submit current editing team
                                                    if (editingTeamId) {
                                                      const submitPayload = { name: editingTeamName.trim() };
                                                      // Directly call updateTeam (no form event needed)
                                                      updateTeam(editingTeamId, submitPayload);
                                                      setEditingTeamId(null);
                                                    }
                                                  }
                                                  if (e.key === "Escape") {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setEditingTeamId(null);
                                                  }
                                                }}
                                              >
                                                <Input
                                                  className="h-7 px-2 text-sm"
                                                  value={editingTeamName}
                                                  autoFocus
                                                  onChange={(e) => setEditingTeamName(e.target.value)}
                                                />
                                                <button
                                                  type="submit"
                                                  className="p-1 rounded hover:bg-muted"
                                                  disabled={isSavingTeam}
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  type="button"
                                                  className="p-1 rounded hover:bg-muted"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setEditingTeamId(null);
                                                  }}
                                                >
                                                  ✕
                                                </button>
                                              </form>
                                            ) : (
                                              <span className={cn(isSubActive && "!text-[#F68C1F]")}>{subItem.label}</span>
                                            )}

                                          </div>

                                          {/* Chevron for nested items */}
                                          {subItem.nestedItems && (
                                            <div className="ml-auto">
                                              {openProjectSubmenu === subItem.key ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                              )}
                                            </div>
                                          )}

                                          {/* Ellipsis menu on the right - FIXED teamId */}
                                          {item.key === "teams" && (
                                            <TeamActionsMenu
                                              teamId={subItem.key}  // Use subItem.key directly (it's the team ID)
                                              teamName={subItem.label}
                                              onRename={(id) => {
                                                const team = teams.find((t: any) => t.id === id);
                                                setEditingTeamId(id);
                                                setEditingTeamName(team?.name || subItem.label || "");
                                              }}
                                              onInviteMembers={(id) => {
                                                // open invite dialog
                                              }}
                                              onCreateProject={(teamId) => {
                                                // Close sidebar dropdown first
                                                setActiveDropdown(null);
                                                setSearchQuery("");
                                                setIsSearchOpen(false);

                                                // Navigate to team project creation
                                                router.push(`/teams/${teamId}/create-project`);
                                              }}
                                              onCreateGoal={(teamId) => {
                                                // 👈 ADD THIS HANDLER
                                                // Close sidebar dropdown first
                                                setActiveDropdown(null);
                                                setSearchQuery("");
                                                setIsSearchOpen(false);

                                                // Navigate to team project creation
                                                router.push(`/teams/${teamId}/create-goal`)
                                              }}
                                              onDelete={(id) => {
                                                setDeleteTeamId(id);
                                              }}
                                            />
                                          )}
                                          {/* Team Delete Confirmation */}
                                          <ConfirmationModal
                                            open={!!deleteTeamId}
                                            onClose={() => setDeleteTeamId(null)}
                                            title="Are you sure want to delete this team"
                                            confirmLabel="Delete Team"
                                            description="Deleting this team will remove access everywhere. Once deleted, the team and its members will lose access to all associated projects, tasks, and dat. Double-check before proceeding to avoid disruptions."
                                            loading={isDeletingTeam}
                                            onConfirm={async () => {
                                              if (!deleteTeamId) return;
                                              try {
                                                setIsDeletingTeam(true);
                                                await deleteTeam(deleteTeamId);  // 👈 CALL STORE ACTION
                                                toast("success", { title: "Team deleted successfully" });
                                              } catch (error) {
                                                toast("error", { title: "Failed to delete team" });
                                              } finally {
                                                setIsDeletingTeam(false);
                                                setDeleteTeamId(null);
                                              }
                                            }}
                                          />

                                          {/* Pin/Unpin button for More submenu */}
                                          {item.key === "more" && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 ml-2 shrink-0 group hover:bg-white/10 transition-colors"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (isSubItemPinned) {
                                                  unpinItem(subItem.href!);
                                                } else {
                                                  pinSubmenuItem({
                                                    subItem,
                                                    parentKey: item.key,
                                                    parentIconKey: item.iconKey,
                                                  });
                                                }
                                              }}
                                            >
                                              {isSubItemPinned ? (
                                                <PinOff className="h-3 w-3 group-hover:text-white transition-colors" />
                                              ) : (
                                                <Pin className="h-3 w-3 group-hover:text-white transition-colors" />
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                        {/* Render nested items if expanded */}
                                        {subItem.nestedItems && openProjectSubmenu === subItem.key && (
                                          <div className="flex flex-col ml-8 mt-1 space-y-1">
                                            {subItem.nestedItems.map((nestedItem) => {
                                              const NestedIcon = getIcon(nestedItem.iconKey || "");
                                              const isNestedActive = (() => {
                                                const urlPath = nestedItem.href.split('?')[0];
                                                const urlQuery = nestedItem.href.split('?')[1] || '';
                                                const viewParam = new URLSearchParams(urlQuery).get('view');
                                                const currentView = searchParams.get('view');
                                                if (viewParam) {
                                                  return pathname === urlPath && currentView === viewParam;
                                                }
                                                return pathname === urlPath && !currentView;
                                              })();

                                              return (
                                                <div
                                                  key={nestedItem.key}
                                                  className={cn(
                                                    "flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                                                    isNestedActive && "text-[#F68C1F] bg-[#F68C1F]/10"
                                                  )}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveDropdown(null);
                                                    setSearchQuery("");
                                                    setIsSearchOpen(false);
                                                    router.push(nestedItem.href);
                                                  }}
                                                >
                                                  <NestedIcon className={cn("h-3.5 w-3.5", isNestedActive ? "text-[#F68C1F]" : "text-muted-foreground")} />
                                                  <span className="text-xs font-medium">{nestedItem.label}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </DropdownMenuItem>
                                  );
                                });

                              })()}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    )
                  }

                  // Regular menu items without submenu (includes pinned items)
                  return (
                    <SidebarMenuItem key={item.key}>
                      <div className="flex items-center w-full group/menuitem relative">
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive}
                          tooltip={item.label}
                          className={cn(
                            "flex-1 transition-colors duration-200",
                            isItemActive && "!text-[#F68C1F] hover:!text-[#F68C1F] [&_svg]:!text-[#F68C1F]"
                          )}
                        >
                          <Link href={item.href}>
                            {item.key === "docs" ? (
                              <div className="w-4 h-4 shrink-0 overflow-hidden">
                                <Image
                                  src="/images/DocsIcon.svg"
                                  alt="Docs"
                                  width={16}
                                  height={16}
                                  className={cn("w-full h-full object-contain", isItemActive && "filter-orange")} // Adjust docs icon if needed
                                />
                              </div>
                            ) : (
                              <Icon className={cn(isItemActive && "!text-[#F68C1F]")} />
                            )}
                            <span className={cn(isItemActive && "!text-[#F68C1F]")}>{item.label}</span>
                            {item.badge && item.showBadgeWhenOpen && open && (
                              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                            )}
                          </Link>
                        </SidebarMenuButton>

                        {/* Unpin button - ONLY show for pinned items (items with sourceKey) */}
                        {isPinnedItem && open && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute right-2 p-0 hover:bg-accent"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              unpinItem(item.href)
                            }}
                          >
                            <PinOff className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        {/* Footer */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {open ? (
                /* Full Footer for Open Sidebar */
                <div className="space-y-3">
                  {/* Trial Progress with Loader2 */}
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-8 w-8 text-[#C89056]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Advanced free trial</p>
                      <p className="text-sm text-[#C89056]">8 days left</p>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  <Button className="w-full bg-[#C89056] hover:bg-[#C89056]/90">
                    Upgrade plan
                  </Button>

                  <Separator className="bg-muted-foreground/50" />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-[3] bg-[#C89056] hover:bg-[#C89056]/90"
                      onClick={() => setIsInviteModalOpen(true)}
                    >
                      Invite people
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="flex-[1] bg-[#C89056] hover:bg-[#C89056]/90">
                          <CircleHelp className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      {helpDropdownContent}
                    </DropdownMenu>
                  </div>
                </div>
              ) : (
                /* Compact Footer for Collapsed Sidebar */
                <div className="flex flex-col items-center gap-3">
                  {/* Trial Progress - Compact with Loader2 */}
                  <Loader2 className="h-6 w-6 text-[#C89056]" />

                  {/* Compact Action Buttons */}
                  <Button size="icon" title="Upgrade plan" className="bg-[#C89056] hover:bg-[#C89056]/90">
                    <DollarSign className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    title="Invite people"
                    className="bg-[#C89056] hover:bg-[#C89056]/90"
                    onClick={() => setIsInviteModalOpen(true)}
                  >
                    <UserPlus className="h-5 w-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" title="Help" className="bg-[#C89056] hover:bg-[#C89056]/90">
                        <CircleHelp className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    {helpDropdownContent}
                  </DropdownMenu>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="!max-w-[70vw] !w-[70vw] p-8">
            <DialogHeader>
              <DialogTitle className="sr-only">Create New Workspace</DialogTitle>
            </DialogHeader>
            <CreateWorkspace onClose={() => setOpenModal(false)} />
          </DialogContent>
        </Dialog>
        <MobileAppPopup open={openMobileApp} onClose={() => setOpenMobileApp(false)} />
      </Sidebar >
      {/* Create Project Dialog */}
      < CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
      />

      {/* Create Portfolio Dialog */}
      <CreatePortfolioDialog
        open={isCreatePortfolioOpen}
        onOpenChange={setIsCreatePortfolioOpen}
      />

      {/* Invite Team Members Modal */}
      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteData={handleInviteData}
        existingMembers={inviteData?.members || []}
        isLoading={isInviting}
      />

      {/* Workspace Switching Loader Overlay */}
      {isWorkspaceSwitching && (
        <div className="fixed inset-0 z-[99999] bg-background flex flex-col items-center justify-center">
          <Loader
            message="Switching Workspace..."
            size="lg"
          />
        </div>
      )}
    </>
  )
}