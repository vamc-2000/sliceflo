

import { useProfileStore } from "@/stores/profile-store";
import axiosInstance from "./axios-instance";
import {
  Goal,
  GoalApiResponse,
  GoalFormData,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalTarget,
  TargetType,
  GoalVisibility,
  GoalStatus
} from "@/types/goal.types";


interface AxiosResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}




const transformApiResponseToGoal = (apiGoal: GoalApiResponse | null | undefined): Goal => {
  // NULL CHECK FIRST - this fixes the crash
  if (!apiGoal) {
    return {
      id: '',
      title: '',
      description: '',
      workspaceId: '',
      startDate: '',
      endDate: '',
      status: 'not-started' as GoalStatus,
      visibility: 'private' as GoalVisibility,
      assignedTo: [],
      createdBy: '',
      createdAt: '',
      updatedAt: '',
      favoritedBy: [],
      owners: [],
      color: '#64748b',
      icon: null,
      assignedTeams: [],
      targets: [],
      users: [],
      teams: [],
      isFavorite: false
    };
  }

  console.log(' API Response:', apiGoal);
  console.log('API Color:', apiGoal.color ?? 'No color');
  console.log(' FavoritedBy:', apiGoal.favoritedBy);
  const extractId = (user: any) => {
    if (typeof user === 'string') return user;
    if (user && typeof user === 'object') return user._id || user.id || '';
    return '';
  };

  const extractUserInfo = (user: any) => {
    if (typeof user === 'string') return user;
    if (user && typeof user === 'object') {
      return {
        id: user._id || user.id || '',
        _id: user._id || user.id || '',
        name: user.name || '',
        email: user.email || '',
        profilePictureUrl: user.profilePictureUrl || user.profilePicture || user.avatar || '',
      };
    }
    return '';
  };

const transformed: Goal = {
    id: apiGoal.id || apiGoal._id || '',
    title: apiGoal.title || '',
    description: apiGoal.description || '',
    workspaceId: apiGoal.workspaceId || '',
    //Always convert to string
    startDate: apiGoal.startDate
        ? typeof apiGoal.startDate === 'number'
            ? new Date(apiGoal.startDate).toISOString()
            : String(apiGoal.startDate)
        : '',
    endDate: apiGoal.endDate
        ? typeof apiGoal.endDate === 'number'
            ? new Date(apiGoal.endDate).toISOString()
            : String(apiGoal.endDate)
        : null,
    status: apiGoal.status || 'not started',
    visibility: apiGoal.visibility || 'private',
    assignedTo: (apiGoal.assignedTo || []).map(extractId),
    createdBy: extractUserInfo(apiGoal.createdBy),
    createdAt: apiGoal.createdAt || '',
    updatedAt: apiGoal.updatedAt || '',
    favoritedBy: apiGoal.favoritedBy || [],
    owners: (apiGoal.owners || []).filter(Boolean).map(extractUserInfo),
    color: apiGoal.color || '#64748b',
    icon: null,
    assignedTeams: apiGoal.assignedTeams || [],
    targets: (apiGoal.targets || []).filter(Boolean).map(transformApiTargetToGoalTarget),
    users: apiGoal.users || [],
    teams: apiGoal.teams || [],
    isFavorite: apiGoal.isFavorite ?? false,
};

return transformed;
};

const transformApiTargetToGoalTarget = (apiTarget: any): GoalTarget => {
  if (!apiTarget) {
    return {
      id: '',
      label: 'Untitled Target',
      type: 'number',
      goalId: '',
      status: 'not started',
      value: { start: 0, end: 0, current: 0 },
      current: 0,
    } as any;
  }
  let value = undefined;
  let current = 0;

  if (apiTarget.type === 'number') {
    if (typeof apiTarget.value === 'number') {
      current = apiTarget.value;
      value = { start: 0, end: apiTarget.value };
    } else if (apiTarget.value?.start !== undefined) {
      value = { start: apiTarget.value.start, end: apiTarget.value.end };
      current = apiTarget.value.start;
    }
  }
  else if (apiTarget.type === 'currency') {
    if (apiTarget.value?.start !== undefined) {
      value = {
        start: apiTarget.value.start,
        end: apiTarget.value.end,
        currencyType: apiTarget.value.currencyType
      };
      current = apiTarget.value.start;
    } else if (apiTarget.value?.value !== undefined) {
      value = {
        start: 0,
        end: apiTarget.value.value,
        currencyType: apiTarget.value.currencyType
      };
      current = apiTarget.value.value;
    }
  }
  else if (apiTarget.type === 'boolean') {
    current = apiTarget.value ? 1 : 0;
  }
  else if (apiTarget.type === 'task') {
    const totalTasks = apiTarget.linkedTaskIds?.length || 0;
    current = totalTasks;
    value = { start: 0, end: totalTasks || 1 };
  }

  return {
    id: apiTarget.id || apiTarget._id,
    label: apiTarget.label,
    description: apiTarget.description,
    type: apiTarget.type,
    goalId: apiTarget.goalId || apiTarget.goal,
    status: apiTarget.status,
    // range: value,
    value: apiTarget.value,
    current: current,
    color: apiTarget.color,
    createdAt: apiTarget.createdAt,
    updatedAt: apiTarget.updatedAt,
    startDate: apiTarget.startDate || apiTarget.start_date || apiTarget.createdAt,
    endDate: apiTarget.endDate || apiTarget.targetDate || apiTarget.dueDate || apiTarget.date || apiTarget.due_date || apiTarget.end_date || apiTarget.createdAt,
    unit: apiTarget.unit,
    assignedTo: apiTarget.assignedTo || apiTarget.assignedUsers || apiTarget.owners || apiTarget.userId || apiTarget.owner || [],
    linkedTaskIds: apiTarget.linkedTaskIds || [],
    notes: apiTarget.notes || [],
    attachments: apiTarget.attachments || [],
    updateHistory: apiTarget.updateHistory || [],
  };
};

