import React, { useState, useMemo } from 'react';
import {
  Box, Grid, Typography, Avatar, Chip, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import AppButton from '../../components/common/AppButton';
import { ROUTES } from '../../constants';
import toast from 'react-hot-toast';

interface FeeRecord {
  id: number;
  student_name: string;
  class_name: string;
  section: string;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
}

const MOCK_FEES: FeeRecord[] = [
  { id: 1, student_name: 'Aarav Singh', class_name: 'Class 6', section: 'A', fee_type: 'Tuition', amount: 15000, due_date: '2026-07-15', paid_date: '2026-07-10', status: 'Paid' },
  { id: 2, student_name: 'Priya Nair', class_name: 'Class 7', section: 'B', fee_type: 'Tuition', amount: 15000, due_date: '2026-07-15', status: 'Pending' },
  { id: 3, student_name: 'Rahul Verma', class_name: 'Class 8', section: 'A', fee_type: 'Transport', amount: 5000, due_date: '2026-06-30', status: 'Overdue' },
  { id: 4, student_name: 'Ananya Sharma', class_name: 'Class 5', section: 'C', fee_type: 'Library', amount: 2000, due_date: '2026-07-15', paid_date: '2026-07-08', status: 'Paid' },
  { id: 5, student_name: 'Kiran Patel', class_name: 'Class 9', section: 'B', fee_type: 'Lab', amount: 3000, due_date: '2026-06-15', status: 'Overdue' },
  { id: 6, student_name: 'Sneha Reddy', class_name: 'Class 6', section: 'A', fee_type: 'Sports', amount: 2500, due_date: '2026-07-15', paid_date: '2026-07-12', status: 'Paid' },
  { id: 7, student_name: 'Amit Kumar', class_name: 'Class 10', section: 'A', fee_type: 'Examination', amount: 4000, due_date: '2026-07-20', status: 'Pending' },
  { id: 8, student_name: 'Meera Das', class_name: 'Class 8', section: 'B', fee_type: 'Tuition', amount: 15000, due_date: '2026-07-15', paid_date: '2026-07-14', status: 'Paid' },
  { id: 9, student_name: 'Rohan Gupta', class_name: 'Class 7', section: 'A', fee_type: 'Transport', amount: 5000, due_date: '2026-07-10', status: 'Overdue' },
];

const FeesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    return MOCK_FEES.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch = !q || f.student_name.toLowerCase().includes(q) || f.class_name.toLowerCase().includes(q);
      const matchType = !typeFilter || f.fee_type === typeFilter;
      const matchStatus = !statusFilter || f.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, typeFilter, statusFilter]);

  const totalCollected = MOCK_FEES.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
  const totalPending = MOCK_FEES.filter((f) => f.status !== 'Paid').reduce((s, f) => s + f.amount, 0);
  const collectionRate = Math.round((totalCollected / (totalCollected + totalPending)) * 100);

  const handleExportCSV = () => {
    const csv = ['ID,Student,Class,Type,Amount,Due Date,Status'].concat(
      filtered.map((f) => `${f.id},${f.student_name},${f.class_name},${f.fee_type},${f.amount},${f.due_date},${f.status}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fees.csv'; a.click();
    toast.success('CSV exported!');
  };

  const summaryItems = [
    { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: '#2E7D32' },
    { label: 'Pending Fees', value: `₹${totalPending.toLocaleString('en-IN')}`, color: '#D32F2F' },
    { label: 'Total Records', value: MOCK_FEES.length, color: '#1976D2' },
    { label: 'Collection Rate', value: `${collectionRate}%`, color: '#9C27B0' },
  ];

  const columns: Column[] = [
    {
      id: 'student_name', label: 'Student', minWidth: 180, sortable: true,
      render: (row: FeeRecord) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, background: 'linear-gradient(135deg, #1976D2, #0D47A1)', fontSize: '0.8rem', fontWeight: 700 }}>
            {row.student_name[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.student_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.class_name} - {row.section}</Typography>
          </Box>
        </Box>
      ),
    },
    { id: 'fee_type', label: 'Fee Type', minWidth: 110, sortable: true,
      render: (row: FeeRecord) => <Chip label={row.fee_type} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />,
    },
    { id: 'amount', label: 'Amount', minWidth: 100, align: 'right', sortable: true,
      render: (row: FeeRecord) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{`₹${row.amount.toLocaleString('en-IN')}`}</Typography>,
    },
    { id: 'due_date', label: 'Due Date', minWidth: 110, sortable: true,
      render: (row: FeeRecord) => <Typography variant="body2" color="text.secondary">{dayjs(row.due_date).format('MMM D, YYYY')}</Typography>,
    },
    { id: 'status', label: 'Status', minWidth: 100, align: 'center',
      render: (row: FeeRecord) => <StatusChip status={row.status} />,
    },
    { id: 'actions', label: 'Actions', minWidth: 100, align: 'center',
      render: (row: FeeRecord) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View"><IconButton size="small" sx={{ color: 'primary.main' }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          {row.status !== 'Paid' && (
            <Tooltip title="Send Reminder"><IconButton size="small" sx={{ color: 'warning.main' }} onClick={() => toast.success(`Reminder sent to ${row.student_name}'s parent`)}><NotificationsActiveIcon fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const filterToolbar = (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>Fee Type</InputLabel>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Fee Type">
          <MenuItem value="">All</MenuItem>
          {['Tuition', 'Transport', 'Library', 'Lab', 'Sports', 'Examination'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Overdue">Overdue</MenuItem>
        </Select>
      </FormControl>
      <Tooltip title="Export CSV">
        <IconButton onClick={handleExportCSV} sx={{ border: '1px solid rgba(0,0,0,0.15)', borderRadius: 2 }}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Fee Management"
        subtitle="Track and manage student fee payments"
        icon={<PaymentIcon />}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Fees' }]}
        action={
          <AppButton startIcon={<AddIcon />} sx={{ background: 'linear-gradient(135deg, #2E7D32, #4CAF50)' }}>
            Collect Fee
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

      <DataTable
        columns={columns}
        rows={filtered}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by student name, class..."
        toolbar={filterToolbar}
        getRowId={(row: FeeRecord) => row.id}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        emptyTitle="No Fee Records"
        emptyDescription="No fee records match your filters."
      />
    </Box>
  );
};

export default FeesPage;
