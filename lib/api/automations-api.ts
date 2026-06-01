// ─────────────────────────────────────────────
// AUTOMATION API FUNCTIONS
// lib/api/automations-api.ts
// ─────────────────────────────────────────────

import type {
  Automation,
  CreateAutomationPayload,
  TriggerOption,
  ActionOption,
  ConditionOperator,
  ConditionType,
} from "@/types/automation.types";
import axiosInstance from "./axios-instance";

// ── Project Automations ──────────────────────

// GET /project/{projectId}/automations
export const getAutomationsApi = async (projectId: string): Promise<Automation[]> => {
  return await axiosInstance.get(`/project/${projectId}/automations`);
};


// POST /project/{projectId}/automations
export const createAutomationApi = async (projectId: string, payload: CreateAutomationPayload) => {
  return await axiosInstance.post(`/project/${projectId}/automations`, payload);
};
// PUT /project/{projectId}/automations/{automationId}
export const updateAutomationApi = async (projectId: string, automationId: string, payload: any) => {
  return await axiosInstance.put(`/project/${projectId}/automations/${automationId}`, payload);
};

// DELETE /project/{projectId}/automations/{automationId}
export const deleteAutomationApi = async (projectId: string, automationId: string) => {
  return await axiosInstance.delete(`/project/${projectId}/automations/${automationId}`);
};
// GET /project/{projectId}/automations/{automationId}
export const getAutomationByIdApi = async (projectId: string, automationId: string) => {
  return await axiosInstance.get(`/project/${projectId}/automations/${automationId}`);
};
// ── Metadata Endpoints ───────────────────────

// GET /project/automations/triggers
export const getTriggersApi = async (): Promise<TriggerOption[]> => {
  return await axiosInstance.get(`/project/automations/triggers`);
};

// GET /project/automations/actions
export const getActionsApi = async (): Promise<ActionOption[]> => {
  return await axiosInstance.get(`/project/automations/actions`);
};

export const getConditionsApi = async (): Promise<ConditionOperator[]> => {
  return await axiosInstance.get(`/project/automations/conditions`);
};

export const getConditionTypesApi = async (): Promise<ConditionType[]> => {
  return await axiosInstance.get(`/project/automations/condition-types`);
};
