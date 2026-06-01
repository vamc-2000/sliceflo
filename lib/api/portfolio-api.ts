// lib/api/portfolio-api.ts
import axiosInstance from "./axios-instance";

export interface PortfolioViewer {
  userId: string;
  role: "owner" | "admin" | "member" | string;
}

export type CreatePortfolioViewer = PortfolioViewer;

export interface PortfolioResponse {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  tenantId: string;
  ownerId: string;
  slug: string;
  leaders?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "open" | "closed" | "archived";
  viewers?: PortfolioViewer[];
  teams?: string[];
  projects?: string[];
  goals?: string[];
  labelIds?: string[];
  iconId?: string;
  icon?: any;
  attachments?: any[];
  bannerImage?: string;
  images?: string[];
  startDate?: string;
  endDate?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllPortfoliosResponse {
  portfolios: PortfolioResponse[];
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
  workspaceId: string;
  viewers?: CreatePortfolioViewer[];
  iconId?: string;
  labelIds?: string[];
  startDate?: string;
  endDate?: string;
  slug?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "open" | "closed" | "archived";
  leaderIds?: string[];
  projectIds?: string[];
  teamIds?: string[];
  goalIds?: string[];
}

export interface UpdatePortfolioPayload extends Partial<CreatePortfolioPayload> {}

export interface PatchPortfolioOperation {
  operation:
    | "update_details"
    | "update_icon"
    | "add_viewers"
    | "remove_viewers"
    | "attach_uploads"
    | "remove_uploads"
    | "update_dates"
    | "update_properties"
    | "add_projects"
    | "remove_projects"
    | "add_teams"
    | "remove_teams"
    | "add_goals"
    | "remove_goals";
  data: {
    iconId?: string;
    uploadIds?: string[];
    viewerIds?: string[];
    startDate?: string;
    endDate?: string;
    slug?: string;
    status?: "open" | "closed" | "archived";
    priority?: "low" | "medium" | "high" | "urgent";
    leaderIds?: string[];
    projectIds?: string[];
    teamIds?: string[];
    goalIds?: string[];
    name?: string;
    description?: string;
  };
}

// GET all portfolios
export const getPortfolios = async (workspaceId?: string): Promise<PortfolioResponse[]> => {
  const url = workspaceId ? `/portfolio?workspaceId=${workspaceId}` : "/portfolio";
  const response: GetAllPortfoliosResponse = await axiosInstance.get(url);
  return response.portfolios;
};

// GET portfolio by ID
export const getPortfolioById = async (id: string): Promise<PortfolioResponse> => {
  const response: PortfolioResponse = await axiosInstance.get(`/portfolio/${id}`);
  return response;
};

// POST create a new portfolio
export const createPortfolio = async (payload: CreatePortfolioPayload): Promise<PortfolioResponse> => {
  const response: PortfolioResponse = await axiosInstance.post("/portfolio", payload);
  return response;
};

// PUT update portfolio by ID
export const updatePortfolio = async (id: string, payload: UpdatePortfolioPayload): Promise<PortfolioResponse> => {
  const response: PortfolioResponse = await axiosInstance.put(`/portfolio/${id}`, payload);
  return response;
};

// PATCH portfolio by ID
export const patchPortfolio = async (id: string, payload: PatchPortfolioOperation): Promise<PortfolioResponse> => {
  const response: PortfolioResponse = await axiosInstance.patch(`/portfolio/${id}`, payload);
  return response;
};

/* Operational Patch Helpers (MIRRORING PROJECT PATTERN) */

export const updatePortfolioDetailsPatchApi = async (
  id: string,
  data: { name?: string; description?: string }
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "update_details", data });
};

export const updatePortfolioPropertiesPatchApi = async (
  id: string,
  data: { slug?: string; status?: string; priority?: string; leaderIds?: string[]; name?: string; description?: string }
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "update_properties", data: data as any });
};

export const updatePortfolioDatesPatchApi = async (
  id: string,
  data: { startDate?: string; endDate?: string }
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "update_dates", data });
};

export const addViewersPatchApi = async (
  id: string,
  viewerIds: string[]
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "add_viewers", data: { viewerIds } });
};

export const removeViewersPatchApi = async (
  id: string,
  viewerIds: string[]
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "remove_viewers", data: { viewerIds } });
};

export const updatePortfolioIconPatchApi = async (
  id: string,
  iconId: string
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "update_icon", data: { iconId } });
};

export const attachUploadsPatchApi = async (
  id: string,
  uploadIds: string[]
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "attach_uploads", data: { uploadIds } });
};

export const removeUploadsPatchApi = async (
  id: string,
  uploadIds: string[]
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "remove_uploads", data: { uploadIds } });
};

export const addProjectsPatchApi = async (
  id: string,
  projectIds: string[]
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "add_projects", data: { projectIds } });
};

export const removeProjectsPatchApi = async (
  id: string,
  projectIds: string[]
): Promise<PortfolioResponse> => {
  return patchPortfolio(id, { operation: "remove_projects", data: { projectIds } });
};
