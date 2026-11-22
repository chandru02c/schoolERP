import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Groups as GroupsIcon,
  EmojiEvents as EmojiEventsIcon,
  ArrowForward as ArrowForwardIcon,
  SwitchAccount as SwitchAccountIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/common/AppButton';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { cognitoAuthService } from '../../services/cognitoAuthService';
import { tokenService } from '../../utils/tokenService';
import { sessionService } from '../../utils/sessionService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { authError, clearAuthError } = useAuth();

  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [storedUserType, setStoredUserType] = useState<string | null>(null);
  const [storedUser, setStoredUser] = useState<any | null>(null);
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const hasCodeInUrl = typeof window !== 'undefined' && window.location.search.includes('code=');

  useEffect(() => {
    // If returning from Cognito callback, let AuthContext handle token exchange
    if (hasCodeInUrl) {
      setCheckingSession(false);
      return;
    }

    try {
      // 1. When the application loads, check stored session using centralized sessionService
      const userObj = sessionService.getUser();
      const email = sessionService.getEmail() || userObj?.email || null;
      const token = sessionService.getItem('token') || tokenService.getAccessToken();
      const isTokenValid = !!(token && !tokenService.isTokenExpired());

      // 2. If storage contains a valid user object, email exists, and token is not expired:
      if (userObj && email && isTokenValid && sessionService.hasValidSession()) {
        setStoredUser(userObj);
        setStoredEmail(email);

        const userType = sessionService.getUserType();
        setStoredUserType(userType);

        setHasValidSession(true);
        setCheckingSession(false);
      } else {
        // After logout or when no valid session exists:
        // Display Login page. Do not automatically redirect to Cognito. Do not automatically redirect into application.
        setHasValidSession(false);
        setStoredEmail(null);
        setStoredUser(null);
        setStoredUserType(null);
        setCheckingSession(false);
        setIsRedirecting(false);
      }
    } catch (err: any) {
      console.error('[Login Flow] Session check exception:', err);
      setHasValidSession(false);
      setCheckingSession(false);
    }
  }, [hasCodeInUrl]);

  // When the Login button is clicked on existing session: continue authentication process
  const handleContinue = () => {
    const token = sessionService.getItem('token') || tokenService.getAccessToken();

    // Prevent automatic login using stale or expired token
    if (!token || tokenService.isTokenExpired()) {
      console.warn('[Login Flow] Stored session or token is expired. Clearing stale data and redirecting to Cognito...');
      sessionService.clearSession();
      tokenService.clearTokens();
      setIsRedirecting(true);
      cognitoAuthService.redirectToLogin(true).catch((err: any) => {
        console.error('[Login Flow] Cognito redirect failed:', err);
        setRedirectError('Failed to connect to AWS Cognito. Please check your network connection.');
        setIsRedirecting(false);
      });
      return;
    }

    // User-specific URL navigation: /{user_type}/{teacher_id}
    const redirectUrl = sessionService.getRedirectUrl();
    navigate(redirectUrl);
  };

  // When Login button is clicked for a fresh login session (e.g. after logout or first visit)
  const handleFreshLogin = () => {
    setIsRedirecting(true);
    setRedirectError(null);
    if (clearAuthError) clearAuthError();

    console.log('[Login Flow] Starting fresh login session with AWS Cognito...');
    cognitoAuthService.redirectToLogin(true).catch((err: any) => {
      console.error('[Login Flow] Cognito redirect failed:', err);
      setRedirectError('Failed to connect to AWS Cognito. Please check your network connection.');
      setIsRedirecting(false);
    });
  };

  // Use Different Account -> Clear all session storage, localStorage, tokens & redirect to Cognito
  const handleUseDifferentAccount = () => {
    console.log('[Login Flow] Switching account. Clearing all session data and redirecting to Cognito...');
    sessionService.clearSession();
    tokenService.clearTokens();
    setHasValidSession(false);
    setStoredEmail(null);
    setStoredUser(null);
    setStoredUserType(null);
    setIsRedirecting(true);
    setRedirectError(null);
    if (clearAuthError) clearAuthError();

    cognitoAuthService.redirectToLogin(true).catch((err: any) => {
      console.error('[Login Flow] Cognito redirect failed:', err);
      setRedirectError('Failed to connect to AWS Cognito. Please check your network connection.');
      setIsRedirecting(false);
    });
  };

  const handleForgotPassword = () => {
    cognitoAuthService.redirectToForgotPassword();
  };

  // If OAuth callback is processing in AuthContext, show fullScreen loader
  if (hasCodeInUrl) {
    return <Loader fullScreen text="Authenticating with AWS Cognito..." />;
  }

  // During the first session check tick, show brief fullScreen loader
  if (checkingSession) {
    return <Loader fullScreen text="Verifying session..." />;
  }

  const features = [
    { icon: SchoolIcon, title: 'Student Management', desc: 'Manage students, admissions & records' },
    { icon: GroupsIcon, title: 'Staff Portal', desc: 'Teachers, staff & HR management' },
    { icon: MenuBookIcon, title: 'Academic Control', desc: 'Classes, exams & attendance' },
    { icon: EmojiEventsIcon, title: 'Events & Reports', desc: 'Calendar, reports & analytics' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0A1628 0%, #0D47A1 50%, #1565C0 100%)',
          zIndex: 0,
        }}
      />
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            width: [400, 300, 200, 250, 350][i],
            height: [400, 300, 200, 250, 350][i],
            top: [`-10%`, `60%`, `30%`, `70%`, `-5%`][i],
            left: [`-5%`, `-8%`, `20%`, `50%`, `70%`][i],
          }}
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: [6, 8, 7, 9, 5][i], repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Left Panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: 8,
          py: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          {/* Logo */}
          <Box display="flex" alignItems="center" gap={2} mb={5}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <SchoolIcon sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff">
                School ERP
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Management System
              </Typography>
            </Box>
          </Box>

          <Typography variant="h3" fontWeight={800} color="#fff" lineHeight={1.15} mb={2}>
            Manage Your School<br />
            <Box component="span" sx={{ color: '#64B5F6' }}>
              Smarter & Faster
            </Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 6, maxWidth: 420, lineHeight: 1.8 }}>
            A complete multi-tenant ERP platform for schools, tuition centres, academies, and educational institutions.
          </Typography>

          {/* Feature cards */}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} maxWidth={480}>
            {features.map((f, i) => {
              const IconComponent = f.icon;

              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      transition: 'all 0.3s ease',
                      '&:hover': { background: 'rgba(255,255,255,0.14)', transform: 'translateY(-2px)' },
                    }}
                  >
                    <Box sx={{ color: '#64B5F6', mb: 1 }}>
                      <IconComponent sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} color="#fff">
                      {f.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {f.desc}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </Box>
        </motion.div>
      </Box>

      {/* Right Panel - Login Card */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 4 },
          position: 'relative',
          zIndex: 1,
          bgcolor: { xs: 'transparent', md: 'rgba(255,255,255,0.05)' },
          backdropFilter: { md: 'blur(20px)' },
          borderLeft: { md: '1px solid rgba(255,255,255,0.1)' },
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    mx: 'auto',
                    mb: 2,
                    background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(25,118,210,0.4)',
                  }}
                >
                  <SchoolIcon sx={{ color: '#fff', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {hasValidSession ? 'Welcome Back' : 'Sign In'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {hasValidSession ? 'Continue with your active session' : 'Sign in to your School ERP account'}
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={2.5}>
                {/* Error Alerts */}
                {authError && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: 2 }}
                    onClose={() => {
                      if (clearAuthError) clearAuthError();
                    }}
                  >
                    {authError}
                  </Alert>
                )}
                {redirectError && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: 2 }}
                    onClose={() => setRedirectError(null)}
                  >
                    {redirectError}
                  </Alert>
                )}

                {/* Valid session exists -> Display Account Info, Continue, and Switch Account */}
                {hasValidSession && storedEmail ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: '#1976D2',
                          width: 44,
                          height: 44,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {storedEmail[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} color="primary.main" noWrap>
                          Continue as {storedEmail}
                        </Typography>
                        {storedUser?.name && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {storedUser.name}
                          </Typography>
                        )}
                        {storedUserType && (
                          <Chip
                            label={storedUserType}
                            size="small"
                            color={storedUserType === 'ADMIN' ? 'primary' : 'success'}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Continue Button */}
                    <AppButton
                      onClick={handleContinue}
                      fullWidth
                      size="large"
                      startIcon={<ArrowForwardIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: 2.5,
                        boxShadow: '0 6px 20px rgba(25,118,210,0.35)',
                      }}
                    >
                      Login
                    </AppButton>

                    {/* Use Different Account Button */}
                    <AppButton
                      onClick={handleUseDifferentAccount}
                      fullWidth
                      variant="outlined"
                      size="large"
                      startIcon={<SwitchAccountIcon />}
                      sx={{
                        py: 1.4,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        borderRadius: 2.5,
                        borderColor: 'rgba(0,0,0,0.2)',
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: '#1976D2',
                          bgcolor: 'rgba(25,118,210,0.04)',
                        },
                      }}
                    >
                      Use Different Account
                    </AppButton>
                  </Box>
                ) : (
                  /* No valid session exists -> Ready for user to start a fresh login session */
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      Authenticate securely using AWS Cognito Hosted UI to access protected school management features.
                    </Typography>

                    {isRedirecting && (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(25, 118, 210, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1.5,
                        }}
                      >
                        <CircularProgress size={18} thickness={5} />
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                          Connecting to AWS Cognito...
                        </Typography>
                      </Box>
                    )}

                    <AppButton
                      onClick={handleFreshLogin}
                      disabled={isRedirecting}
                      fullWidth
                      size="large"
                      startIcon={!isRedirecting ? <LoginIcon /> : undefined}
                      sx={{
                        background: 'linear-gradient(135deg, #1976D2, #0D47A1)',
                        py: 1.6,
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderRadius: 2.5,
                        boxShadow: '0 6px 20px rgba(25,118,210,0.35)',
                      }}
                    >
                      {isRedirecting ? 'Connecting to Cognito...' : 'Sign In with AWS Cognito'}
                    </AppButton>
                  </Box>
                )}

                <Box textAlign="center" mt={0.5}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#1976D2',
                      cursor: 'pointer',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={handleForgotPassword}
                  >
                    Forgot your password?
                  </Typography>
                </Box>
              </Box>

              {/* Footer */}
              <Box textAlign="center" mt={3}>
                <Typography variant="caption" color="text.disabled">
                  © 2026 School Management ERP. All rights reserved.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginPage;
