/**
 * File: src/teacher/pages/TeacherEventsPage.tsx
 * Description: School Events module allowing teachers to view upcoming institutional events,
 *              cultural activities, sports days, and exhibition dates.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, CardMedia, CardContent, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';

import AppCard from '../../components/common/AppCard';
import { eventApi } from '../../api/eventApi';
import { EventMaster } from '../../types/event';

export const TeacherEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventMaster[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventMaster | null>(null);

  useEffect(() => {
    eventApi.getEvents({ limit: 20 }).then((res) => {
      if (res.data) setEvents(res.data);
    }).catch(() => {
      // Fallback
      setEvents([
        {
          event_id: 1,
          org_id: 1001,
          event_title: 'Annual Science & Tech Innovation Fair',
          event_type: 'SCHOOL_EVENT',
          event_start_date: '2026-09-28',
          event_end_date: '2026-09-29',
          event_short_description: 'Inter-school project presentations and science models exhibition.',
          event_description: 'Students from Classes 6 through 12 will showcase working prototypes in physics, chemistry, robotics and environmental science.',
          event_status: 'UPCOMING',
          publish_status: 'PUBLISHED',
          thumbnail_image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
        },
        {
          event_id: 2,
          org_id: 1001,
          event_title: 'Teachers Day Cultural Celebration',
          event_type: 'CULTURAL',
          event_start_date: '2026-09-05',
          event_end_date: '2026-09-05',
          event_short_description: 'Special cultural performances organized by student council.',
          event_description: 'Felicitation ceremony and student musical performances dedicated to all faculty members.',
          event_status: 'UPCOMING',
          publish_status: 'PUBLISHED',
          thumbnail_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600',
        },
        {
          event_id: 3,
          org_id: 1001,
          event_title: 'Inter-House Basketball Tournament',
          event_type: 'SPORTS',
          event_start_date: '2026-10-10',
          event_end_date: '2026-10-12',
          event_short_description: 'Annual inter-house basketball championship matches.',
          event_description: 'Round-robin league matches followed by semi-finals and finals under floodlights.',
          event_status: 'UPCOMING',
          publish_status: 'PUBLISHED',
          thumbnail_image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
        },
      ]);
    });
  }, []);

  return (
    <Box>
      {/* ── Header Banner ── */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
          School Events & Activities
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Explore upcoming institutional celebrations, fairs, tournaments, and official gatherings.
        </Typography>
      </Box>

      {/* ── Events Grid ── */}
      <Grid container spacing={3}>
        {events.map((ev) => (
          <Grid item xs={12} sm={6} lg={4} key={ev.event_id}>
            <Card
              sx={{
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                '&:hover': { transform: 'translateY(-4px)', borderColor: '#0D9488' },
              }}
            >
              {ev.thumbnail_image_url && (
                <CardMedia
                  component="img"
                  height="160"
                  image={ev.thumbnail_image_url}
                  alt={ev.event_title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={ev.event_type}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#E0F2FE', color: '#0369A1', fontSize: '0.68rem' }}
                  />
                  <Chip
                    label={ev.event_status}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#E8F5E9', color: '#2E7D32', fontSize: '0.68rem' }}
                  />
                </Box>

                <Typography variant="h6" fontWeight={800} color="#0F172A" gutterBottom noWrap>
                  {ev.event_title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2 }}>
                  {ev.event_short_description || ev.event_description}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <EventIcon fontSize="small" sx={{ color: '#0D9488' }} />
                    <Typography variant="caption" fontWeight={600}>
                      {ev.event_start_date} {ev.event_end_date ? `to ${ev.event_end_date}` : ''}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => setActiveEvent(ev)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Event Details Modal ── */}
      <Dialog open={Boolean(activeEvent)} onClose={() => setActiveEvent(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {activeEvent && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>{activeEvent.event_title}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {activeEvent.event_description || activeEvent.event_short_description}
              </Typography>
              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2"><strong>Start Date:</strong> {activeEvent.event_start_date}</Typography>
                {activeEvent.event_end_date && (
                  <Typography variant="body2"><strong>End Date:</strong> {activeEvent.event_end_date}</Typography>
                )}
                <Typography variant="body2"><strong>Category:</strong> {activeEvent.event_type}</Typography>
                <Typography variant="body2"><strong>Status:</strong> {activeEvent.event_status}</Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setActiveEvent(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};


export default TeacherEventsPage;
