import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
} from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  severity?: 'error' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  severity = 'error',
}) => {
  const colorMap = { error: '#D32F2F', warning: '#ED6C02', info: '#1976D2' };
  const color = colorMap[severity];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: '50%',
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <WarningAmberIcon sx={{ color, fontSize: 22 }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{ background: color, '&:hover': { background: color }, borderRadius: 2 }}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