export const createGoal = async (
  formData: GoalFormData,
  workspaceId: string
): Promise<Goal> => {
  try {

    const payload: any = {
      title: formData.title,
      description: formData.description,
      status: 'not started',
      visibility: formData.visibility as GoalVisibility,
      color: formData.color,
      workspaceId: workspaceId, 
    };


    const cleanedAssignedTo = (formData.assignedTo || []).filter(id => id && id.trim() !== '');
    payload.assignedTo = cleanedAssignedTo;

    if (formData.startDate) {
      payload.startDate = new Date(formData.startDate).getTime();
    }
    if (formData.endDate) {
      payload.endDate = new Date(formData.endDate).getTime();
    }
    if (formData.assignedTeams && formData.assignedTeams.length > 0) {
      payload.assignedTeams = formData.assignedTeams;
    }
      console.log('createGoal payload:', payload) 
    const response = await axiosInstance.post(
  `goals?workspaceId=${workspaceId}`,  
  payload
)

    const goal = transformApiResponseToGoal((response as any)?.data || response);

    return {
      ...goal,
      icon: formData.icon,
    };
  } catch (error: any) {
 

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Failed to create goal';

    throw new Error(errorMessage);
  }
};


export const getGoals = async (workspaceId: string): Promise<Goal[]> => {
  try {
    const response = await axiosInstance.get<GoalApiResponse[]>(
      `/goals/workspace/${workspaceId}`
    );

    return response.map(transformApiResponseToGoal);
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw new Error('Failed to fetch goals');
  }
};

/**
 * Get a single goal by ID
 * GET /goals/{id}
 */
export const getGoalById = async (id: string, workspaceId?: string): Promise<Goal> => {
  console.log('getGoalById called with id:', id, typeof id)
  try {
    if (!id || id === 'undefined' || id === '[id]') {
      throw new Error('Invalid goal ID');
    }
    console.log(' Calling URL:', `/goals/goal/${id}`)
    const response = await axiosInstance.get<GoalApiResponse>(`goals/goals/${id}`);
     console.log(' Raw API response:', response)
      console.log(' Raw API response:', response)
    const goalData = (response as any)?.data || (response as any)?.goal || response;

    return transformApiResponseToGoal(goalData);
  } catch (error: any) {
    console.error(`Error fetching goal (ID: ${id}):`, error.message);
    if (error.response) {
      console.error('API Error Details (Stringified):', JSON.stringify({
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      }, null, 2));
    }
    throw new Error('Failed to fetch goal');
  }
};

/**
 * Update a goal
 * PATCH /goals/{id}
 */
export const updateGoal = async (
  id: string,
  formData: Partial<GoalFormData>,

): Promise<Goal> => {
  try {
    const payload: UpdateGoalRequest = {};

    if (formData.title !== undefined) payload.title = formData.title;
    if (formData.description !== undefined) payload.description = formData.description;
    if (formData.color !== undefined) payload.color = formData.color;

    if (formData.visibility !== undefined) payload.visibility = formData.visibility as GoalVisibility;
    if (formData.assignedTo?.length) payload.assignedTo = formData.assignedTo; 
    if (formData.assignedTeams && formData.assignedTeams.length > 0) {
      payload.assignedTeams = formData.assignedTeams;
    }
    if (formData.endDate !== undefined) {
      payload.endDate = formData.endDate ? new Date(formData.endDate).getTime() : null;
    }
    if (formData.startDate !== undefined) {
      payload.startDate = formData.startDate ? new Date(formData.startDate).getTime() : undefined;
    }


    console.log('Update payload:', payload); 


    const response = await axiosInstance.patch<GoalApiResponse>(`goals/${id}`, payload);
    const goal = transformApiResponseToGoal((response as any)?.data || response);


    return {
      ...goal,
      icon: formData.icon ?? goal.icon,
    };
  } catch (error) {
    console.error('Error updating goal:', error);
    throw new Error('Failed to update goal');
  }
};

/**
 * Update goal status
 * PATCH /goals/{id}
 */
