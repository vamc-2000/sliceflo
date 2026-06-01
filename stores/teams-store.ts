import { create } from "zustand";
import { persist } from "zustand/middleware";
import { teamsApi } from "@/lib/api/teams.api";
import { useProjectsStore } from "@/stores/projects-store"
import type {
  Team,
  TeamMember,
  AddMemberRequest,
  CreateTeamRequest,
  CalendarEvent,
  IUser,
  TBadgeVariant,
  TVisibleHours,
  TWorkingHours,
  TeamApiResponse,
} from "@/types/teams.types";
import { useTasksStore } from "./tasks-store";

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

const WORKING_HOURS: TWorkingHours = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

const VISIBLE_HOURS: TVisibleHours = { from: 7, to: 18 };

const decodeUserName = (rawName: string | undefined | null): string => {
  if (!rawName) return "";

  // Example: if encoded format always contains ":" and real name is only in some responses
  // You can try to detect the encoded pattern and fallback:
  // case 1: backend sometimes already sends plain text
  if (!rawName.includes(":")) {
    return rawName; // assume plain name like "Sri Nanditha"
  }

  // case 2: encoded string, you can keep a placeholder or attempt a custom decode
  // For now, just show email-local-part-like placeholder:
  return "User"; // or derive from email outside this helper
};

// const normalizeTeam = (team: any): Team => {
//   const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

//   // The backend might return 'teamMembers', 'members', or 'projectIds', 'projects'
//   const rawMembers = team.teamMembers || team.members || [];
//   const rawProjects = team.projects || team.projectIds || [];

//   // Create a base object without those raw fields to avoid double source of truth
//   const { members, teamMembers, projects, projectIds, ...rest } = team;

//   return {
//     ...rest,
//     teamMembers: rawMembers.map((m: any) => {
//       const safeName = decodeUserName(m.name);

//       return {
//         id: String(m.userId || m.id),
//         name: safeName,
//         email: m.email,
//         role: m.role,
//         avatar:
//           m.profilePictureUrl ||
//           (m.profilePicture ? `${s3BaseUrl}/${m.profilePicture}` : ""),
//         initials: safeName
//           ? safeName
//             .split(" ")
//             .map((n: string) => n[0])
//             .join("")
//           : "",
//       };
//     }),
//     memberCount: rawMembers.length,
//     projectIds: rawProjects.map((p: any) =>
//       String(p.id || p.projectId || p)
//     ),
//     // If you still need the raw projects for something, keep them as a distinct field
//     // but the store logic seems to prefer names like 'projectIds' and 'teamMembers'
//   };
// };

const normalizeTeam = (team: any): Team => {
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";
  const rawMembers = team.teamMembers || team.members || [];
  const rawProjects = team.projects || team.projectIds || [];

  const { members, teamMembers, projects, projectIds, ...rest } = team;

  const normalizedProjects = rawProjects.map((p: any) => {
    if (typeof p === "string") {
      return { id: String(p), name: "" };
    }

    return {
      id: String(p.id || p.projectId || ""),
      name: p.name || "",
      description: p.description || "",
      status: p.status || "",
      priority: p.priority || "",
    };
  });

  return {
    ...rest,
    teamMembers: rawMembers.map((m: any) => {
      const safeName = decodeUserName(m.name);
      return {
        id: String(m.userId || m.id),
        userId: String(m.userId || m.id),
        name: safeName || m.email || "User",
        email: m.email || "",
        role: m.role,
        avatar:
          m.profilePictureUrl ||
          (m.profilePicture ? `${s3BaseUrl}${m.profilePicture}` : ""),
        initials: (safeName || m.email || "U")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase(),
      };
    }),
    memberCount: rawMembers.length,
    projects: normalizedProjects,
    projectIds: normalizedProjects.map((p: any) => String(p.id)),
  };
};
/* ---------------------------------- */
/* State */
/* ---------------------------------- */

interface TeamState {
  teams: Team[];
  activeTeamId: string | null;

  loading: boolean;
  error: string | null;

  calendar: {
    selectedDate: Date;
    selectedUserId: IUser["id"] | "all";
    badgeVariant: TBadgeVariant;
    workingHours: TWorkingHours;
    visibleHours: TVisibleHours;
    showWeekends: boolean;
    weekendDays: number[];
  };
}

/* ---------------------------------- */
/* Actions */
/* ---------------------------------- */

interface TeamActions {
  setActiveTeamById: (id: string) => void;

  fetchTeams: () => Promise<void>;
  fetchTeamById: (teamId: string) => Promise<Team | null>;
  createTeam: (payload: CreateTeamRequest) => Promise<Team | null>;

  addMember: (
    teamId: string,
    apiMembers: AddMemberRequest[],
    uiMembers: TeamMember[]
  ) => Promise<void>;

