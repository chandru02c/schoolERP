import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
      success: string;
    };
  }
  interface PaletteOptions {
    gradient?: {
      primary?: string;
      secondary?: string;
      success?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2',
      dark: '#0D47A1',
      light: '#42A5F5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0D47A1',
      light: '#1565C0',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    warning: {
      main: '#ED6C02',
      light: '#FF9800',
      dark: '#E65100',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    background: {
      default: '#F4F6F9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1A2332',
      secondary: '#546E7A',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
      secondary: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
      success: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 4px rgba(0,0,0,0.08)',
    '0px 2px 8px rgba(0,0,0,0.10)',
    '0px 4px 16px rgba(0,0,0,0.10)',
    '0px 6px 24px rgba(0,0,0,0.10)',
    '0px 8px 32px rgba(0,0,0,0.12)',
    '0px 12px 40px rgba(0,0,0,0.12)',
    '0px 16px 48px rgba(0,0,0,0.14)',
    '0px 20px 56px rgba(0,0,0,0.14)',
    '0px 24px 64px rgba(0,0,0,0.16)',
    '0px 28px 72px rgba(0,0,0,0.16)',
    '0px 32px 80px rgba(0,0,0,0.18)',
    '0px 36px 88px rgba(0,0,0,0.18)',
    '0px 40px 96px rgba(0,0,0,0.20)',
    '0px 44px 104px rgba(0,0,0,0.20)',
    '0px 48px 112px rgba(0,0,0,0.22)',
    '0px 52px 120px rgba(0,0,0,0.22)',
    '0px 56px 128px rgba(0,0,0,0.24)',
    '0px 60px 136px rgba(0,0,0,0.24)',
    '0px 64px 144px rgba(0,0,0,0.26)',
    '0px 68px 152px rgba(0,0,0,0.26)',
    '0px 72px 160px rgba(0,0,0,0.28)',
    '0px 76px 168px rgba(0,0,0,0.28)',
    '0px 80px 176px rgba(0,0,0,0.30)',
    '0px 84px 184px rgba(0,0,0,0.30)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          background: '#F4F6F9',
        },
        '::-webkit-scrollbar': { width: '6px', height: '6px' },
        '::-webkit-scrollbar-track': { background: '#F4F6F9' },
        '::-webkit-scrollbar-thumb': {
          background: '#90CAF9',
          borderRadius: '3px',
          '&:hover': { background: '#1976D2' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.6)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 32px rgba(25, 118, 210, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '0.875rem',
          transition: 'all 0.25s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0px)' },
        },
        contained: {
          boxShadow: '0px 4px 14px rgba(0,0,0,0.15)',
          '&:hover': { boxShadow: '0px 6px 20px rgba(0,0,0,0.20)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: alpha('#1976D2', 0.02),
            transition: 'all 0.2s ease',
            '&:hover': { background: alpha('#1976D2', 0.04) },
            '&.Mui-focused': {
              background: '#fff',
              boxShadow: `0 0 0 3px ${alpha('#1976D2', 0.12)}`,
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #0D1B3E 0%, #0D47A1 100%)',
          color: '#ffffff',
          border: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          color: '#1A2332',
          boxShadow: '0px 1px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0px 24px 64px rgba(0,0,0,0.18)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            background: 'rgba(255,255,255,0.15)',
            '&:hover': { background: 'rgba(255,255,255,0.20)' },
          },
          '&:hover': { background: 'rgba(255,255,255,0.10)' },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: alpha('#1976D2', 0.06),
            fontWeight: 700,
            color: '#0D47A1',
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.15s ease',
          '&:hover': { background: alpha('#1976D2', 0.03) },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
