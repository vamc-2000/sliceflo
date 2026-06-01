



import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Goal, GoalFormData, GoalTarget, TargetType } from '@/types/goal.types';
import * as goalsApi from '@/lib/api/goals.api';
import { useProfileStore } from './profile-store';


interface GoalsState {
  goals: Goal[];
  currentGoal: Goal | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;

  targetsByGoal: Record<string, GoalTarget[]>;

  fetchGoals: (workspaceId: string) => Promise<void>;
  getGoalById: (id: string, skipLoading?: boolean, workspaceId?: string) => Promise<Goal | null>;
  createGoal: (formData: GoalFormData, workspaceId: string) => Promise<Goal>;
  updateGoal: (id: string, formData: Partial<Goal>, optimistic?: boolean, workspaceId?: string) => Promise<void>;

  updateGoalOptimistic: (id: string, updates: Partial<Goal>) => void;
  removeGoalMember: (goalId: string, userId: string) => Promise<void>;
  addGoalMember: (goalId: string, userId: string) => Promise<void>;
  deleteGoal: (id: string, workspaceId?: string) => Promise<void>;
  updateGoalStatus: (id: string, status: 'not started' | 'in progress' | 'completed' | 'on hold', workspaceId?: string) => Promise<void>;
  refreshGoal: (id: string, workspaceId?: string) => Promise<void>;
  clearError: () => void;
  resetStore: () => void;

  fetchTargetsForGoal: (goalId: string, workspaceId?: string) => Promise<GoalTarget[]>;
  createTarget: (
    goalId: string,
    body: {
      label: string;
      type: TargetType;
      unit?: string;
      value?: any;
      status?: string;
      linkedTaskIds?: string[];
      color?: string;
      assignedTo?: string | any;
      startDate?: string;
      endDate?: string;
    },
    workspaceId?: string
  ) => Promise<GoalTarget | null>;
  updateTarget: (goalId: string, targetId: string, updates: Partial<GoalTarget>, workspaceId?: string) => Promise<GoalTarget>;

  deleteTarget: (goalId: string, targetId: string, workspaceId?: string) => Promise<void>;

  updateTargetLocal: (goalId: string, targetId: string, updates: Partial<GoalTarget>) => void;
  addTargetNote: (goalId: string, targetId: string, payload: { note: string; number: number; done: boolean; currencyValue: number }, workspaceId?: string) => Promise<GoalTarget>;
  toggleFavorite: (goalId: string, workspaceId?: string) => Promise<void>;
}


