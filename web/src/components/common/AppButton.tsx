import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface AppButtonProps extends Omit<ButtonProps, 'sx'> {
  loading?: boolean;
  sx?: SxProps<Theme>;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  loading = false,
  disabled,
  startIcon,
  variant = 'contained',
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default AppButton;