export const updateGoalStatus = async (
  id: string,
  status: 'not started' | 'in progress' | 'completed' | 'on hold',
  workspaceId?: string
): Promise<Goal> => {
  try {
    const response = await axiosInstance.patch<GoalApiResponse>(`goals/${id}`, { status });
    const goal = transformApiResponseToGoal((response as any)?.data || response);
    return goal;
  } catch (error) {
    console.error('Error updating goal status:', error);
    throw new Error('Failed to update goal status');
  }
};

export const favoriteGoal = async (goalId: string): Promise<Goal> => {
  console.log('Toggling favorite for:', goalId);
  await axiosInstance.post(`goals/${goalId}/favorite`);
  const goal = await getGoalById(goalId); 
  return goal;
};

export const unfavoriteGoal = async (goalId: string): Promise<Goal> => {
  console.log('Toggling unfavorite for:', goalId);
  await axiosInstance.delete(`goals/${goalId}/favorite`);
  const goal = await getGoalById(goalId);
  return goal;
};


/**
 * Delete a goal
 * DELETE /goals/{id}
 */
export const deleteGoal = async (id: string, workspaceId?: string): Promise<void> => {
  try {
    const url = workspaceId
      ? `/goals/${id}?workspaceId=${workspaceId}`
      : `/goals/${id}`;
    await axiosInstance.delete(url);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw new Error('Failed to delete goal');
  }
};

export const createTargetForGoal = async (
  goalId: string,
  body: {
    label: string;
    type: TargetType;
    unit?: string;
    value?: any;
    linkedTaskIds?: string[];
    status?: string;
    color?: string;
    assignedTo?: (string | any)[];
    startDate?: string;
    endDate?: string;
  },
  workspaceId?: string
): Promise<GoalTarget> => {
  try {
    const res = await axiosInstance.post(`goals/${goalId}/targets`, body);
    const targetData = res || res.data;
    return transformApiTargetToGoalTarget(targetData);

  } catch (error) {
    console.error('Error creating target for goal:', error);
    throw new Error('Failed to create target for goal');
  }
};

export const getTargetsForGoal = async (goalId: string): Promise<GoalTarget[]> => {
  const res = await axiosInstance.get(`goals/${goalId}/targets`);
  const targetData = res || res.data || [];
  const targets = Array.isArray(targetData)
    ? targetData.map(transformApiTargetToGoalTarget)
    : [];
  console.log('Transformed targets:', targets);
  return targets;
};
export const updateTargetForGoal = async (
    targetId: string,
    body: any,
): Promise<GoalTarget> => {
    console.log(' updateTarget payload:', JSON.stringify(body, null, 2));
    
    try {
        const res = await axiosInstance.patch(`/goals/targets/${targetId}`, body);
        const targetData = res?.data || res;

        if (!targetData) {
            throw new Error("Backend returned no data");
        }

        return transformApiTargetToGoalTarget(targetData);
    } catch (error: any) {
     
        console.error(' updateTarget error response:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            errors: error.response?.data?.errors,   
            data: error.response?.data,             
        });
        throw error;
    }
   }


/**
 * Delete a target
 * DELETE /goals/targets/{id}
 */
export const deleteTargetForGoal = async (
  targetId: string,
  workspaceId?: string
): Promise<void> => {
  console.log(' DELETE Target:', targetId);
  const url = workspaceId
    ? `/goals/targets/${targetId}?workspaceId=${workspaceId}`
    : `/goals/targets/${targetId}`;
  await axiosInstance.delete(url);
};

export const addTargetNote = async (
  targetId: string,
  body: {
    note: string;
    number: number;
    done: boolean;
    currencyValue: number;
  },
  workspaceId?: string
): Promise<GoalTarget> => {
  const url = workspaceId
    ? `/goals/targets/${targetId}/notes?workspaceId=${workspaceId}`
    : `/goals/targets/${targetId}/notes`;
  const res = await axiosInstance.post(url, body);
  const targetData = res || res.data;

  if (!targetData) {
    throw new Error('Backend returned no data');
  }

  return transformApiTargetToGoalTarget(targetData);
};



/**
 * Remove a user from a goal
 * DELETE /goals/{goalId}/users/{userId}
 */
export const removeGoalMember = async (goalId: string, userId: string): Promise<GoalApiResponse> => {
  try {
    const response = await axiosInstance.delete<GoalApiResponse>(`goals/${goalId}/users/${userId}`);
    return (response as any).data || response;
  } catch (error) {
    console.error('Error removing goal member:', error);
    throw new Error('Failed to remove goal member');
  }
};

/**
 * Add a user to a goal
 * POST /goals/{goalId}/users/{userId}
 */
export const addGoalMember = async (goalId: string, userId: string): Promise<GoalApiResponse> => {
  try {
    const response = await axiosInstance.post<GoalApiResponse>(`goals/${goalId}/users/${userId}`);
    return (response as any).data || response;
  } catch (error) {
    console.error('Error adding goal member:', error);
    throw new Error('Failed to add goal member');
  }
};
