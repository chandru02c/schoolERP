/**
 * File: src/types/document.ts
 * Description: TypeScript interfaces and type definitions for Document Upload functionality.
 */

export type DocumentModule = 'ADMISSION' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type AdmissionDocumentType =
  | 'Student Photo'
  | 'Birth Certificate'
  | 'Aadhaar'
  | 'Transfer Certificate'
  | 'Marksheet'
  | 'Other Documents';

export type TeacherDocumentType =
  | 'Profile Photo'
  | 'Aadhaar'
  | 'PAN'
  | 'Degree Certificate'
  | 'Experience Certificate'
  | 'Joining Documents'
  | 'Other Documents';

export type DocumentType = AdmissionDocumentType | TeacherDocumentType;

export interface DocumentRecord {
  id: number;
  org_id: number;
  entity_id: number;
  document_name: string;
  document_type: string;
  s3_key: string;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  verified: boolean;
  verified_by?: number | null;
  verified_at?: string | null;
  created_at: string;
}

export interface DocumentPresignedUrlRequest {
  org_id?: number | string;
  module: DocumentModule;
  entity_id: number | string;
  file_name: string;
  content_type: string;
}

export interface DocumentPresignedUrlResponse {
  success: boolean;
  message?: string;
  data: {
    uploadUrl: string;
    bucket: string;
    s3Key: string;
    fileUrl: string;
    expiresInSeconds: number;
  };
}

export interface DocumentSaveRequest {
  org_id?: number | string;
  module: DocumentModule;
  entity_id: number;
  document_name: string;
  document_type: string;
  s3_key: string;
  file_size?: number;
  mime_type?: string;
}

export interface DocumentSaveResponse {
  success: boolean;
  message?: string;
  data: DocumentRecord;
}

export interface DocumentListResponse {
  success: boolean;
  message?: string;
  data: DocumentRecord[];
}
