import { CreateTeamRequest, Team, TeamMember, TeamApiResponse, AddMemberRequest, FetchTeamResponse } from '@/types/teams.types';

import axios from 'axios';
import axiosInstance from './axios-instance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Teams API
export const teamsApi = {
  // Get all teams
  getTeams: async (): Promise<FetchTeamResponse> => {
    const response = await axiosInstance.get<FetchTeamResponse>(`${API_BASE_URL}/teams`);
    // console.log("getTeams response:", response);    
    return response || [];
  },

  // Get single team by ID
  getTeamById: async (id: string): Promise<TeamApiResponse> => {
    const response = await axiosInstance.get<TeamApiResponse>(`${API_BASE_URL}/teams/${id}`);
    return response;
  },

  // Create new team
  createTeam: async (data: CreateTeamRequest): Promise<TeamApiResponse> => {
    const response = await axiosInstance.post(`${API_BASE_URL}/teams`, data);
    return response;
  },

  // Update team
  updateTeam: async (id: string, data: Partial<CreateTeamRequest>): Promise<TeamApiResponse> => {
    const response = await axiosInstance.put(`${API_BASE_URL}/teams/${id}`, data);
    return response;
  },

  // Delete team
  deleteTeam: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/teams/${id}`);
    // return response;
  },

  // Add members to team
  addMembers: async (teamId: string, members: AddMemberRequest[]): Promise<TeamApiResponse> => {
    const response = await axiosInstance.post<TeamApiResponse>(`${API_BASE_URL}/teams/${teamId}/members`, { members });
    // console.log("Add members response: ", response);
    return response;
  },

  // Remove member from team
  removeMember: async (teamId: string, memberId: string): Promise<void> => {
    await axiosInstance.delete(
      `${API_BASE_URL}/teams/${teamId}/members`,
      {
        data: {
          userIds: [memberId],
        },
      }
    );
  },

  // Update member
  updateMember: async (teamId: string, memberId: string, updates: Partial<TeamMember>): Promise<TeamMember> => {
    const response = await axiosInstance.patch(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, updates);
    return response;
  },

  //Assign project to team
  assignProject: async (teamId: string, projectId: string) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/teams/${teamId}/projects/${projectId}`);
    return response;
  },

  // Detach project from team
  detachProject: async (teamId: string, projectId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `${API_BASE_URL}/teams/${teamId}/projects/${projectId}`
    );
    return response;
  },

  //Assign goal to team
  assignGoal: async (teamId: string, goalId: string) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/teams/${teamId}/goals/${goalId}`);
    return response;
  },

  //Detach goal from team
  detachGoal: async (teamId: string, goalId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `${API_BASE_URL}/teams/${teamId}/goals/${goalId}`
    );
    return response;
  },

  //Assign portfolio to team
  assignPortfolio: async (teamId: string, portfolioId: string) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/teams/${teamId}/portfolios/${portfolioId}`);
    return response;
  },

  //Detach portfolio from team
  detachPortfolio: async (teamId: string, portfolioId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `${API_BASE_URL}/teams/${teamId}/portfolios/${portfolioId}`
    );
    return response;
  }
};
