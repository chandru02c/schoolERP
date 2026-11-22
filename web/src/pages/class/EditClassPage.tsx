/**
 * File: src/pages/class/EditClassPage.tsx
 * Description: Form to edit an existing class and manage its sections.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Class as ClassIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchClassById,
  updateClass,
  createSection,
  updateSection,
  deleteSection,
} from '../../redux/slices/classSlice';
import { ROUTES, CLASS_STATUS_LIST } from '../../constants';
import { ClassSection } from '../../types/class';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const EditClassPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedClass, sections, loading, actionLoading } = useSelector((state: RootState) => state.class);

  // Class Form State
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ClassSection | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [sectionStatus, setSectionStatus] = useState('Active');

  // Delete Section Confirmation
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<ClassSection | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchClassById(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedClass) {
      setClassName(selectedClass.class_name || '');
      setDescription(selectedClass.description || '');
      setStatus(selectedClass.status || 'Active');
    }
  }, [selectedClass]);

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;
    if (!className.trim()) {
      toast.error('Class Name is required.');
      return;
    }

    const res = await dispatch(
      updateClass({
        id: Number(id),
        data: {
          class_name: className.trim(),
          description: description.trim(),
          status,
        },
      })
    );

    if (updateClass.fulfilled.match(res)) {
      navigate(ROUTES.CLASS_LIST);
    }
  };

  const handleOpenAddSection = () => {
    setEditingSection(null);
    setSectionName('');
    setSectionDesc('');
    setSectionStatus('Active');
    setSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: ClassSection) => {
    setEditingSection(sec);
    setSectionName(sec.section_name);
    setSectionDesc(sec.description || '');
    setSectionStatus(sec.status || 'Active');
    setSectionModalOpen(true);
  };

  const handleSaveSection = async () => {
    if (!id) return;
    if (!sectionName.trim()) {
      toast.error('Section Name is required.');
      return;
    }

    if (editingSection) {
      // Update existing section
      await dispatch(
        updateSection({
          id: editingSection.class_section_id,
          classId: Number(id),
          data: {
            section_name: sectionName.trim(),
            description: sectionDesc.trim(),
            status: sectionStatus,
          },
        })
      );
    } else {
      // Create new section
      await dispatch(
        createSection({
          class_id: Number(id),
          section_name: sectionName.trim(),
          description: sectionDesc.trim(),
          status: sectionStatus,
        })
      );
    }
    setSectionModalOpen(false);
  };

  const handleDeleteSectionConfirm = async () => {
    if (deleteSectionTarget && id) {
      await dispatch(
        deleteSection({
          id: deleteSectionTarget.class_section_id,
          classId: Number(id),
        })
      );
      setDeleteSectionTarget(null);
    }
  };

  if (loading && !selectedClass) {
    return (
      <Box py={8} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(ROUTES.CLASS_LIST)} sx={{ bgcolor: '#fff', boxShadow: 1 }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Edit Class: {selectedClass?.class_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update class details and manage classroom sections for {selectedClass?.class_code}.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Class Details Form */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <ClassIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  Class Details ({selectedClass?.class_code})
                </Typography>
              </Box>

              <form onSubmit={handleClassSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Class / Grade Name"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {CLASS_STATUS_LIST.map((st) => (
                        <MenuItem key={st} value={st}>
                          {st}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description / Curriculum Notes"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1.5}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={actionLoading}
                      startIcon={<SaveIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                        borderRadius: 2,
                        px: 3,
                      }}
                    >
                      {actionLoading ? 'Saving...' : 'Update Class Details'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Sections Management */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Class Sections ({sections.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add, edit, or remove section groups (e.g. A, B, C) for this class.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddSection}
                  sx={{ borderRadius: 2 }}
                >
                  Add Section
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {sections.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No sections configured for this class yet.
                  </Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Section Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sections.map((sec) => (
                        <TableRow key={sec.class_section_id}>
                          <TableCell sx={{ fontWeight: 600 }}>{sec.section_name}</TableCell>
                          <TableCell>{sec.section_code}</TableCell>
                          <TableCell>{sec.description || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={sec.status}
                              size="small"
                              color={sec.status === 'Active' ? 'success' : 'default'}
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenEditSection(sec)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteSectionTarget(sec)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section Create/Edit Modal */}
      <Dialog
        open={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            required
            label="Section Name"
            placeholder="e.g. A, B, C, Morning"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
          />

          <TextField
            select
            fullWidth
            label="Status"
            value={sectionStatus}
            onChange={(e) => setSectionStatus(e.target.value)}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            placeholder="Optional description for this section..."
            value={sectionDesc}
            onChange={(e) => setSectionDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setSectionModalOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleSaveSection}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3,
            }}
          >
            {editingSection ? 'Save Changes' : 'Add Section'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Section */}
      <ConfirmDialog
        open={!!deleteSectionTarget}
        title="Delete Section"
        message={`Are you sure you want to delete section "${deleteSectionTarget?.section_name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={actionLoading}
        severity="error"
        onConfirm={handleDeleteSectionConfirm}
        onClose={() => setDeleteSectionTarget(null)}
      />
    </Box>
  );
};

export default EditClassPage;
