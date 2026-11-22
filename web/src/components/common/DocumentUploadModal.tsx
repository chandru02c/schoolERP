/**
 * File: src/components/common/DocumentUploadModal.tsx
 * Description: Reusable, production-grade Document Upload & Document List modal for
 *              Admission Applications and Teacher profiles with direct S3 Presigned URL uploads.
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  Alert,
  Tooltip,
  CircularProgress,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Description as DocIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  CheckCircle as VerifiedIcon,
  HourglassEmpty as PendingIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import {
  DocumentModule,
  DocumentRecord,
} from '../../types/document';
import {
  ADMISSION_DOCUMENT_TYPES,
  TEACHER_DOCUMENT_TYPES,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_MB,
  DEFAULT_ORG_ID,
} from '../../constants';
import { documentApi } from '../../api/documentApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

export interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  module: DocumentModule;
  entityId: number;
  entityName: string;
  entitySubtitle?: string; // e.g. "App No: APP2026001 • Class 10A" or "Emp #TCH-001 • Mathematics"
  onUploadSuccess?: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  open,
  onClose,
  module,
  entityId,
  entityName,
  entitySubtitle,
  onUploadSuccess,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const orgId = user?.orgId || DEFAULT_ORG_ID;

  const docTypeOptions =
    module === 'ADMISSION' ? ADMISSION_DOCUMENT_TYPES : TEACHER_DOCUMENT_TYPES;

  const [documentType, setDocumentType] = useState<string>(docTypeOptions[0]);
  const [documentName, setDocumentName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [formError, setFormError] = useState<string>('');

  // Fetch document list for current entity
  const fetchDocuments = async () => {
    if (!entityId) return;
    setLoadingDocs(true);
    try {
      const response = await documentApi.getDocuments(module, entityId);
      if (response.success && Array.isArray(response.data)) {
        setDocuments(response.data);
      }
    } catch (err: any) {
      console.error('[DocumentUploadModal] Failed to fetch documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (open && entityId) {
      setDocumentType(docTypeOptions[0]);
      setDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);
      setFormError('');
      fetchDocuments();
    }
  }, [open, entityId, module]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
        setFormError(
          `Invalid file extension .${ext}. Allowed formats: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`
        );
        return;
      }

      if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
        setFormError(`File size exceeds maximum limit of ${MAX_DOCUMENT_SIZE_MB}MB.`);
        return;
      }

      setFormError('');
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setFormError('Please select a file to upload.');
      return;
    }

    if (!documentType) {
      setFormError('Please select a document type.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFormError('');

    try {
      // Step 1: Call school_generate_presigned_url
      const presignedRes = await documentApi.getPresignedUrl({
        org_id: orgId,
        module,
        entity_id: entityId,
        file_name: selectedFile.name,
        content_type: selectedFile.type || 'application/octet-stream',
      });

      if (!presignedRes.success || !presignedRes.data.uploadUrl) {
        throw new Error(presignedRes.message || 'Failed to acquire upload URL.');
      }

      const { uploadUrl, s3Key } = presignedRes.data;

      // Step 2: Direct Binary S3 PUT Upload
      await documentApi.uploadToS3(uploadUrl, selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      // Step 3: Call school_save_document to persist metadata
      const saveRes = await documentApi.saveDocument({
        org_id: orgId,
        module,
        entity_id: entityId,
        document_name: documentName.trim() || documentType,
        document_type: documentType,
        s3_key: s3Key,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
      });

      if (!saveRes.success) {
        throw new Error(saveRes.message || 'Failed to save document metadata.');
      }

      toast.success(`Uploaded "${documentType}" successfully!`);
      setSelectedFile(null);
      setDocumentName('');
      setUploadProgress(0);

      // Step 4: Refresh document list
      await fetchDocuments();
      if (onUploadSuccess) onUploadSuccess();

    } catch (err: any) {
      console.error('[DocumentUploadModal] Upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to upload document.';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName?: string, docType?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || docType?.toLowerCase().includes('photo')) {
      return <ImageIcon sx={{ color: '#1976D2' }} />;
    }
    if (ext === 'pdf') {
      return <PdfIcon sx={{ color: '#D32F2F' }} />;
    }
    return <DocIcon sx={{ color: '#7B1FA2' }} />;
  };

  const getS3Url = (s3Key: string) => {
    if (!s3Key) return '#';
    if (s3Key.startsWith('http')) return s3Key;
    const bucket = 'school-erp-documents-prod';
    const region = 'ap-south-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  };

  return (
    <Dialog
      open={open}
      onClose={uploading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha('#1976D2', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            <FolderIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              Documents: {entityName}
            </Typography>
            {entitySubtitle && (
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {entitySubtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={uploading} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {formError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left: Upload Document Form */}
          <Grid item xs={12} md={5}>
            <Box
              component="form"
              onSubmit={handleUpload}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: 'rgba(0,0,0,0.01)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} mb={2}>
                Upload New Document
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  select
                  required
                  fullWidth
                  size="small"
                  label="Document Type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={uploading}
                >
                  {docTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label="Document Label / Title"
                  placeholder="e.g. 10th Standard Marksheet"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  disabled={uploading}
                />

                {/* File Drop Button */}
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  disabled={uploading}
                  sx={{
                    py: 1.5,
                    borderStyle: 'dashed',
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: alpha('#1976D2', 0.02),
                  }}
                >
                  {selectedFile ? selectedFile.name : 'Select File (PDF, JPG, PNG, DOC)'}
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </Button>

                {selectedFile && (
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                    Selected: <b>{selectedFile.name}</b> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                )}

                {uploading && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        Uploading directly to S3...
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={700}>
                        {uploadProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!selectedFile || uploading}
                  startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                  }}
                >
                  {uploading ? 'Uploading Document...' : 'Upload to Cloud'}
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right: Uploaded Documents List */}
          <Grid item xs={12} md={7}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Uploaded Documents ({documents.length})
              </Typography>
              <Tooltip title="Refresh Document List">
                <IconButton size="small" onClick={fetchDocuments} disabled={loadingDocs}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {loadingDocs ? (
              <Box py={5} textAlign="center">
                <CircularProgress size={32} />
              </Box>
            ) : documents.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  bgcolor: 'rgba(0,0,0,0.01)',
                }}
              >
                <DocIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  No documents uploaded yet.
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Select a document type on the left and upload your first file.
                </Typography>
              </Paper>
            ) : (
              <List disablePadding sx={{ maxHeight: 340, overflowY: 'auto' }}>
                {documents.map((doc, idx) => (
                  <Paper
                    key={doc.id || idx}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: alpha('#1976D2', 0.02) },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getFileIcon(doc.document_name, doc.document_type)}
                    </Box>

                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {doc.document_name || doc.document_type}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.25} flexWrap="wrap">
                        <Chip
                          label={doc.document_type}
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {doc.created_at ? dayjs(doc.created_at).format('MMM D, YYYY') : 'Uploaded'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.5}>
                      {doc.verified ? (
                        <Tooltip title="Verified">
                          <VerifiedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Pending Verification">
                          <PendingIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                        </Tooltip>
                      )}

                      {doc.s3_key && (
                        <Tooltip title="View Document in S3">
                          <IconButton
                            size="small"
                            color="primary"
                            component="a"
                            href={getS3Url(doc.s3_key)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Button onClick={onClose} disabled={uploading} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUploadModal;
