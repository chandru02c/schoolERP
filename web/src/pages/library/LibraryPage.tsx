import React, { useState, useMemo } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Chip, TextField,
  InputAdornment, LinearProgress, IconButton, Tooltip, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/common/AppButton';
import { ROUTES } from '../../constants';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available: number;
  issued: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Fiction: '#E91E63', Science: '#2196F3', Mathematics: '#FF9800',
  History: '#795548', 'Computer Science': '#009688', 'English Literature': '#9C27B0',
};

const MOCK_BOOKS: Book[] = [
  { id: 1, title: 'Introduction to Physics', author: 'H.C. Verma', isbn: '978-81-230-1234', category: 'Science', total_copies: 15, available: 8, issued: 7 },
  { id: 2, title: 'R.D. Sharma Mathematics', author: 'R.D. Sharma', isbn: '978-81-230-5678', category: 'Mathematics', total_copies: 20, available: 5, issued: 15 },
  { id: 3, title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '978-81-730-1111', category: 'Fiction', total_copies: 10, available: 3, issued: 7 },
  { id: 4, title: 'India After Gandhi', author: 'Ramachandra Guha', isbn: '978-06-730-2222', category: 'History', total_copies: 8, available: 6, issued: 2 },
  { id: 5, title: 'Python Programming', author: 'Mark Lutz', isbn: '978-14-919-3333', category: 'Computer Science', total_copies: 12, available: 10, issued: 2 },
  { id: 6, title: 'Merchant of Venice', author: 'William Shakespeare', isbn: '978-01-426-4444', category: 'English Literature', total_copies: 18, available: 12, issued: 6 },
  { id: 7, title: 'Concise Chemistry', author: 'Selina Publishers', isbn: '978-81-230-7777', category: 'Science', total_copies: 14, available: 4, issued: 10 },
  { id: 8, title: 'The Discovery of India', author: 'Jawaharlal Nehru', isbn: '978-01-430-8888', category: 'History', total_copies: 6, available: 6, issued: 0 },
];

const LibraryPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return MOCK_BOOKS;
    return MOCK_BOOKS.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
  }, [search]);

  const totalBooks = MOCK_BOOKS.reduce((s, b) => s + b.total_copies, 0);
  const totalIssued = MOCK_BOOKS.reduce((s, b) => s + b.issued, 0);
  const totalAvailable = MOCK_BOOKS.reduce((s, b) => s + b.available, 0);
  const overdueCount = 4; // mock

  const summaryItems = [
    { label: 'Total Books', value: totalBooks, color: '#1976D2' },
    { label: 'Books Issued', value: totalIssued, color: '#ED6C02' },
    { label: 'Available', value: totalAvailable, color: '#2E7D32' },
    { label: 'Overdue Returns', value: overdueCount, color: '#D32F2F' },
  ];

  return (
    <Box>
      <PageHeader
        title="Library Management"
        subtitle={`${MOCK_BOOKS.length} titles · ${totalBooks} total copies`}
        icon={<LocalLibraryIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Library' }]}
        action={
          <AppButton startIcon={<AddIcon />} sx={{ background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)' }}>
            Add Book
          </AppButton>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryItems.map((s, i) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Box sx={{ p: 2, borderRadius: 2.5, background: alpha(s.color, 0.08), border: `1px solid ${alpha(s.color, 0.2)}`, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search books by title, author, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 400 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
          }}
        />
      </Box>

      <Grid container spacing={2.5}>
        {filtered.map((book, i) => {
          const utilization = Math.round((book.issued / book.total_copies) * 100);
          const catColor = CATEGORY_COLORS[book.category] || '#616161';

          return (
            <Grid item xs={12} sm={6} lg={4} key={book.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card sx={{
                  borderRadius: 3, height: '100%',
                  border: `1px solid ${alpha(catColor, 0.15)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 40px ${alpha(catColor, 0.15)}` },
                }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: 2,
                          background: `linear-gradient(135deg, ${catColor}, ${alpha(catColor, 0.7)})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 4px 14px ${alpha(catColor, 0.3)}`,
                        }}>
                          <MenuBookIcon sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>{book.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{book.author}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton size="small" sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={book.category} size="small" sx={{ bgcolor: alpha(catColor, 0.12), color: catColor, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      <Chip label={`ISBN: ${book.isbn.slice(-4)}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: alpha('#1976D2', 0.06) }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1976D2' }}>{book.total_copies}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Total</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: alpha('#2E7D32', 0.06) }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#2E7D32' }}>{book.available}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Available</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1.5, bgcolor: alpha('#ED6C02', 0.06) }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#ED6C02' }}>{book.issued}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Issued</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Utilization</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: utilization > 80 ? '#D32F2F' : utilization > 50 ? '#ED6C02' : '#2E7D32' }}>
                        {utilization}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={utilization}
                      sx={{
                        borderRadius: 4, height: 6,
                        bgcolor: alpha(utilization > 80 ? '#D32F2F' : '#2E7D32', 0.12),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: utilization > 80
                            ? 'linear-gradient(90deg, #D32F2F, #EF5350)'
                            : utilization > 50
                            ? 'linear-gradient(90deg, #ED6C02, #FF9800)'
                            : 'linear-gradient(90deg, #2E7D32, #4CAF50)',
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default LibraryPage;
