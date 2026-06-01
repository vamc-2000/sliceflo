// lib/api/uploads.api.ts
import axiosInstance from './axios-instance';
import axios from 'axios';

export interface UploadIconRequest {
  icon: {
    name: string;
    color: string;
  };
}

export interface UploadFileRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface UploadIconResponse {
  id: string;
  type: 'icon';
  name: string;
  color: string;
  status: 'completed';
  createdAt: string;
  updatedAt: string;
  presignedUrl?: string; 
}

export interface UploadFileResponse {
  id: string;
  type: 'file';
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  status: 'pending' | 'completed';
  presignedUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  id: string;
  url?: string;
  type: 'icon' | 'file';
}

// Upload icon metadata
export const uploadIcon = async (iconData: UploadIconRequest): Promise<UploadIconResponse> => {
  return await axiosInstance.post('/uploads', iconData);
};

// Upload file (3-step process: get presigned URL, then upload to S3, then complete)
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  try {
    // Step 1: Create upload record and get presigned URL
    const uploadRequest: UploadFileRequest = {
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    };

    const response: UploadFileResponse = await axiosInstance.post(
      '/uploads',
      uploadRequest
    );

    const { id, presignedUrl, s3Key } = response;

    console.log('📤 Step 1: Upload record created, ID:', id);

    // Step 2: Upload file to S3 using presigned URL
    const uploadToS3 = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
      credentials: 'omit'
    });

    if (!uploadToS3.ok) {
      const errorText = await uploadToS3.text();
      console.error('❌ S3 upload failed:', errorText);
      throw new Error(`S3 upload failed: ${errorText}`);
    }

    console.log('✅ Step 2: File uploaded to S3 successfully');

    // ✅ Step 3: Call complete API to mark upload as completed
    const completedUpload: UploadFileResponse = await axiosInstance.put(
      `/uploads/${id}/complete`
    );

    console.log('✅ Step 3: Upload marked as complete:', completedUpload);

    // Verify status is now 'completed'
    if (completedUpload.status !== 'completed') {
      console.warn('⚠️ Upload status not completed:', completedUpload.status);
    }

    return {
      id: completedUpload.id,
      url: completedUpload.s3Key || s3Key,
      type: 'file',
    };
  } catch (error: any) {
    console.error('❌ File upload process failed:', error);
    throw new Error(error?.message || 'Failed to upload file');
  }
};

// Upload file with FormData (alternative method if your API supports it)
export const uploadFileWithFormData = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response: UploadFileResponse = await axiosInstance.post(
    '/uploads',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return {
    id: response.id,
    url: response.s3Key,
    type: 'file',
  };
};

//Put upload by ID
export const putUpload = async (id: string): Promise<UploadIconResponse | UploadFileResponse> => {
  return await axiosInstance.put(`/uploads/${id}/complete`);
};

// Get upload by ID
export const getUpload = async (id: string): Promise<UploadIconResponse | UploadFileResponse> => {
  return await axiosInstance.get(`/uploads/${id}`);
};

// Delete upload by ID (if your API supports it)
export const deleteUpload = async (id: string): Promise<{ success: boolean }> => {
  return await axiosInstance.delete(`/uploads/${id}`);
};
