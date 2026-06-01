import { DefaultWorkspaceRequest, DefaultWorkspaceResponse, Profile, MyWorkResponse } from "@/types/profile.types";
import axiosInstance from "./axios-instance";
import type { UpdateDiscussionPinPayload } from "@/types/profile.types";

export type ProfileUpdatePayload = Partial<Profile>;

export interface ProfilePictureResponse {
  s3Key: string;
}

export interface ProfileResponse {
  message: string;
  success: boolean;  
}

export interface DeleteResponse {
  success: boolean; 
  message?: string;
}

// Upload profile picture
export const uploadProfilePicture = async (file: File): Promise<ProfilePictureResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.put<ProfilePictureResponse>(
    "/profile/picture",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  // console.log("uploadProfilePicture API data:", response);
  return response;
};

// Update profile
export const updateProfile = async (payload: ProfileUpdatePayload): Promise<ProfileResponse> => {
  return await axiosInstance.patch<ProfileResponse>("/profile", payload);
};

export const updateDiscussionPins = async (
  payload: UpdateDiscussionPinPayload
): Promise<ProfileResponse> => {
  return await axiosInstance.patch<ProfileResponse>("/profile", payload);
};

// Fetch profile
export const fetchProfile = async (): Promise<Profile> => {
  const response = await axiosInstance.get<Profile>("/profile");
  // console.log("Fetched profile data:", response);
  return response;
};

//Default workspace
export const defaultWorkspace = async (payload: DefaultWorkspaceRequest): Promise<DefaultWorkspaceResponse> => {
  const response = await axiosInstance.post<DefaultWorkspaceResponse>("/profile/workspaces/default", payload);
  return response;
}

// Deactivate account
export const deactivateAccount = async (): Promise<ProfileResponse> => {
  return await axiosInstance.post("/profile/deactivate");
};

// Delete account - POST method
export const deleteAccount = async (): Promise<ProfileResponse> => {
  return await axiosInstance.post("/profile/delete");
};

// Fetch my work overview
export const fetchMyWork = async (days: number = 30): Promise<MyWorkResponse> => {
  const response = await axiosInstance.get<MyWorkResponse>(`/mywork`, {
    params: { days }
  });
  return response;
};

// Delete account

