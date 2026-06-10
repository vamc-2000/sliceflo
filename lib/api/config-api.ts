import axiosInstance from './axios-instance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export interface ConfigRole {
  id: string;
  name: string;
}

export interface ConfigResponse {
  roles: ConfigRole[];
}

export const configApi = {
  // Get system configuration including roles
  getConfig: async (): Promise<ConfigResponse> => {
    const response = await axiosInstance.get<ConfigResponse>(
      `${API_BASE_URL}/config`
    );
    return response;
  },
};
