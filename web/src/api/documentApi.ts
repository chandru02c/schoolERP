/**
 * File: src/api/documentApi.ts
 * Description: Dedicated API client for Document Uploads (Admission & Teacher)
 *              connecting to AWS API Gateway lambdas and direct S3 presigned PUT uploads.
 */

import axios from 'axios';
import axiosInstance from './axios';
import {
  DocumentModule,
  DocumentPresignedUrlRequest,
  DocumentPresignedUrlResponse,
  DocumentSaveRequest,
  DocumentSaveResponse,
  DocumentListResponse,
} from '../types/document';

export const documentApi = {
  /**
   * Request an AWS S3 Pre-Signed Upload URL for Admission or Teacher document.
   */
  async getPresignedUrl(payload: DocumentPresignedUrlRequest): Promise<DocumentPresignedUrlResponse> {
    const response = await axiosInstance.post<DocumentPresignedUrlResponse>(
      '/documents/upload-url',
      payload
    );
    return response.data;
  },

  /**
   * Upload binary file directly to AWS S3 using the Pre-Signed URL.
   * Pure Axios request with NO custom auth/org_id headers to prevent S3 signature mismatch.
   */
  async uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  /**
   * Save document metadata in database (school.admission_document / school.teacher_document).
   */
  async saveDocument(payload: DocumentSaveRequest): Promise<DocumentSaveResponse> {
    const response = await axiosInstance.post<DocumentSaveResponse>(
      '/documents/save',
      payload
    );
    return response.data;
  },

  /**
   * Fetch all uploaded documents for a given Admission application or Teacher record.
   */
  async getDocuments(module: DocumentModule, entityId: number): Promise<DocumentListResponse> {
    const response = await axiosInstance.get<DocumentListResponse>('/documents/save', {
      params: {
        module,
        entity_id: entityId,
      },
    });
    return response.data;
  },
};
