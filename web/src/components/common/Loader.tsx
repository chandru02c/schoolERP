import React from 'react';
import { Box, CircularProgress, Backdrop, Typography } from '@mui/material';

interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
  size?: number;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, text, size = 40 }) => {
  if (fullScreen) {
    return (
      <Backdrop open sx={{ zIndex: 9999, bgcolor: 'rgba(255,255,255,0.85)', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={size} thickness={4} />
        {text && <Typography variant="body2" color="text.secondary" fontWeight={600}>{text}</Typography>}
      </Backdrop>
    );
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={1.5} py={6}>
      <CircularProgress size={size} thickness={4} />
      {text && <Typography variant="body2" color="text.secondary" fontWeight={600}>{text}</Typography>}
    </Box>
  );
};

export default Loader;
