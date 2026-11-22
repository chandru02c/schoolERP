import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no records to display.',
  icon,
  action,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
      gap={1}
    >
      <Box
        sx={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 1,
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 36, color: '#1976D2' }} />}
      </Box>
      <Typography variant="h6" fontWeight={700} color="text.primary">{title}</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
        {description}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick} sx={{ mt: 1, borderRadius: 2 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