  removeMember: (teamId: string, memberId: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  assignProjectToTeam: (teamId: string, projectId: string) => Promise<void>;
  detachProjectFromTeam: (teamId: string, projectId: string) => Promise<void>;
  assignGoalToTeam: (teamID: string, goalId: string) => Promise<void>;
  assignPortfolioToTeam: (teamId: string, portfolioId: string) => Promise<void>;
  detachPortfolioFromTeam: (teamId: string, portfolioId: string) => Promise<void>;
  updateTeam: (teamId: string, payload: Partial<CreateTeamRequest>) => Promise<void>;
  getTasksByProject: (teamId: string) => Promise<void>

  // Reset
  reset: () => void;
}

/* ---------------------------------- */
/* Store */
/* ---------------------------------- */

export const useTeamStore = create<TeamState & TeamActions>()(
  persist(
    (set, get) => ({
      teams: [],
      activeTeamId: null,

      loading: false,
      error: null,

      calendar: {
        selectedDate: new Date(),
        selectedUserId: "all",
        badgeVariant: "colored",
        workingHours: WORKING_HOURS,
        visibleHours: VISIBLE_HOURS,
        showWeekends: true,
        weekendDays: [0, 6],
      },

      /* ---------- Active Team ---------- */

      setActiveTeamById: (id) => set({ activeTeamId: id }),

      /* ---------- Fetch Teams ---------- */

      fetchTeams: async () => {
        set({ loading: true, error: null });
        try {
          const res = await teamsApi.getTeams();
          const newTeams = (res.teams || []).map(normalizeTeam);

          set((state) => {
            const mergedTeams = newTeams.map((newTeam) => {
              const existingTeam = state.teams.find((t) => t.id === newTeam.id);
              if (!existingTeam) return newTeam;

              // MERGE MEMBERS: Keep the list with more members (fetchTeamById has 3, fetchTeams has 1)
              const mergedMembers =
                existingTeam.teamMembers.length > newTeam.teamMembers.length
                  ? existingTeam.teamMembers
                  : newTeam.teamMembers;

              return {
                ...newTeam,
                teamMembers: mergedMembers,
                memberCount: mergedMembers.length,
              };
            });

            return {
              teams: mergedTeams,
              activeTeamId: state.activeTeamId ?? mergedTeams[0]?.id ?? null,
            };
          });
        } catch (err: any) {
          set({ error: err.message });
        } finally {
          set({ loading: false });
        }
      },

      // fetchTeamById: async (teamId) => {
      //   try {
      //     const res = await teamsApi.getTeamById(teamId);
      //     if (!res?.team) return null;

      //     const normalized = normalizeTeam(res.team);

      //     set(state => ({
      //       teams: state.teams.some(t => t.id === teamId)
      //         ? state.teams.map(t => (t.id === teamId ? normalized : t))
      //         : [...state.teams, normalized],
      //       activeTeamId: teamId,
      //     }));

      //     return normalized;
      //   } catch {
      //     return null;
      //   }
      // },

      fetchTeamById: async (teamId) => {
        try {
          const res = await teamsApi.getTeamById(teamId);
          if (!res?.team) return null;

          const apiTeam = res.team;
          const normalized = normalizeTeam(apiTeam); // still normalize for consistency

          set((state) => {
            const teamExists = state.teams.some((t) => t.id === teamId);

            if (!teamExists) {
              return {
                teams: [...state.teams, normalized],
                activeTeamId: teamId,
              };
            }

            return {
              teams: state.teams.map((t) => {
                if (t.id !== teamId) return t;

                // MERGE: upgraded existing member update
                const mergedMembers = normalized.teamMembers.map((newMember) => {
                  const existingMatch = t.teamMembers.find(
                    (m) => m.id === newMember.id
                  );
                  if (!existingMatch) return newMember;

                  return {
                    ...newMember,
                    name:
                      newMember.name === "User" && existingMatch.name
                        ? existingMatch.name
                        : newMember.name,
                    initials:
                      newMember.name === "User" && existingMatch.initials
                        ? existingMatch.initials
                        : newMember.initials,
                  };
                });

                return {
                  ...normalized,
                  teamMembers: mergedMembers,
                };
              }),
              activeTeamId: teamId,
            };
          });

          return normalized;
        } catch {
          return null;
        }
      },

      /* ---------- Create Team ---------- */
      createTeam: async (payload) => {
        set({ loading: true });
        try {
          const res: TeamApiResponse = await teamsApi.createTeam(payload);
          if (!res?.team) return null;

          const team = normalizeTeam(res.team);

          set(state => ({
            teams: [...state.teams, team],
            activeTeamId: team.id,
          }));

          return team;
        } finally {
          set({ loading: false });
        }
      },

      /* ---------- Add Members ---------- */
      addMember: async (teamId, apiMembers, uiMembers) => {
        if (!apiMembers.length) return;

        const id = String(teamId);

        try {
          // set({ loading: true });

          await teamsApi.addMembers(teamId, apiMembers);

          set(state => ({
            teams: state.teams.map(team =>
              String(team.id) === id
                ? {
                  ...team,
                  teamMembers: [...team.teamMembers, ...uiMembers],
                  memberCount: team.teamMembers.length + uiMembers.length,
                }
                : team
            ),
          }));

          const team = get().teams.find(t => String(t.id) === id);
          if (team?.projectIds?.length) {
            const projectMembers = uiMembers.map(m => ({
              userId: m.userId || m.id,
              role: m.role || "member",
            }));

            const axiosInstance = (await import('@/lib/api/axios-instance')).default;
            const { projects } = (await import('@/stores/projects-store')).useProjectsStore.getState();

            await Promise.allSettled(
              team.projectIds.map(async (projectId) => {
                const project = projects.find(p => p.id === projectId);
                const existingMemberIds = new Set(project?.members?.map(m => m.userId) || []);
                const filteredMembers = projectMembers
                  .filter(m => !existingMemberIds.has(m.userId))
                  .map(m => ({ ...m, teamId: id }));

                if (filteredMembers.length > 0) {
                  const { addUserToProjectFromTeamPatchApi } = await import('@/lib/api/projects-api');
                  return addUserToProjectFromTeamPatchApi(projectId, filteredMembers);
                }
                return Promise.resolve();
              })
            );
          }
        } finally {
          // set({ loading: false });
        }
      },

      /* ---------- Remove Member ---------- */

      removeMember: async (teamId, memberId) => {
        await teamsApi.removeMember(teamId, memberId);

        set(state => ({
          teams: state.teams.map(team => {
            if (team.id !== teamId) return team;

            const updatedMembers = team.teamMembers.filter(
              m => m.id !== memberId
            );

            return {
              ...team,
              teamMembers: updatedMembers,
              memberCount: updatedMembers.length,
            };
          }),
        }));
        await get().fetchTeamById(teamId);
      },

      /* ---------- Delete Team ---------- */

      deleteTeam: async (teamId) => {
        set({ loading: true, error: null });

        try {
          await teamsApi.deleteTeam(teamId);

          set(state => {
            const updatedTeams = state.teams.filter(
              team => String(team.id) !== String(teamId)
            );

            return {
              teams: updatedTeams,
              activeTeamId:
                state.activeTeamId === teamId
                  ? updatedTeams[0]?.id ?? null
                  : state.activeTeamId,
            };
          });
        } catch (err: any) {
          set({ error: err.message || "Failed to delete team" });
        } finally {
          set({ loading: false });
        }
      },

      assignProjectToTeam: async (teamId: string, projectId: string) => {
        try {

          // 1. Call API
          await teamsApi.assignProject(teamId, projectId)
          // 2. Optimistically update local state (like addMember)
          set(state => ({
            teams: state.teams.map(team =>
              team.id === teamId
                ? {
                  ...team,
                  projectIds: [...(team.projectIds || []), projectId],
                }
                : team
            ),
          }))

          // 3. Assign team members to the project (NEW)
          const team = get().teams.find(t => t.id === teamId);
          if (team && team.teamMembers && team.teamMembers.length > 0) {
            // Get existing project members to avoid duplicates
            const projectsStore = (await import('@/stores/projects-store')).useProjectsStore.getState();
            const project = await projectsStore.fetchProjectById(projectId);
            const existingMemberIds = new Set(project?.members?.map(m => m.userId) || []);

            const membersToAdd = team.teamMembers
              .map(m => ({
                userId: m.id || m.userId,
                role: m.role || "member",
                teamId: teamId
              }))
              .filter(m => !existingMemberIds.has(m.userId)); // Filter out existing members

            if (membersToAdd.length > 0) {
              const { addUserToProjectFromTeamPatchApi } = await import('@/lib/api/projects-api');
              await addUserToProjectFromTeamPatchApi(projectId, membersToAdd);

              // Trigger project re-fetch to update members list locally
              await projectsStore.fetchProjects();
            } else {
              console.log("All team members are already in the project", projectId);
            }
          } else {
            console.warn("No team members found to add to project", teamId);
          }

          // 4. Refetch for full project details
          await get().fetchTeamById(teamId)
        } catch (error: any) {
          set({ error: error.message || 'Failed to assign project to team' })
          throw error
        }
      },

      detachProjectFromTeam: async (teamId: string, projectId: string) => {
        try {
          // 1. Call API
          await teamsApi.detachProject(teamId, projectId);

          // 2. Optimistically remove from local state
          set(state => ({
            teams: state.teams.map(team =>
              team.id === teamId
                ? {
                  ...team,
                  projectIds: (team.projectIds || []).filter(id => id !== projectId),
                  projects: (team.projects || []).filter(p => p.id !== projectId),
                }
                : team
            ),
          }));

          // 3. Refetch for consistency
          await get().fetchTeamById(teamId);
        } catch (error: any) {
          set({ error: error.message || 'Failed to detach project from team' });
          throw error;
        }
      },

      assignGoalToTeam: async (teamId: string, goalId: string) => {
        try {
          set({ error: null });

          // 1. Call API
          const goal = await teamsApi.assignGoal(teamId, goalId);

          const mappedGoal = {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            color: goal.color,
          };

          // 2. Optimistic update WITH duplicate check
          set(state => ({
            teams: state.teams.map(team => {
              if (team.id !== teamId) return team;

              const alreadyAssigned = team.goals?.some(
                g => g.id === mappedGoal.id
              );

              if (alreadyAssigned) {
                return team; // prevent duplicate
              }

              return {
                ...team,
                goals: [...(team.goals || []), mappedGoal],
              };
            }),
          }));

          // 3. Refetch for consistency
          await get().fetchTeamById(teamId);
        } catch (error: any) {
          set({ error: error.message || "Failed to assign goal to team" });
          throw error;
        }
      },

      assignPortfolioToTeam: async (teamId: string, portfolioId: string) => {
        try {
          set({ error: null });

          // 1. Call API
          await teamsApi.assignPortfolio(teamId, portfolioId);

          // 2. Optimistic update
          set(state => ({
            teams: state.teams.map(team =>
              team.id === teamId
                ? {
                  ...team,
                  portfolioIds: [...(team.portfolioIds || []), portfolioId],
                }
                : team
            ),
          }));

          // 3. Assign team members as viewers to the portfolio (Filter already existing)
          const team = get().teams.find(t => t.id === teamId);
          if (team && team.teamMembers && team.teamMembers.length > 0) {
            const { usePortfoliosStore } = await import('@/stores/portfolios-store');
            const portfoliosState = usePortfoliosStore.getState();
            const targetPortfolio = portfoliosState.portfolios.find(p => p.id === portfolioId);
            
            const existingViewerIds = new Set(targetPortfolio?.viewers?.map(v => v.userId) || []);
            const newViewerIds = team.teamMembers
              .map(m => m.userId || m.id)
              .filter(id => Boolean(id) && !existingViewerIds.has(id as string)) as string[];

            if (newViewerIds.length > 0) {
              await portfoliosState.addViewersToPortfolio(portfolioId, newViewerIds);
            }
          }

          // 4. Refetch for consistency
          await get().fetchTeamById(teamId);
        } catch (error: any) {
          set({ error: error.message || "Failed to assign portfolio to team" });
          throw error;
        }
      },

      detachPortfolioFromTeam: async (teamId: string, portfolioId: string) => {
        try {
          // 1. Call API
          await teamsApi.detachPortfolio(teamId, portfolioId);

          // 2. Optimistically remove from local state
          set(state => ({
            teams: state.teams.map(team =>
              team.id === teamId
                ? {
                  ...team,
                  portfolioIds: (team.portfolioIds || []).filter(id => id !== portfolioId),
                  portfolios: (team.portfolios || []).filter(p => p.id !== portfolioId),
                }
                : team
            ),
          }));

          // 3. Refetch for consistency
          await get().fetchTeamById(teamId);
        } catch (error: any) {
          set({ error: error.message || 'Failed to detach portfolio from team' });
          throw error;
        }
      },

      updateTeam: async (teamId: string, payload: Partial<CreateTeamRequest>) => {
        try {
          set({ loading: true, error: null });
          await teamsApi.updateTeam(teamId, payload);
          await get().fetchTeamById(teamId);
        } catch (error: any) {
          set({ error: error.message || "Failed to update team" });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      getTasksByProject: async (teamId: string) => {
        try {
          const team = get().teams.find(t => t.id === teamId)
          if (!team?.projectIds?.length) return

          // Fetch tasks for ALL team projects
          const fetchTasks = useTasksStore.getState().fetchTasks;
          await Promise.all(
            team.projectIds.map((projectId) => fetchTasks(projectId))
          )

          // Refresh team to update any optimistic changes
          await get().fetchTeamById(teamId)
        } catch (error) {
          console.error('Failed to fetch team tasks:', error)
        }
      },

      reset: () => {
        set({
          teams: [],
          activeTeamId: null,
          loading: false,
          error: null,
        });
        localStorage.removeItem('team-store');
      },

    }),
    {
      name: "team-store",
      partialize: (state) => ({
        teams: state.teams,
        activeTeamId: state.activeTeamId,
      }),
    }
  )
);
