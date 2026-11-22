/**
 * File: src/pages/class/ViewClassPage.tsx
 * Description: Executive view of class information, status badges, and associated classroom sections.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Divider,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Class as ClassIcon,
  Layers as SectionIcon,
  SwapHoriz as StatusIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../redux/store';
import {
  fetchClassById,
  updateClassStatus,
  createSection,
} from '../../redux/slices/classSlice';
import {
  ROUTES,
  CLASS_STATUS_LIST,
  CLASS_STATUS_COLORS,
} from '../../constants';

const ViewClassPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedClass, sections, loading, actionLoading } = useSelector((state: RootState) => state.class);

  // Status Change Dialog State
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('Active');

  // Quick Add Section Dialog
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchClassById(Number(id)));
    }
  }, [dispatch, id]);

  const handleStatusSubmit = async () => {
    if (id) {
      await dispatch(updateClassStatus({ id: Number(id), status: newStatus }));
      setStatusDialogOpen(false);
    }
  };

  const handleAddSectionSubmit = async () => {
    if (id && newSectionName.trim()) {
      await dispatch(
        createSection({
          class_id: Number(id),
          section_name: newSectionName.trim(),
          description: newSectionDesc.trim(),
          status: 'Active',
        })
      );
      setNewSectionName('');
      setNewSectionDesc('');
      setAddSectionOpen(false);
    }
  };

  if (loading && !selectedClass) {
    return (
      <Box py={8} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedClass) {
    return (
      <Box py={8} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          Class record not found.
        </Typography>
        <Button variant="outlined" onClick={() => navigate(ROUTES.CLASS_LIST)} sx={{ mt: 2 }}>
          Back to Class List
        </Button>
      </Box>
    );
  }

  const statusConfig = CLASS_STATUS_COLORS[selectedClass.status] || { bg: '#E0E0E0', color: '#424242', label: selectedClass.status };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(ROUTES.CLASS_LIST)} sx={{ bgcolor: '#fff', boxShadow: 1 }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                {selectedClass.class_name}
              </Typography>
              <Chip
                label={statusConfig.label}
                sx={{
                  bgcolor: statusConfig.bg,
                  color: statusConfig.color,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Class Code: <strong>{selectedClass.class_code}</strong> · Org ID: {selectedClass.org_id}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<StatusIcon />}
            onClick={() => {
              setNewStatus(selectedClass.status || 'Active');
              setStatusDialogOpen(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            Change Status
          </Button>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(ROUTES.CLASS_EDIT.replace(':id', String(selectedClass.class_id)))}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            Edit Class
          </Button>
        </Box>
      </Box>

      {/* Main Details Grid */}
      <Grid container spacing={3}>
        {/* Overview Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <ClassIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    Class Overview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    General identification & metadata
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Class Name
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {selectedClass.class_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Class Code
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {selectedClass.class_code}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedClass.description || 'No description provided.'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Created At
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {selectedClass.created_at ? new Date(selectedClass.created_at).toLocaleString() : '—'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    Last Updated
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {selectedClass.updated_at ? new Date(selectedClass.updated_at).toLocaleString() : '—'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sections Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: alpha('#9C27B0', 0.12),
                      color: '#9C27B0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SectionIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Sections ({sections.length})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active classroom sections under this class (e.g. A, B, C)
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddSectionOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Section
                </Button>
              </Box>

              {sections.length === 0 ? (
                <Box py={5} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No sections have been configured for this class yet.
                  </Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Section Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Section Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sections.map((sec) => (
                        <TableRow key={sec.class_section_id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{sec.section_name}</TableCell>
                          <TableCell>{sec.section_code}</TableCell>
                          <TableCell>{sec.description || '—'}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={sec.status}
                              size="small"
                              color={sec.status === 'Active' ? 'success' : 'default'}
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
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

      {/* Change Class Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Change Class Status</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            select
            fullWidth
            label="Class Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {CLASS_STATUS_LIST.map((st) => (
              <MenuItem key={st} value={st}>
                {st}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setStatusDialogOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleStatusSubmit}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3,
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Add Section Dialog */}
      <Dialog
        open={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Add New Section</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            required
            label="Section Name"
            placeholder="e.g. A, B, C, Morning"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            placeholder="Optional description for this section..."
            value={newSectionDesc}
            onChange={(e) => setNewSectionDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setAddSectionOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={handleAddSectionSubmit}
            sx={{
              background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
              borderRadius: 2,
              px: 3,
            }}
          >
            Add Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewClassPage;
