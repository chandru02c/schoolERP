import moment from 'moment';

export const formatDate = (date: string | Date | undefined, formatStr: string = 'DD MMM YYYY'): string => {
  if (!date) return '-';
  const m = moment(date);
  return m.isValid() ? m.format(formatStr) : '-';
};

export const formatTime = (time: string | undefined): string => {
  if (!time) return '-';
  // Check if format is HH:mm:ss or HH:mm
  const m = moment(time, ['HH:mm:ss', 'HH:mm', 'h:mm A']);
  return m.isValid() ? m.format('hh:mm A') : time;
};

export const formatCurrency = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

export const calculateGrade = (score: number, maxScore: number = 100): { grade: string; color: string; points: number } => {
  if (maxScore <= 0) return { grade: 'N/A', color: '#64748B', points: 0 };
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) return { grade: 'A+', color: '#22C55E', points: 10 };
  if (percentage >= 80) return { grade: 'A', color: '#16A34A', points: 9 };
  if (percentage >= 70) return { grade: 'B+', color: '#3B82F6', points: 8 };
  if (percentage >= 60) return { grade: 'B', color: '#6366F1', points: 7 };
  if (percentage >= 50) return { grade: 'C', color: '#F59E0B', points: 6 };
  if (percentage >= 35) return { grade: 'D', color: '#EA580C', points: 4 };
  return { grade: 'F', color: '#EF4444', points: 0 };
};

export const getInitials = (name: string | undefined): string => {
  if (!name) return 'SE';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getStatusColor = (status: string | undefined): { bg: string; text: string; border: string } => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'PRESENT':
    case 'APPROVED':
    case 'ACTIVE':
    case 'SUBMITTED':
    case 'PAID':
      return { bg: '#DCFCE7', text: '#16A34A', border: '#86EFAC' };
    case 'ABSENT':
    case 'REJECTED':
    case 'INACTIVE':
    case 'OVERDUE':
    case 'FAILED':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
    case 'LATE':
    case 'PENDING':
    case 'PARTIAL':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
    default:
      return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
  }
};
