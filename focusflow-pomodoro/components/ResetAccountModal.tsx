import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

// The exact string the user must type to confirm the reset
const CONFIRMATION_PHRASE = 'RESET';

type Step = 'warning' | 'confirm' | 'deleting' | 'done';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when the user completes confirmation. Perform the actual reset here. */
  onConfirm: () => Promise<{ success: boolean; error: string | null }>;
}

export function ResetAccountModal({ visible, onClose, onConfirm }: Props) {
  const colors = useThemeColors();
  const [step, setStep] = useState<Step>('warning');
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    // Don't allow closing while deletion is in progress
    if (step === 'deleting') return;
    setStep('warning');
    setInputValue('');
    setErrorMessage(null);
    onClose();
  }, [step, onClose]);

  const handleProceedToConfirm = () => {
    setStep('confirm');
    setInputValue('');
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (inputValue.trim().toUpperCase() !== CONFIRMATION_PHRASE) {
      setErrorMessage(`Type "${CONFIRMATION_PHRASE}" exactly to confirm.`);
      return;
    }

    setStep('deleting');
    setErrorMessage(null);

    const result = await onConfirm();

    if (!result.success) {
      setErrorMessage(result.error ?? 'Something went wrong. Please try again.');
      setStep('confirm');
      return;
    }

    setStep('done');
  };

  const s = styles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        {/* Backdrop tap to dismiss (only on warning step) */}
        <Pressable style={StyleSheet.absoluteFill} onPress={step === 'warning' ? handleClose : undefined} />

        <View style={s.sheet}>
          {/* ── Step 1: Warning ─────────────────────────────────────────── */}
          {step === 'warning' && (
            <>
              <View style={s.iconWrap}>
                <ThemedText style={s.icon}>⚠️</ThemedText>
              </View>
              <ThemedText variant="headlineSmall" color={colors.onSurface} style={s.title}>
                Reset Account Data
              </ThemedText>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={s.body}>
                This will permanently delete:
              </ThemedText>
              <View style={s.bulletList}>
                {[
                  'All Pomodoro session history',
                  'All tasks and categories',
                  'All generated schedules',
                  'All analytics and activity logs',
                ].map((item) => (
                  <View key={item} style={s.bulletRow}>
                    <ThemedText variant="bodyMedium" color={Colors.error}>• </ThemedText>
                    <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>{item}</ThemedText>
                  </View>
                ))}
              </View>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={s.body}>
                Your account, email, and preferences will be kept. All active sessions on other devices will be signed out.
              </ThemedText>
              <ThemedText variant="labelMedium" color={Colors.error} style={s.irreversible}>
                This action cannot be undone.
              </ThemedText>

              <View style={s.buttonRow}>
                <TouchableOpacity style={s.cancelButton} onPress={handleClose}>
                  <ThemedText variant="labelLarge" color={colors.onSurface}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={s.dangerButton} onPress={handleProceedToConfirm}>
                  <ThemedText variant="labelLarge" color="#fff">Continue</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 2: Type to confirm ──────────────────────────────────── */}
          {(step === 'confirm' || step === 'deleting') && (
            <>
              <View style={s.iconWrap}>
                <ThemedText style={s.icon}>🗑️</ThemedText>
              </View>
              <ThemedText variant="headlineSmall" color={colors.onSurface} style={s.title}>
                Confirm Reset
              </ThemedText>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={s.body}>
                Type{' '}
                <ThemedText variant="bodyMedium" color={Colors.error} style={s.phrase}>
                  {CONFIRMATION_PHRASE}
                </ThemedText>{' '}
                in the box below to confirm you want to permanently delete all your data.
              </ThemedText>

              <TextInput
                style={[
                  s.input,
                  errorMessage ? s.inputError : null,
                  step === 'deleting' ? s.inputDisabled : null,
                ]}
                value={inputValue}
                onChangeText={(t) => {
                  setInputValue(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={CONFIRMATION_PHRASE}
                placeholderTextColor={colors.outline}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={step !== 'deleting'}
              />

              {errorMessage && (
                <ThemedText variant="labelSmall" color={Colors.error} style={s.errorText}>
                  {errorMessage}
                </ThemedText>
              )}

              <View style={s.buttonRow}>
                <TouchableOpacity
                  style={[s.cancelButton, step === 'deleting' && s.buttonDisabled]}
                  onPress={handleClose}
                  disabled={step === 'deleting'}
                >
                  <ThemedText variant="labelLarge" color={colors.onSurface}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.dangerButton,
                    (inputValue.trim().toUpperCase() !== CONFIRMATION_PHRASE || step === 'deleting') && s.buttonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={inputValue.trim().toUpperCase() !== CONFIRMATION_PHRASE || step === 'deleting'}
                >
                  {step === 'deleting' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText variant="labelLarge" color="#fff">Delete All Data</ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              {step === 'deleting' && (
                <ThemedText variant="labelSmall" color={colors.onSurfaceVariant} style={s.deletingNote}>
                  Deleting your data and signing out all sessions…
                </ThemedText>
              )}
            </>
          )}

          {/* ── Step 3: Done (shown briefly before parent signs out) ─────── */}
          {step === 'done' && (
            <>
              <View style={s.iconWrap}>
                <ThemedText style={s.icon}>✅</ThemedText>
              </View>
              <ThemedText variant="headlineSmall" color={colors.onSurface} style={s.title}>
                Data Deleted
              </ThemedText>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={s.body}>
                All your activity data has been wiped. You will be signed out now.
              </ThemedText>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surfaceContainer,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: Spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    },
    iconWrap: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    icon: {
      fontSize: 40,
    },
    title: {
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    body: {
      textAlign: 'center',
      marginBottom: Spacing.sm,
      lineHeight: 22,
    },
    bulletList: {
      alignSelf: 'flex-start',
      width: '100%',
      marginBottom: Spacing.md,
      paddingLeft: Spacing.md,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    irreversible: {
      textAlign: 'center',
      marginBottom: Spacing.lg,
      fontWeight: '600',
    },
    phrase: {
      fontWeight: '700',
      letterSpacing: 1,
    },
    input: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 10,
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.onSurface,
      textAlign: 'center',
      borderWidth: 1.5,
      borderColor: colors.outline,
      marginBottom: Spacing.sm,
    },
    inputError: {
      borderColor: Colors.error,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    errorText: {
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
    },
    dangerButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: Colors.error,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    deletingNote: {
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
  });