export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      currentGoal: null,
      isLoading: false,
      isFetching: false,
      error: null,

      targetsByGoal: {},

      fetchGoals: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const goals = await goalsApi.getGoals(workspaceId);
          const filteredGoals = goals.filter((g: Goal) => g.workspaceId === workspaceId);

          const profileUser = useProfileStore.getState().user;
          const currentUserId = (profileUser as any)?.id || profileUser?._id;

          const goalsWithFavorites = filteredGoals.map((goal: Goal) => {
            const isFavorite = currentUserId && Array.isArray(goal.favoritedBy) && goal.favoritedBy.length > 0
              ? goal.favoritedBy.some((userId: any) => {
                const id = typeof userId === 'string' ? userId : userId?.id || userId?._id;
                return id === currentUserId;
              })
              : false;

            return {
              ...goal,
              isFavorite
            };
          });

          set({ goals: goalsWithFavorites, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goals';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      getGoalById: async (id: string, skipLoading = false, workspaceId?: string) => {
        if (!skipLoading) {
          set({ isLoading: true, error: null });
        }

        try {
          const goal = await goalsApi.getGoalById(id, workspaceId);

          // Recalculate isFavorite
          const profileUser = useProfileStore.getState().user;
          const currentUserId = (profileUser as any)?.id || profileUser?._id;

          const isFavorite = currentUserId && Array.isArray(goal.favoritedBy)
            ? goal.favoritedBy.some((userId: any) => {
              const id = typeof userId === 'string' ? userId : userId?.id || userId?._id;
              return id === currentUserId;
            })
            : false;

          const goalWithFavorite = { ...goal, isFavorite };

          set((state) => ({
            goals: state.goals.map((g) => (g.id === id ? goalWithFavorite : g)),
            currentGoal: goalWithFavorite,
            isLoading: false,
          }));

          return goalWithFavorite;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch goal';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },


      createGoal: async (formData: GoalFormData, workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const newGoal = await goalsApi.createGoal(formData, workspaceId);
          set((state) => ({
            goals: [newGoal, ...state.goals],
            isLoading: false,
          }));
          return newGoal;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create goal';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateGoalOptimistic: (id: string, updates: Partial<Goal>) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
          currentGoal: state.currentGoal?.id === id
            ? { ...state.currentGoal, ...updates }
            : state.currentGoal,
        }));
      },

      updateGoal: async (id: string, formData: Partial<Goal>, optimistic = true, ) => {
        const originalGoals = get().goals;
        const originalCurrentGoal = get().currentGoal;

        if (optimistic) {
          get().updateGoalOptimistic(id, formData as Partial<Goal>);
        } else {
          set({ isLoading: true, error: null });
        }

        set({ isFetching: true });

        try {
          const updatedGoal = await goalsApi.updateGoal(id, formData,);

          set((state) => ({
            goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
            currentGoal: state.currentGoal?.id === id ? updatedGoal : state.currentGoal,
            isLoading: false,
            isFetching: false,
          }));
        } catch (error) {
          set({
            goals: originalGoals,
            currentGoal: originalCurrentGoal,
            error: error instanceof Error ? error.message : 'Failed to update goal',
            isLoading: false,
            isFetching: false,
          });
          throw error;
        }
      },
      removeGoalMember: async (goalId: string, userId: string) => {
        set({ isFetching: true });
        try {
          const apiResponse = await goalsApi.removeGoalMember(goalId, userId);
       
          await get().refreshGoal(goalId);
          set({ isFetching: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to remove member',
            isFetching: false,
          });
          throw error;
        }
      },
      addGoalMember: async (goalId: string, userId: string) => {
        set({ isFetching: true });
        try {
          await goalsApi.addGoalMember(goalId, userId);
          await get().refreshGoal(goalId);
          set({ isFetching: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add member',
            isFetching: false,
          });
          throw error;
        }
      },
      deleteGoal: async (id: string, workspaceId?: string) => {
        const originalGoals = get().goals;

        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          isFetching: true,
        }));

        try {
          await goalsApi.deleteGoal(id, workspaceId);
          set({ isFetching: false });
        } catch (error) {
          set({
            goals: originalGoals,
            error: error instanceof Error ? error.message : 'Failed to delete goal',
            isFetching: false,
          });
          throw error;
        }
      },

      updateGoalStatus: async (
        id: string,
        status: 'not started' | 'in progress' | 'completed' | 'on hold',
        workspaceId?: string
      ) => {
        const originalGoals = get().goals;
        const originalCurrentGoal = get().currentGoal;

        get().updateGoalOptimistic(id, { status });
        set({ isFetching: true });

        try {
          const updatedGoal = await goalsApi.updateGoalStatus(id, status, workspaceId);

          set((state) => ({
            goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
            currentGoal: state.currentGoal?.id === id ? updatedGoal : state.currentGoal,
            isFetching: false,
          }));
        } catch (error) {
          set({
            goals: originalGoals,
            currentGoal: originalCurrentGoal,
            error: error instanceof Error ? error.message : 'Failed to update goal status',
            isFetching: false,
          });
          throw error;
        }
      },
      refreshGoal: async (id: string, workspaceId?: string) => {
        set({ isFetching: true });
        try {
          const goal = await goalsApi.getGoalById(id, workspaceId);
          set((state) => ({
            goals: state.goals.map((g) => (g.id === id ? goal : g)),
            currentGoal: state.currentGoal?.id === id ? goal : state.currentGoal,
            isFetching: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh goal',
            isFetching: false,
          });
        }
      },
      fetchTargetsForGoal: async (goalId: string, workspaceId?: string) => {
        try {
          const targets = await goalsApi.getTargetsForGoal(goalId);

          set((state) => {
            const existingTargets = state.targetsByGoal[goalId] || [];
            
            const cleanedTargets = targets.map((backendTarget: GoalTarget) => {
              const existingTarget = existingTargets.find((t) => t.id === backendTarget.id);
              
              const calculatePercentage = (val: any) => {
                if (!val || val === null || val === undefined) return 0;
                if (typeof val === "object") {
                  const current = Number(val.current ?? val.start ?? 0);
                  const end = Number(val.end ?? 1);
                  const start = Number(val.start ?? 0);
                  if (end === start) return 0;
                  return Math.round((current / end) * 100);
                }
                return 0;
              };

              if (existingTarget && existingTarget.localNotes && existingTarget.localNotes.length > 0) {
                let filteredLocalNotes = [...existingTarget.localNotes];

                if (backendTarget.updateHistory && backendTarget.updateHistory.length > 0) {
                  filteredLocalNotes = existingTarget.localNotes.filter((localNote) => {
                    return !backendTarget.updateHistory!.some((history) => {
                      const historyPercent = calculatePercentage(history.newValue);
                      const historyTime = new Date(history.updatedAt).getTime();
                      const localNoteTime = new Date(localNote.at).getTime();
                      return (
                        historyPercent === localNote.percent &&
                        Math.abs(historyTime - localNoteTime) < 10000
                      );
                    });
                  });
                }

                return {
                  ...backendTarget,
                  localNotes: filteredLocalNotes.length > 0 ? filteredLocalNotes : undefined,
                };
              }
              
              return backendTarget;
            });

            return {
              targetsByGoal: {
                ...state.targetsByGoal,
                [goalId]: cleanedTargets,
              },
            };
          });

          return targets;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch targets";
          set({ error: errorMessage });
          throw error;
        }
      },
      createTarget: async (goalId, body, workspaceId) => {
        try {
          const created = await goalsApi.createTargetForGoal(goalId, body, workspaceId);

          if (!created || !created.id || !created.type) {
            console.error(' Invalid target from API:', created);
            throw new Error('Backend returned invalid target');
          }

          set((state) => {
            const existing = (state.targetsByGoal[goalId] || []).filter(Boolean);
            return {
              targetsByGoal: {
                ...state.targetsByGoal,
                [goalId]: [...existing, created],
              },
            };
          });

          setTimeout(() => {
            get().fetchTargetsForGoal(goalId, workspaceId);
          }, 100);

          return created;
        } catch (error) {
          console.error(' createTarget failed:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to create target' });
          return null;
        }
      },

      updateTarget: async (goalId, targetId, updates) => {
        try {
          console.log(" Updating target in store:", targetId, updates);

          const updated = await goalsApi.updateTargetForGoal(targetId, updates,);

          if (!updated || !updated.id) {
            console.error(" Invalid response from update:", updated);
            throw new Error("Backend returned invalid target");
          }

          set((state) => {
            const existingForGoal = state.targetsByGoal[goalId] || [];
            const existingTarget = existingForGoal.find((t) => t.id === targetId);
            
            const calculatePercentage = (val: any) => {
              if (!val || val === null || val === undefined) return 0;
              if (typeof val === "object") {
                const current = Number(val.current ?? val.start ?? 0);
                const end = Number(val.end ?? 1);
                const start = Number(val.start ?? 0);
                if (end === start) return 0;
                return Math.round((current / end) * 100);
              }
              return 0;
            };

       
            const finalTarget = existingTarget
              ? {
                  ...updated,
           
                  localNotes: updated.updateHistory && updated.updateHistory.length > 0
                    ? existingTarget.localNotes?.filter((localNote) => {
                        return !updated.updateHistory!.some((history) => {
                          const historyPercent = calculatePercentage(history.newValue);
                          const historyTime = new Date(history.updatedAt).getTime();
                          const localNoteTime = new Date(localNote.at).getTime();
                          return (
                            historyPercent === localNote.percent &&
                            Math.abs(historyTime - localNoteTime) < 10000
                          );
                        });
                      }) || []
                    : existingTarget.localNotes || [],
                }
              : updated;

            const updatedForGoal = existingForGoal.map((t) =>
              t.id === targetId ? finalTarget : t
            );

            return {
              targetsByGoal: {
                ...state.targetsByGoal,
                [goalId]: updatedForGoal,
              },
            };
          });
          return updated;
        } catch (error) {
          console.error(" updateTarget failed:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to update target",
          });
          throw error;
        }
      },

      updateTargetLocal: (goalId, targetId, updates) => {
        set((state) => {
          const existingForGoal = state.targetsByGoal[goalId] || [];
          const updatedForGoal = existingForGoal.map((t) =>
            t.id === targetId ? { ...t, ...updates } : t
          );

          return {
            targetsByGoal: {
              ...state.targetsByGoal,
              [goalId]: updatedForGoal,
            },
          };
        });
      },

      addTargetNote: async (goalId, targetId, payload, workspaceId?: string) => {
        try {
          const updated = await goalsApi.addTargetNote(targetId, payload, workspaceId);
          
          set((state) => {
            const existingForGoal = state.targetsByGoal[goalId] || [];
            const updatedForGoal = existingForGoal.map((t) =>
              t.id === targetId ? updated : t
            );

            return {
              targetsByGoal: {
                ...state.targetsByGoal,
                [goalId]: updatedForGoal,
              },
            };
          });
          
          return updated;
        } catch (error) {
          console.error("addTargetNote failed:", error);
          set({ error: error instanceof Error ? error.message : "Failed to add note" });
          throw error;
        }
      },


      deleteTarget: async (goalId, targetId, workspaceId?: string) => {
        try {
          console.log(' Deleting target:', targetId);

          set((state) => {
            const existingForGoal = state.targetsByGoal[goalId] || [];
            const updatedForGoal = existingForGoal.filter((t: any) => t.id !== targetId);

            return {
              targetsByGoal: {
                ...state.targetsByGoal,
                [goalId]: updatedForGoal,
              },
            };
          });

          await goalsApi.deleteTargetForGoal(targetId, workspaceId);

          console.log(' Target deleted from backend');

          setTimeout(() => {
            get().fetchTargetsForGoal(goalId, workspaceId);
          }, 100);

        } catch (error) {
          console.error(' deleteTarget failed:', error);

          await get().fetchTargetsForGoal(goalId, workspaceId);

          set({ error: error instanceof Error ? error.message : 'Failed to delete target' });
          throw error;
        }
      },

      toggleFavorite: async (goalId: string, workspaceId?: string) => {
        const originalGoals = get().goals;
        const target = originalGoals.find((g: Goal) => g.id === goalId);
        if (!target) return;

        const isCurrentlyFavorite = !!target.isFavorite;

        set({
          goals: originalGoals.map((g: Goal) =>
            g.id === goalId ? { ...g, isFavorite: !isCurrentlyFavorite } : g
          ),
        });

        try {
          if (isCurrentlyFavorite) {
            await goalsApi.unfavoriteGoal(goalId);
          } else {
            await goalsApi.favoriteGoal(goalId);
          }


        } catch (error) {
          console.error('toggleFavorite error:', error);
        }
      },
      clearError: () => set({ error: null }),

      resetStore: () => {
        localStorage.removeItem('goals-storage');
      }
    }),
    {
      name: 'goals-storage',
      partialize: (state) => ({
        goals: state.goals.map((goal: Goal) => ({
          ...goal,
          isFavorite: goal.isFavorite ?? false,
        })),
        targetsByGoal: state.targetsByGoal,
      }),
    }
  )
);

