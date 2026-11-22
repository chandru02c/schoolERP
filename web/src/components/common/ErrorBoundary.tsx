import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary Audit] Uncaught Error caught by React Error Boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%', borderRadius: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">Application Error</Typography>
            </Alert>

            <Typography variant="body1" color="text.secondary" paragraph>
              An unexpected error occurred while rendering this page. You remain on your current page route.
            </Typography>

            {this.state.error && (
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 3, overflowX: 'auto' }}>
                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: 'error.main' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button variant="outlined" color="secondary" onClick={this.handleReload}>
                Reload Application
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
