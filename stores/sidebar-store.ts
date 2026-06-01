// store/sidebar-store.ts

import { set } from 'date-fns';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --------- Types ---------
export type MenuItem = {
  key: string;
  label: string;
  href: string;
  iconKey: string;
  badge?: string;
  showBadgeWhenOpen?: boolean;
  hasDropdown?: boolean;
  submenu?: SubMenuItem[];
  type?: string;
  sourceKey?: string;
};

export type SubMenuItem = {
  key: string;
  label: string;
  href: string;
  iconKey?: string;
  iconColor?: string;
  sourceKey?: string;
  nestedItems?: SubMenuItem[];
};

export interface PinSubmenuItemParams {
  subItem: SubMenuItem;
  parentKey: string;
  parentIconKey: string;
}

interface SidebarState {
  // State
  pinnedItems: MenuItem[];
  menuItems: MenuItem[];
  activeSubmenu: SubMenuItem[];
  activePopoverKey: string | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  closeMenu: () => void;

  // Actions
  pinItem: (item: MenuItem) => void;
  unpinItem: (href: string) => void;
  pinSubmenuItem: (params: PinSubmenuItemParams) => void;
  isItemPinned: (href: string) => boolean;
  setMenuItems: (items: MenuItem[]) => void;
  setActiveSubmenu: (submenu: SubMenuItem[]) => void;
  addMenuItem: (item: MenuItem) => void;
  setActivePopover: (key: string | null) => void;
  updateMailboxBadge: (count: number) => void;
  updateMenuItemSubmenu: (key: string, submenu: SubMenuItem[]) => void;
  initializeDynamicData: () => Promise<void>;

  reset: () => void;

}

// --------- Initial Static Menu ---------
const defaultMenu: MenuItem[] = [
  {
    key: "workspace",
    iconKey: "shapes",
    label: "Workspace",
    href: "/workspace",
    type: "workspace", // Special type to identify it
  },
  { key: "mywork", iconKey: "house", label: "My Work", href: "/dashboard" },

  { key: "draft", iconKey: "squarePen", label: "Draft", href: "/drafts" },
  {
    key: "mailbox",
    iconKey: "envelope",
    label: "Mailbox",
    href: "/mailbox",
    badge: undefined,
    showBadgeWhenOpen: true,
  },
  {
    key: "more",
    iconKey: "listIndentIncrease",
    label: "More",
    href: "/more",
    submenu: [
      { key: "goals", iconKey: "target", label: "Goals", href: "/goals" },
      { key: "docs", iconKey: "fileText", label: "Docs", href: "/docs" },

      { key: "timesheet", iconKey: "watch", label: "Timesheet", href: "/timesheet" },
    ],
  },
  { key: "reporting", iconKey: "chartNoAxesColumnIncreasing", label: "Reporting", href: "/reports" },

  {
    key: "teams",
    iconKey: "users",
    label: "Teams",
    href: "/teams",
    hasDropdown: true,
    submenu: [],
  },
  {
    key: "portfolio",
    iconKey: "layoutDashboard",
    label: "Portfolio",
    href: "/portfolio",
    hasDropdown: true,
    submenu: [],
  },
  {
    key: "project",
    iconKey: "panelsTopLeft",
    label: "Project",
    href: "/project",
    hasDropdown: true,
    submenu: [],
  },
];

