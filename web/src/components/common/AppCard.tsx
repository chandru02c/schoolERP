import React from 'react';
import { Card, CardContent, CardProps, Box, Typography, alpha } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { motion } from 'framer-motion';

interface AppCardProps extends Omit<CardProps, 'sx'> {
  children?: React.ReactNode;
  glassmorphism?: boolean;
  gradient?: string;
  sx?: SxProps<Theme>;
  animate?: boolean;
  delay?: number;
  headerTitle?: string;
  headerSubtitle?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

const AppCard: React.FC<AppCardProps> = ({
  children,
  glassmorphism = false,
  gradient,
  sx,
  animate = false,
  delay = 0,
  headerTitle,
  headerSubtitle,
  title,
  subtitle,
  headerAction,
  ...rest
}) => {
  const displayTitle = headerTitle || title;
  const displaySubtitle = headerSubtitle || subtitle;

  const cardStyles: SxProps<Theme> = {
    borderRadius: 3,
    ...(glassmorphism && {
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.3)',
    }),
    ...(gradient && {
      background: gradient,
      color: '#fff',
    }),
    ...sx,
  };

  const content = (
    <Card sx={cardStyles} {...rest}>
      {(displayTitle || headerAction) && (
        <Box
          sx={{
            px: 2.5,
            pt: 2.5,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            {displayTitle && (
              <Typography variant="h6" fontWeight={700}>
                {displayTitle}
              </Typography>
            )}
            {displaySubtitle && (
              <Typography variant="caption" color="text.secondary">
                {displaySubtitle}
              </Typography>
            )}
          </Box>
          {headerAction}
        </Box>
      )}
      <CardContent sx={{ pt: displayTitle ? 1 : 2 }}>{children}</CardContent>

    </Card>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export default AppCard;
