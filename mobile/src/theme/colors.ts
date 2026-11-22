/**
 * School ERP — Brand Colors & Design Tokens
 * 
 * Primary Color: #163B88 (Web Application Sidebar Primary)
 * Secondary Color: #1D4FA3
 * Accent Color: #2E67D1
 * Background: #F5F7FB
 * Card Color: #FFFFFF
 * Gradient: #163B88 to #2457B5
 */

export const colors = {
  // Brand Colors
  primary: '#163B88',
  secondary: '#1D4FA3',
  accent: '#2E67D1',
  primaryDark: '#0E275C',
  primaryLight: '#3D77E0',
  primaryLighter: '#E8F0FE',

  // Gradient
  gradientStart: '#163B88',
  gradientEnd: '#2457B5',
  primaryGradientStart: '#163B88',
  primaryGradientEnd: '#2457B5',

  // Canvas & Surfaces
  background: '#F5F7FB',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  black: '#0A0F1D',

  // Typography
  dark: '#0E1726',
  text: '#1E293B',
  textDark: '#0E1726',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#F8FAFC',

  // Status & Feedback
  success: '#10B981',
  successLight: '#ECFDF5',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#2E67D1',
  infoLight: '#EFF6FF',

  // Neutrals & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  borderFocus: '#163B88',
  divider: '#E2E8F0',
  neutral: '#64748B',
  neutralDark: '#334155',
  neutralLight: '#E2E8F0',
  neutralLighter: '#F1F5F9',

  // UI Utilities
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F8FAFC',
  transparent: 'transparent',
  overlay: 'rgba(14, 23, 38, 0.55)',

  // Legacy aliases
  cream: '#EFF6FF',
  lightOrange: '#BFDBFE',
};

export type Colors = typeof colors;
export default colors;
