import { Email, MailboxListResponse } from "@/types/mailbox.types";
import axiosInstance from "./axios-instance";

export interface MailQueryParams {
  read?: boolean;
  deleted?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const mailboxApi = {
  async getMails(params: Record<string, any> = {}): Promise<{ emails: Email[]; pagination?: MailboxListResponse['pagination'] }> {

    try {
      const defaultParams: MailQueryParams = {
        // read: undefined,
        deleted: false,
        limit: 100,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      // const response = await axiosInstance.get<MailboxListResponse>('/mailbox', { params: { ...defaultParams, ...params } });
      const response = await axiosInstance.get("/mailbox", {
        params: { ...defaultParams, ...params },
      });
      // console.log("Mailbox API response", response);

      return { emails: response.data, pagination: response.pagination };
    } catch (err: any) {
      // normalize error
      throw new Error(err?.response?.data?.message ?? err?.message ?? 'Failed to fetch mails');
    }
  },

  async updateMailAsRead(id: string, updates: Partial<Email>): Promise<Email> {

    try {
      const resp = await axiosInstance.patch<Email>(`/mailbox/${id}/read`, updates);
      return resp;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message ?? err?.message ?? 'Failed to update mail');
    }
  },

  async updateMailAsUnRead(id: string, updates: Partial<Email>): Promise<Email> {

    try {
      const resp = await axiosInstance.patch<Email>(`/mailbox/${id}/unread`, updates);
      return resp;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message ?? err?.message ?? 'Failed to update mail');
    }
  },

  async snoozeMail(id: string, data: any) {
    return axiosInstance.patch(`/mailbox/${id}/snooze`, data);
  },

  async unsnoozeMail(id: string, data: any) {
    return axiosInstance.patch(`/mailbox/${id}/unsnooze`, data);
  },

  async deleteMail(id: string): Promise<void> {

    try {
      await axiosInstance.delete(`/mailbox/${id}`);
    } catch (err: any) {
      throw new Error(err?.response?.data?.message ?? err?.message ?? 'Failed to delete mail');
    }
  },
};

export default mailboxApi;