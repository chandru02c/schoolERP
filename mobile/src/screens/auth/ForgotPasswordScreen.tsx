import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, APP_CONFIG } from '../../constants';
import { CustomInput, CustomButton } from '../../components';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      alert('Please enter your registered email address or mobile number.');
      return;
    }
    setLoading(true);
    // Simulate backend password reset request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top bar with back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>Password Reset</Text>
          <Text style={styles.subtitle}>
            Enter your registered mobile number or email to receive reset instructions
          </Text>
        </View>

        <View style={styles.card}>
          {submitted ? (
            <View style={styles.successBlock}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={54} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Request Sent</Text>
              <Text style={styles.successMessage}>
                Password reset instructions have been dispatched to {identifier}. Please follow the link or code provided.
              </Text>
              <CustomButton
                title="Back to Sign In"
                onPress={() => navigation.navigate('Login')}
                variant="primary"
                size="large"
                style={{ marginTop: 24, width: '100%' }}
              />
            </View>
          ) : (
            <>
              <CustomInput
                label="Registered Mobile or Email"
                placeholder="Enter email or 10-digit mobile number"
                value={identifier}
                onChangeText={setIdentifier}
                icon="mail-outline"
                autoCapitalize="none"
              />

              <CustomButton
                title="Send Reset Instructions"
                onPress={handleSubmit}
                loading={loading}
                variant="primary"
                size="large"
                style={styles.submitBtn}
              />

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
                    navigation.goBack();
                  }
                }}
              >
                <Text style={styles.cancelText}>Cancel and Return to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: '#BFDBFE',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtn: {
    marginTop: 20,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ForgotPasswordScreen;
