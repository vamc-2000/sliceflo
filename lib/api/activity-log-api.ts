
import axiosInstance from "./axios-instance";
import { TeamActivityLogsResponse } from "@/types/activity-log.types";

export const fetchActivityLogsByActor = async (
  userId: string
): Promise<TeamActivityLogsResponse> => {
  const res = await axiosInstance.get(`/activity-logs/actor/${userId}`);


  console.log("actor raw axios response", res);

  return res as TeamActivityLogsResponse;  
};

// export const fetchActivityLogsByTeam = async (
//   teamId: string
// ): Promise<TeamActivityLogsResponse> => {
//   const res = await axiosInstance.get(`/activity-logs/team/${teamId}`);
//   return res as TeamActivityLogsResponse;   
// };

export const fetchActivityLogsByTeam = async (
  teamId: string
): Promise<TeamActivityLogsResponse> => {
  const res = await axiosInstance.get(`/activity-logs/resource/TEAM/${teamId}`);
  console.log("TeamID", teamId);
  
  console.log("Activity for team", res);
  
  return res as TeamActivityLogsResponse;   
};

export const fetchActivityLogsByProject = async (
  projectId: string
): Promise<TeamActivityLogsResponse> => {
  const res = await axiosInstance.get(`/activity-logs/resource/PROJECT/${projectId}`);
  return res as TeamActivityLogsResponse;
};

export const fetchActivityLogsByPortfolio = async (
  portfolioId: string
): Promise<TeamActivityLogsResponse> => {
  const res = await axiosInstance.get(`/activity-logs/resource/PORTFOLIO/${portfolioId}`);
  return res as TeamActivityLogsResponse;
};

export const fetchActivityLogsByTask = async (
  taskId: string
): Promise<TeamActivityLogsResponse> => {
  const res = await axiosInstance.get(`/activity-logs/resource/TASK/${taskId}`);
  return res as TeamActivityLogsResponse;
};