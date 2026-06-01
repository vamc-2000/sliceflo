// lib/api/tasks-api.ts
import axiosInstance from './axios-instance';
import { TaskResponse, CreateTaskRequest, UpdateTaskRequest } from '@/types/task.types';

// GET /task?projectId=xxx — Get all tasks for a project
export const getTasksApi = async (projectId: string): Promise<TaskResponse[]> => {
  const data = await axiosInstance.get<{ tasks: TaskResponse[] }>(`/task?projectId=${projectId}`);
  return data.tasks ?? [];
};

// GET /task/:id — Get task by ID
export const getTaskByIdApi = async (taskId: string): Promise<TaskResponse> => {
  const data = await axiosInstance.get<TaskResponse>(`/task/${taskId}`);
  return data;
};

// POST /task — Create a new task
export const createTaskApi = async (payload: CreateTaskRequest): Promise<TaskResponse> => {
  const data = await axiosInstance.post<TaskResponse>('/task', payload);
  return data;
};

// PUT /task/:id — Update task by ID
export const updateTaskApi = async (
  taskId: string,
  payload: UpdateTaskRequest
): Promise<TaskResponse> => {
  const data = await axiosInstance.put<TaskResponse>(`/task/${taskId}`, payload);
  return data;
};

// DELETE /task/:id — Delete task by ID
export const deleteTaskApi = async (taskId: string): Promise<void> => {
  await axiosInstance.delete(`/task/${taskId}`);
};

// PUT /task/:id/status — Update task status only
export const updateTaskStatusApi = async (
  taskId: string,
  status: string
): Promise<void> => {
  await axiosInstance.put(`/task/${taskId}/status`, { status });
};

// PUT /task/:id/assign — Assign task to user
export const assignTaskApi = async (
  taskId: string,
  assigneeId: string
): Promise<void> => {
  await axiosInstance.put(`/task/${taskId}/assign`, { assigneeId });
};