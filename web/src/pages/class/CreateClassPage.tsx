/**
 * File: src/pages/class/CreateClassPage.tsx
 * Description: Form to create a new class and configure initial sections dynamically.
 */

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Class as ClassIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { AppDispatch, RootState } from '../../redux/store';
import { createClass } from '../../redux/slices/classSlice';
import { ROUTES, CLASS_STATUS_LIST } from '../../constants';
import { CreateSectionInput } from '../../types/class';

const CreateClassPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((state: RootState) => state.class);

  // Form State
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');

  // Dynamic Sections List (Defaults: Section A, Section B)
  const [sections, setSections] = useState<CreateSectionInput[]>([
    { section_name: 'A', description: 'Section A', status: 'Active' },
    { section_name: 'B', description: 'Section B', status: 'Active' },
  ]);

  const handleAddSectionRow = () => {
    setSections((prev) => [
      ...prev,
      { section_name: String.fromCharCode(65 + prev.length), description: `Section ${String.fromCharCode(65 + prev.length)}`, status: 'Active' },
    ]);
  };

  const handleRemoveSectionRow = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof CreateSectionInput, val: string) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!className.trim()) {
      toast.error('Class Name is required.');
      return;
    }

    // Validate sections
    const validSections = sections
      .map((s) => ({
        section_name: s.section_name.trim(),
        description: s.description?.trim(),
        status: s.status || 'Active',
      }))
      .filter((s) => s.section_name !== '');

    const res = await dispatch(
      createClass({
        class_name: className.trim(),
        description: description.trim(),
        status,
        sections: validSections,
      })
    );

    if (createClass.fulfilled.match(res)) {
      navigate(ROUTES.CLASS_LIST);
    }
  };

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
              Create New Class
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure class information and define initial classroom sections.
            </Typography>
          </Box>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Class Information */}
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
                    Class Details
                  </Typography>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Class / Grade Name"
                      placeholder="e.g. Grade 1, Class 10, Nursery"
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
                      placeholder="Optional notes regarding the grade level or syllabus..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sections Configuration */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 14px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Class Sections
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Each class can be divided into multiple sections (e.g. A, B, C).
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddSectionRow}
                    sx={{ borderRadius: 2 }}
                  >
                    Add Section
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {sections.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      No initial sections configured. Click "Add Section" to add one.
                    </Typography>
                  </Box>
                ) : (
                  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                        <TableRow>
                          <TableCell width="35%" sx={{ fontWeight: 700 }}>
                            Section Name *
                          </TableCell>
                          <TableCell width="40%" sx={{ fontWeight: 700 }}>
                            Description
                          </TableCell>
                          <TableCell width="15%" sx={{ fontWeight: 700 }}>
                            Status
                          </TableCell>
                          <TableCell width="10%" align="center" sx={{ fontWeight: 700 }}>
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sections.map((sec, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="e.g. A, B, Morning"
                                value={sec.section_name}
                                onChange={(e) => handleSectionChange(idx, 'section_name', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="e.g. Section A"
                                value={sec.description || ''}
                                onChange={(e) => handleSectionChange(idx, 'description', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                value={sec.status || 'Active'}
                                onChange={(e) => handleSectionChange(idx, 'status', e.target.value)}
                              >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                              </TextField>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveSectionRow(idx)}
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

          {/* Form Actions */}
          <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.CLASS_LIST)}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              startIcon={<SaveIcon />}
              sx={{
                background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                borderRadius: 2,
                px: 4,
                boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
              }}
            >
              {actionLoading ? 'Creating Class...' : 'Save & Create Class'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateClassPage;
