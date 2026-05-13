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
import { validateEmail, validatePassword } from '@/lib/validation';

interface FieldError {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const validateField = (field: 'email' | 'password', value: string) => {
    const result = field === 'email' ? validateEmail(value) : validatePassword(value);
    setErrors((prev) => ({ ...prev, [field]: result.valid ? undefined : result.message }));
  };

  const handleLogin = async () => {
    setTouched({ email: true, password: true });

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.valid || !passwordValidation.valid) {
      setErrors({
        email: emailValidation.message,
        password: passwordValidation.message,
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)');
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
            <ThemedText variant="headlineLarge" style={styles.title}>Welcome Back</ThemedText>
            <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant}>
              Sign in to continue your focus journey
            </ThemedText>
          </View>

          <View style={styles.form}>
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
                  placeholder="Enter your password"
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
                  autoComplete="password"
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

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleLogin}
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
                    Sign In
                  </ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
                Don't have an account?{' '}
              </ThemedText>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <ThemedText variant="titleSmall" color={colors.primary}>
                    Sign Up
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
  errorText: {
    marginTop: Spacing.xs,
  },
  signInButton: {
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