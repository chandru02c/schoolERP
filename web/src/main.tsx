import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from './redux/store';
import { theme } from './theme/theme';
import App from './App';
import Loader from './components/common/Loader';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<Loader fullScreen text="Loading..." />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <App />
            </AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                },
                success: { iconTheme: { primary: '#2E7D32', secondary: '#fff' } },
                error: { iconTheme: { primary: '#D32F2F', secondary: '#fff' } },
              }}
            />
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