// --------- Sidebar Store ---------
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      // Initial state
      pinnedItems: [],
      menuItems: defaultMenu,
      activeSubmenu: [],
      activePopoverKey: null,
      isLoading: false,
      isSidebarOpen: true,

      // Check if item is pinned (exists in pinnedItems array)
      isItemPinned: (href) => {
        return get().pinnedItems.some((item) => item.href === href);
      },

      // Pin submenu item helper
      pinSubmenuItem: ({ subItem, parentKey, parentIconKey }) => {
        const newItem: MenuItem = {
          key: subItem.key,
          label: subItem.label,
          href: subItem.href,
          iconKey: subItem.iconKey || parentIconKey,
          sourceKey: parentKey, // IMPORTANT: Mark where it came from
        };

        get().pinItem(newItem);
      },

      // Pin item action
      pinItem: (newItem) => {
        set((state) => {
          // Check if already pinned
          if (state.pinnedItems.some((item) => item.href === newItem.href)) {
            return state;
          }

          // Add to pinnedItems
          const updatedPinnedItems = [...state.pinnedItems, newItem];

          // DON'T remove from parent submenu - keep it visible
          const updatedMenuItems = [...state.menuItems];

          // Find position to insert (between mailbox and more)
          const mailboxIndex = updatedMenuItems.findIndex(
            (item) => item.key === "mailbox"
          );
          const moreIndex = updatedMenuItems.findIndex(
            (item) => item.key === "more"
          );

          // Insert the pinned item
          if (mailboxIndex !== -1 && moreIndex !== -1 && mailboxIndex < moreIndex) {
            updatedMenuItems.splice(moreIndex, 0, newItem);
          } else {
            updatedMenuItems.push(newItem);
          }

          return {
            pinnedItems: updatedPinnedItems,
            menuItems: updatedMenuItems,
          };
        });
      },

      // Unpin item action
      unpinItem: (href) => {
        set((state) => {
          // Find the pinned item
          const pinnedItem = state.pinnedItems.find((i) => i.href === href);
          if (!pinnedItem) return state;

          // Remove from pinnedItems
          const updatedPinnedItems = state.pinnedItems.filter(
            (i) => i.href !== href
          );

          // Remove from menuItems (the pinned copy in main menu)
          const updatedMenuItems = state.menuItems.filter((i) => i.href !== href);

          // NO NEED to add back to submenu - it never left!

          return {
            pinnedItems: updatedPinnedItems,
            menuItems: updatedMenuItems,
          };
        });
      },

      // Set menu items
      setMenuItems: (items) => {
        set({ menuItems: items });
      },

      // Set active submenu
      setActiveSubmenu: (submenu) => {
        set({ activeSubmenu: submenu });
      },

      // Add menu item
      addMenuItem: (newItem) => {
        set((state) => {
          const exists = state.menuItems.some(
            (item) => item.href === newItem.href
          );
          if (exists) return state;

          const moreIndex = state.menuItems.findIndex(
            (item) => item.label === "More"
          );
          const updatedMenuItems = [...state.menuItems];

          if (moreIndex !== -1) {
            updatedMenuItems.splice(moreIndex + 1, 0, newItem);
          } else {
            updatedMenuItems.push(newItem);
          }

          return { menuItems: updatedMenuItems };
        });
      },

      // Set active popover
      setActivePopover: (key) => {
        set({ activePopoverKey: key });
      },

      // Update submenu for a specific menu item
      updateMenuItemSubmenu: (key, submenu) => {
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.key === key
              ? { ...item, submenu, hasDropdown: submenu.length > 0 }
              : item
          ),
        }));
      },

      updateMailboxBadge: (count: number) => {
        set(state => {
          const updatedMenuItems = state.menuItems.map(item =>
            item.key === "mailbox" ? { ...item, badge: count > 0 ? count.toString() : undefined } : item
          );
          return { menuItems: updatedMenuItems };
        });
      },

      // Initialize dynamic data from other stores
      initializeDynamicData: async () => {
        set({ isLoading: true });
        try {
          const { useTeamStore } = await import('./teams-store');
          const { useProjectsStore } = await import('./projects-store');
          const { usePortfoliosStore } = await import('./portfolios-store');
          const { useFavoritesStore } = await import('./favorites-store');
          const { useWorkspaceStore } = await import('./workspace-store');

          const teamsData = useTeamStore.getState().teams;
          const projectsData = useProjectsStore.getState().projects;
          // console.log("fetching projects data for sidebar store:", projectsData)
          const portfoliosData = usePortfoliosStore.getState().portfolios;
          const favoritesData = useFavoritesStore.getState().favorites;
          const workspacesData = useWorkspaceStore.getState().workspaces;
          // console.log("Fetched workspaces data in sidebar store:", workspacesData);

          get().updateMenuItemSubmenu(
            'teams',
            teamsData.map((team) => ({
              key: `team-${team.id}`,
              label: team.name || 'Untitled Team',
              href: `/teams/${team.id}`,
            }))
          );


          get().updateMenuItemSubmenu(
            'workspace',
            workspacesData.map((workspace) => ({
              key: `workspace-${workspace.id}`,
              label: workspace.name,
              href: `/settings?tab=workspace&section=general&workspaceId=${workspace.id}`,
            }))
          );


          get().updateMenuItemSubmenu(
            'project',
            projectsData.map((project) => ({
              key: `project-${project.id}`,
              label: project.name,
              href: `/project/${project.id}`,
            }))
          );

          get().updateMenuItemSubmenu(
            'portfolio',
            portfoliosData.map((portfolio) => ({
              key: `portfolio-${portfolio.id}`,
              label: portfolio.name,
              href: `/portfolio/${portfolio.id}`,
            }))
          );

          get().updateMenuItemSubmenu(
            'favorites',
            favoritesData.map((favorite: any) => ({
              key: `favorite-${favorite.id}`,
              label: favorite.name,
              href: favorite.href || `/favorites/${favorite.id}`,
            }))
          );
        } catch (error) {
          console.error('Failed to initialize dynamic sidebar data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Reset
      reset: () => {
        localStorage.removeItem('sidebar-storage');
      },

      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
      isMenuOpen: false,
      setMenuOpen: (open: boolean) => set({ isMenuOpen: open }),
      closeMenu: () => set({ isMenuOpen: false }),
    }),

    {
      name: 'sidebar-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pinnedItems: state.pinnedItems,
        activePopoverKey: state.activePopoverKey,
        isSidebarOpen: state.isSidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.pinnedItems.length > 0) {
          // DON'T remove pinned items from submenus - let them stay visible
          let updatedMenuItems = [...state.menuItems];

          // Step 2: Re-insert pinned items into menuItems at correct position
          const mailboxIndex = updatedMenuItems.findIndex(
            (item) => item.key === "mailbox"
          );
          const moreIndex = updatedMenuItems.findIndex(
            (item) => item.key === "more"
          );

          // Insert each pinned item before "more"
          if (mailboxIndex !== -1 && moreIndex !== -1) {
            // Insert in reverse order to maintain correct order
            state.pinnedItems.forEach((pinnedItem) => {
              // Check if item is not already in menuItems
              const exists = updatedMenuItems.some((item) => item.href === pinnedItem.href);
              if (!exists) {
                updatedMenuItems.splice(moreIndex, 0, pinnedItem);
              }
            });
          }

          state.menuItems = updatedMenuItems;
        }
      },
    }
  )
);
