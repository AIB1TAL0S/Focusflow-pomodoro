import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Typography, Spacing, Shadows } from '@/constants/theme';
import { validateEmail, validatePassword, validateDisplayName } from '@/lib/validation';

interface FieldError {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUpScreen() {
  const colors = useThemeColors();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState({ displayName: false, email: false, password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const { signUp } = useAuth();

  const validateField = (field: keyof FieldError, value: string) => {
    let result: { valid: boolean; message?: string };
    switch (field) {
      case 'displayName':
        result = value.trim() ? validateDisplayName(value) : { valid: true };
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'password':
        result = validatePassword(value);
        break;
      case 'confirmPassword':
        result = validatePassword(password, value);
        break;
      default:
        result = { valid: true };
    }
    setErrors((prev) => ({ ...prev, [field]: result.valid ? undefined : result.message }));
  };

  const handleSignUp = async () => {
    setTouched({ displayName: true, email: true, password: true, confirmPassword: true });

    if (!termsAccepted || !privacyAccepted) {
      Alert.alert('Agreement Required', 'Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    const validations = {
      displayName: displayName.trim() ? validateDisplayName(displayName) : { valid: true },
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePassword(password, confirmPassword),
    };

    const newErrors: FieldError = {};
    (Object.keys(validations) as (keyof typeof validations)[]).forEach((key) => {
      if (!validations[key].valid) {
        newErrors[key] = validations[key].message;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Success',
        'Account created! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <StatusBar style={colors.isDark ? "light" : "dark"} />
      <LinearGradient
        colors={colors.isDark ? [colors.gradientStart, colors.gradientEnd] : [colors.background, colors.background]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={{ fontSize: 40 }}>⏱️</Text>
              </LinearGradient>
            </View>
            <ThemedText variant="headlineLarge" style={styles.title}>Create Account</ThemedText>
            <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>
              Start your focus journey today
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText variant="labelLarge" style={styles.label}>Display Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  touched.displayName && errors.displayName ? styles.inputError : null,
                ]}
                placeholder="Your name"
                placeholderTextColor={colors.outline}
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (touched.displayName) validateField('displayName', text);
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, displayName: true }));
                  validateField('displayName', displayName);
                }}
                autoComplete="name"
              />
              {touched.displayName && errors.displayName && (
                <ThemedText variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {errors.displayName}
                </ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText variant="labelLarge" style={styles.label}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  touched.email && errors.email ? styles.inputError : null,
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.outline}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (touched.email) validateField('email', text);
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  validateField('email', email);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {touched.email && errors.email && (
                <ThemedText variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {errors.email}
                </ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText variant="labelLarge" style={styles.label}>Password</ThemedText>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    touched.password && errors.password ? styles.inputError : null,
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={colors.outline}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (touched.password) validateField('password', text);
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, password: true }));
                    validateField('password', password);
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={{ fontSize: 20 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {touched.password && errors.password && (
                <ThemedText variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {errors.password}
                </ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText variant="labelLarge" style={styles.label}>Confirm Password</ThemedText>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    touched.confirmPassword && errors.confirmPassword ? styles.inputError : null,
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.outline}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (touched.confirmPassword) validateField('confirmPassword', text);
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, confirmPassword: true }));
                    validateField('confirmPassword', confirmPassword);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={{ fontSize: 20 }}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword && (
                <ThemedText variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {errors.confirmPassword}
                </ThemedText>
              )}
            </View>

            {/* Terms & Privacy */}
            <View style={styles.agreements}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Text style={{ fontSize: 14 }}>✓</Text>}
                </View>
                <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={styles.checkboxLabel}>
                  I agree to the <Text style={{ color: colors.primary }}>Terms & Conditions</Text>
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setPrivacyAccepted(!privacyAccepted)}
              >
                <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
                  {privacyAccepted && <Text style={{ fontSize: 14 }}>✓</Text>}
                </View>
                <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={styles.checkboxLabel}>
                  I agree to the <Text style={{ color: colors.primary }}>Privacy Policy</Text>
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <ThemedText variant="titleMedium" color={colors.onPrimary}>
                    Sign Up
                  </ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
                Already have an account?{' '}
              </ThemedText>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <ThemedText variant="titleSmall" color={colors.primary}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginBottom: Spacing.lg,
    boxShadow: Shadows.glow,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.sm,
    color: '#f0fff8',
  },
  form: {
    gap: Spacing.md,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    color: '#f0fff8',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Typography.bodyLarge.fontSize,
    color: '#f0fff8',
    fontFamily: Typography.bodyLarge.fontFamily,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    marginTop: Spacing.xs,
  },
  passwordWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  agreements: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6ffbbe',
    borderColor: '#6ffbbe',
  },
  checkboxLabel: {
    flex: 1,
    flexWrap: 'wrap',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    boxShadow: Shadows.glow,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});