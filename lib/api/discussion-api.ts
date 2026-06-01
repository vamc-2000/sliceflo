import { CreateDiscussionResponse, DiscussionType, CreateMessagePayload, CreateMessageResponse, FetchMessagesResponse, UpdateMessagePayload, Discussion, DiscussionMessage, DeleteDiscussionResponse, MessageMentionInput } from '@/types/discussions.types';

import axiosInstance from './axios-instance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const discussionAPI = {
    //Create new discussion or thread
    createDiscussion: async (
        type: DiscussionType,
        referenceId: string,
        payload: {
            title: string;
            description?: string;
            participants?: string[];
            labelIds?: string[];
            priority?: "low" | "medium" | "high";
            tags?: string[];
            isPrivate?: boolean;
            mentions?: MessageMentionInput[];
            metadata?: Record<string, unknown>;
        }
    ): Promise<CreateDiscussionResponse> => {
        const response = await axiosInstance.post<CreateDiscussionResponse>(
            `${API_BASE_URL}/discussions/${type}/${referenceId}`,
            payload
        );
        return response;
    },

    //Get all dicussions under this referenceID
    getDiscussions: async (type: DiscussionType, referenceId: string): Promise<CreateDiscussionResponse> => {
        const response = await axiosInstance.get(`${API_BASE_URL}/discussions/type/${type}/referenceId/${referenceId}`);
        return response;
    },

    deleteDiscussion: async (
        discussionId: string
    ): Promise<DeleteDiscussionResponse> => {
        const response = await axiosInstance.delete<DeleteDiscussionResponse>(
            `${API_BASE_URL}/discussions/${discussionId}`
        );
        return response;
    },

    deleteDiscussionAttachment: async (discussionId: string, attachmentId: string) => {
        const response = await axiosInstance.delete(
            `${API_BASE_URL}/discussions/${discussionId}/attachments/${attachmentId}`
        );
        return response;
    },

    //create reply for message
    createMessages: async (
        discussionId: string,
        payload: CreateMessagePayload
    ): Promise<CreateMessageResponse> => {
        const response = await axiosInstance.post<CreateMessageResponse>(
            `${API_BASE_URL}/discussions/${discussionId}/reply`,
            payload
        );
        return response;
    },

    fetchMessages: async (discussionId: string): Promise<FetchMessagesResponse> => {
        const response = await axiosInstance.get(`${API_BASE_URL}/discussions/${discussionId}`);
        return response;
    },

    updateReply: async (discussionId: string, replyId: string, payload: UpdateMessagePayload) => {
        const response = await axiosInstance.patch(
            `${API_BASE_URL}/discussions/${discussionId}/reply/${replyId}`,
            payload
        );
        // console.log("UPDATED MESSAGE FROM API:", response.data);
        return response;
    },

    deleteReply: async (discussionId: string, replyId: string): Promise<DeleteDiscussionResponse> => {
        const response = await axiosInstance.delete<DeleteDiscussionResponse>(
            `${API_BASE_URL}/discussions/${discussionId}/reply/${replyId}`
        );
        return response;
    },

}

