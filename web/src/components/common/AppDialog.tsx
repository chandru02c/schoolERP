import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disableBackdropClick?: boolean;
  headerColor?: string;
}

const AppDialog: React.FC<AppDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true,
  disableBackdropClick = false,
  headerColor,
}) => {
  const handleClose = (_: object, reason: string) => {
    if (disableBackdropClick && reason === 'backdropClick') return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'visible' },
      }}
    >
      <DialogTitle
        sx={{
          background: headerColor || 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
          color: '#fff',
          borderRadius: '12px 12px 0 0',
          py: 2.5,
          px: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700} color="inherit">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#fff', ml: 2 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2.5 }}>{children}</DialogContent>

      {actions && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>{actions}</DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default AppDialog;
