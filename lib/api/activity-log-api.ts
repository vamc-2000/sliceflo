import axiosInstance from "./axios-instance";
import { TeamActivityLogsResponse } from "@/types/activity-log.types";

export const fetchActivityLogsByActor = async (
  userId: string,
  page?: number,
  limit?: number
): Promise<TeamActivityLogsResponse> => {
  const url = page && limit
    ? `/activity-logs/actor/${userId}?page=${page}&limit=${limit}`
    : `/activity-logs/actor/${userId}`;
  const res = await axiosInstance.get(url);
  console.log("actor raw axios response", res);
  return res as TeamActivityLogsResponse;  
};

export const fetchActivityLogsByTeam = async (
  teamId: string,
  page?: number,
  limit?: number
): Promise<TeamActivityLogsResponse> => {
  const url = page && limit
    ? `/activity-logs/resource/TEAM/${teamId}?page=${page}&limit=${limit}`
    : `/activity-logs/resource/TEAM/${teamId}`;
  const res = await axiosInstance.get(url);
  console.log("TeamID", teamId);
  console.log("Activity for team", res);
  return res as TeamActivityLogsResponse;   
};

export const fetchActivityLogsByProject = async (
  projectId: string,
  page?: number,
  limit?: number
): Promise<TeamActivityLogsResponse> => {
  const url = page && limit
    ? `/activity-logs/resource/PROJECT/${projectId}?page=${page}&limit=${limit}`
    : `/activity-logs/resource/PROJECT/${projectId}`;
  const res = await axiosInstance.get(url);
  return res as TeamActivityLogsResponse;
};

export const fetchActivityLogsByPortfolio = async (
  portfolioId: string,
  page?: number,
  limit?: number
): Promise<TeamActivityLogsResponse> => {
  const url = page && limit
    ? `/activity-logs/resource/PORTFOLIO/${portfolioId}?page=${page}&limit=${limit}`
    : `/activity-logs/resource/PORTFOLIO/${portfolioId}`;
  const res = await axiosInstance.get(url);
  return res as TeamActivityLogsResponse;
};

export const fetchActivityLogsByTask = async (
  taskId: string,
  page?: number,
  limit?: number
): Promise<TeamActivityLogsResponse> => {
  const url = page && limit
    ? `/activity-logs/resource/TASK/${taskId}?page=${page}&limit=${limit}`
    : `/activity-logs/resource/TASK/${taskId}`;
  const res = await axiosInstance.get(url);
  return res as TeamActivityLogsResponse;
};