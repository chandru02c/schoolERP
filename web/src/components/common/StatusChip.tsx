import React from 'react';
import { Chip } from '@mui/material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#E8F5E9', color: '#2E7D32' },
  Inactive: { bg: '#FFEBEE', color: '#C62828' },
  Pending: { bg: '#FFF8E1', color: '#F57F17' },
  Paid: { bg: '#E8F5E9', color: '#2E7D32' },
  Overdue: { bg: '#FFEBEE', color: '#C62828' },
  Partial: { bg: '#FFF8E1', color: '#F57F17' },
  Upcoming: { bg: '#E3F2FD', color: '#1565C0' },
  Ongoing: { bg: '#E0F7FA', color: '#00838F' },
  Completed: { bg: '#E8F5E9', color: '#2E7D32' },
  Cancelled: { bg: '#FFEBEE', color: '#C62828' },
  Present: { bg: '#E8F5E9', color: '#2E7D32' },
  Absent: { bg: '#FFEBEE', color: '#C62828' },
  Leave: { bg: '#FFF8E1', color: '#F57F17' },
  Holiday: { bg: '#EDE7F6', color: '#6A1B9A' },
  Graduated: { bg: '#E3F2FD', color: '#1565C0' },
  Transferred: { bg: '#FFF3E0', color: '#E65100' },
};

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const colors = STATUS_COLORS[status] || { bg: '#F5F5F5', color: '#616161' };

  return (
    <Chip
      label={status}
      size={size}
      sx={{
        background: colors.bg,
        color: colors.color,
        fontWeight: 700,
        fontSize: '0.72rem',
        border: `1px solid ${colors.color}30`,
        letterSpacing: '0.02em',
      }}
    />
  );
};

export default StatusChip;
