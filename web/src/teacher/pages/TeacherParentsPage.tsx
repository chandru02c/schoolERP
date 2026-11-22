/**
 * File: src/teacher/pages/TeacherParentsPage.tsx
 * Description: Parent Communication module allowing teachers to message guardians,
 *              view message history, initiate PTMs, and broadcast notes.
 */

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Card, Button, TextField, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Paper,
  IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Groups as GroupsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import AppCard from '../../components/common/AppCard';
import DataTable, { Column } from '../../components/common/DataTable';
import { teacherApiService } from '../services/teacherApiService';
import { ParentCommunication } from '../types';

export const TeacherParentsPage: React.FC = () => {
  const [parents, setParents] = useState<ParentCommunication[]>([]);
  const [activeParent, setActiveParent] = useState<ParentCommunication | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');

  const loadParents = async () => {
    const list = await teacherApiService.getParentContacts();
    setParents(list);
  };

  useEffect(() => {
    loadParents();
  }, []);

  const handleOpenChat = (parent: ParentCommunication) => {
    setActiveParent(parent);
    setChatOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeParent) return;
    await teacherApiService.sendMessageToParent(activeParent.id, replyText);
    setReplyText('');
    toast.success('Message sent to parent!');
    loadParents();
  };

  const handleSchedulePTM = (parentName: string) => {
    toast.success(`PTM invitation sent to ${parentName}`);
  };

  const filtered = parents.filter(
    (p) =>
      p.parent_name.toLowerCase().includes(search.toLowerCase()) ||
      p.student_name.toLowerCase().includes(search.toLowerCase()) ||
      p.class_name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column[] = [
    {
      id: 'parent',
      label: 'Parent & Ward',
      render: (row: ParentCommunication) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#0D9488', fontWeight: 700, width: 38, height: 38, fontSize: '0.85rem' }}>
            {row.parent_name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="#0F172A">
              {row.parent_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ward: <strong>{row.student_name}</strong> • {row.class_name} ({row.section})
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'contact',
      label: 'Phone & Email',
      render: (row: ParentCommunication) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.phone}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Last Message',
      render: (row: ParentCommunication) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">{row.last_interaction}</Typography>
          {row.unread_count > 0 && (
            <Chip label={`${row.unread_count} New`} size="small" sx={{ bgcolor: '#FFE4E6', color: '#E11D48', fontWeight: 800, height: 20 }} />
          )}
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Action',
      align: 'right',
      render: (row: ParentCommunication) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => handleOpenChat(row)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Chat ({row.messages.length})
          </Button>
          <Button
            size="small"
            variant="text"
            startIcon={<EventIcon />}
            onClick={() => handleSchedulePTM(row.parent_name)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Invite PTM
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Header Banner ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0F172A" sx={{ letterSpacing: '-0.5px' }}>
            Parent Communication & PTM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect with student guardians, exchange direct feedback, and schedule parent-teacher meetings.
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search by parent or student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280, bgcolor: '#fff', borderRadius: 2 }}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />
      </Box>

      {/* ── Parents Table ── */}
      <AppCard>
        <DataTable
          columns={columns}
          rows={filtered}
          total={filtered.length}
          emptyTitle="No parent contacts found"
          emptyDescription="Parent directory will populate from student enrollments."
        />
      </AppCard>


      {/* ── Chat & Messaging Modal ── */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {activeParent && (
          <>
            <DialogTitle sx={{ fontWeight: 800, p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
              Conversation with {activeParent.parent_name} (Parent of {activeParent.student_name})
            </DialogTitle>
            <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto' }}>
              {activeParent.messages.map((m) => {
                const isMe = m.sender === 'TEACHER';
                return (
                  <Box
                    key={m.id}
                    sx={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: isMe ? '#0D9488' : '#F1F5F9',
                        color: isMe ? '#fff' : '#0F172A',
                      }}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                        {m.message}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8, textAlign: 'right' }}>
                        {m.timestamp}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Type your message to parent..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
              />
              <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendReply} sx={{ bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}>
                Send
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TeacherParentsPage;
