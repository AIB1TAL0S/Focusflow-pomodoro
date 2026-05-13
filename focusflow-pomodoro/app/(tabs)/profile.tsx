import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import {
  validateDisplayName,
  validateFocusDuration,
  validateBreakDuration,
  validatePomodorosBeforeLong,
} from '@/lib/validation';

export default function ProfileScreen() {
  const { user, profile, preferences, refreshProfile, refreshPreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const colors = useThemeColors();
  const { isDark } = colors;
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [loading, setLoading] = useState(true);
  const [localPrefs, setLocalPrefs] = useState({
    focus_duration: preferences?.focus_duration || 25,
    short_break_duration: preferences?.short_break_duration || 5,
    long_break_duration: preferences?.long_break_duration || 15,
    pomodoros_before_long_break: preferences?.pomodoros_before_long_break || 4,
    auto_start_breaks: preferences?.auto_start_breaks ?? false,
    notifications_enabled: preferences?.notifications_enabled ?? true,
  });

  useFocusEffect(
    useCallback(() => {
      setLoading(false);
    }, [])
  );

  const updateProfile = async () => {
    if (!user) return;
    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.message);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      await refreshProfile();
      setEditingProfile(false);
    }
  };

  const updatePreferences = async () => {
    if (!user) return;

    const validations = [
      validateFocusDuration(localPrefs.focus_duration),
      validateBreakDuration(localPrefs.short_break_duration),
      validateBreakDuration(localPrefs.long_break_duration),
      validatePomodorosBeforeLong(localPrefs.pomodoros_before_long_break),
    ];

    const firstError = validations.find((v) => !v.valid);
    if (firstError) {
      Alert.alert('Validation Error', firstError.message);
      return;
    }

    const { error } = await supabase
      .from('user_preferences')
      .update({
        focus_duration: localPrefs.focus_duration,
        short_break_duration: localPrefs.short_break_duration,
        long_break_duration: localPrefs.long_break_duration,
        pomodoros_before_long_break: localPrefs.pomodoros_before_long_break,
        auto_start_breaks: localPrefs.auto_start_breaks,
        notifications_enabled: localPrefs.notifications_enabled,
      })
      .eq('user_id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      await refreshPreferences();
      setEditingPreferences(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            router.replace('/signout');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Password Reset', 'Check your email for the password reset link.');
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: 60,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      color: colors.onSurface,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    profileCard: {
      alignItems: 'center',
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    profileMeta: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 9999,
      backgroundColor: colors.surfaceContainerLow,
    },
    editForm: {
      width: '100%',
      marginTop: Spacing.md,
    },
    input: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.onSurface,
      fontFamily: 'Inter_400Regular',
      marginBottom: Spacing.md,
    },
    editButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.md,
    },
    cancelBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    saveBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    editButton: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.surfaceContainerLow,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    preferencesView: {
      gap: Spacing.md,
    },
    preferencesEdit: {
      gap: Spacing.lg,
    },
    prefGroup: {
      gap: Spacing.sm,
    },
    prefGroupTitle: {
      marginBottom: Spacing.xs,
    },
    prefRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    prefInputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    prefInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    prefInput: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      width: 60,
      textAlign: 'center',
      fontSize: 16,
      color: colors.onSurface,
      fontFamily: 'Inter_400Regular',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    accountLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.errorContainer,
      borderRadius: 12,
      paddingVertical: Spacing.md,
      marginTop: Spacing.md,
    },
  }), [colors]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={isDark ? [colors.gradientStart, colors.gradientEnd] : [colors.background, colors.background]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <ThemedText variant="headlineMedium" style={styles.headerTitle}>Profile</ThemedText>
        </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <ThemedText variant="displayMedium" color={colors.onPrimary}>
              {(profile?.display_name || user?.email || '?').charAt(0).toUpperCase()}
            </ThemedText>
          </View>

          {editingProfile ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display Name"
                placeholderTextColor={colors.outline}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingProfile(false)}>
                  <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={updateProfile}>
                  <ThemedText variant="bodyMedium" color={colors.onPrimary}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ThemedText variant="headlineSmall" color={colors.onSurface}>{profile?.display_name || 'User'}</ThemedText>
              <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>{user?.email}</ThemedText>
              <View style={styles.profileMeta}>
                <View style={styles.metaBadge}>
                  <IconSymbol name="checkmark.shield" size={12} color={colors.tertiaryFixedDim} />
                  <ThemedText variant="labelSmall" color={colors.tertiaryFixedDim}>Verified</ThemedText>
                </View>
                <View style={styles.metaBadge}>
                  <IconSymbol name="clock" size={12} color={colors.onSurfaceVariant} />
                  <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                    Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditingProfile(true)}>
                <ThemedText variant="labelLarge" color={colors.onSurface}>Edit Profile</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        {/* Pomodoro Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="titleLarge" color={colors.onSurface}>Pomodoro Settings</ThemedText>
            {editingPreferences ? (
              <View style={styles.editButtons}>
                <TouchableOpacity onPress={() => setEditingPreferences(false)}>
                  <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={updatePreferences}>
                  <ThemedText variant="bodyMedium" color={colors.primary}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingPreferences(true)}>
                <ThemedText variant="bodyMedium" color={colors.primary}>Edit</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <GlassCard>
            {editingPreferences ? (
              <View style={styles.preferencesEdit}>
                <View style={styles.prefGroup}>
                  <ThemedText variant="labelLarge" color={colors.onSurface} style={styles.prefGroupTitle}>Timer Durations</ThemedText>
<PreferenceInput
                    label="Focus Duration"
                    value={localPrefs.focus_duration}
                    unit="min"
                    onChange={(v) => setLocalPrefs({ ...localPrefs, focus_duration: v })}
                    colors={colors}
                    styles={styles}
                  />
                   <PreferenceInput
                    label="Short Break"
                    value={localPrefs.short_break_duration}
                    unit="min"
                    onChange={(v) => setLocalPrefs({ ...localPrefs, short_break_duration: v })}
                    colors={colors}
                    styles={styles}
                  />
                   <PreferenceInput
                    label="Long Break"
                    value={localPrefs.long_break_duration}
                    unit="min"
                    onChange={(v) => setLocalPrefs({ ...localPrefs, long_break_duration: v })}
                    colors={colors}
                    styles={styles}
                  />
                   <PreferenceInput
                    label="Pomodoros Before Long Break"
                    value={localPrefs.pomodoros_before_long_break}
                    unit="sessions"
                    onChange={(v) => setLocalPrefs({ ...localPrefs, pomodoros_before_long_break: v })}
                    colors={colors}
                    styles={styles}
                  />
                </View>

                <View style={styles.prefGroup}>
                  <ThemedText variant="labelLarge" color={colors.onSurface} style={styles.prefGroupTitle}>Behavior</ThemedText>
                  <View style={styles.switchRow}>
                    <ThemedText variant="bodyMedium" color={colors.onSurface}>Auto-start Breaks</ThemedText>
                    <Switch
                      value={localPrefs.auto_start_breaks}
                      onValueChange={(v) => setLocalPrefs({ ...localPrefs, auto_start_breaks: v })}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <ThemedText variant="bodyMedium" color={colors.onSurface}>Notifications</ThemedText>
                    <Switch
                      value={localPrefs.notifications_enabled}
                      onValueChange={(v) => setLocalPrefs({ ...localPrefs, notifications_enabled: v })}
                    />
                  </View>
                </View>

              </View>
            ) : (
              <View style={styles.preferencesView}>
                <View style={styles.prefGroup}>
                  <ThemedText variant="labelLarge" color={colors.onSurfaceVariant} style={styles.prefGroupTitle}>Timer Durations</ThemedText>
<PreferenceRow label="Focus Duration" value={`${preferences?.focus_duration || 25} min`} colors={colors} styles={styles} />
                   <PreferenceRow label="Short Break" value={`${preferences?.short_break_duration || 5} min`} colors={colors} styles={styles} />
                   <PreferenceRow label="Long Break" value={`${preferences?.long_break_duration || 15} min`} colors={colors} styles={styles} />
                   <PreferenceRow label="Pomodoros Before Long Break" value={`${preferences?.pomodoros_before_long_break || 4}`} colors={colors} styles={styles} />
                </View>
                <View style={styles.prefGroup}>
                  <ThemedText variant="labelLarge" color={colors.onSurfaceVariant} style={styles.prefGroupTitle}>Behavior</ThemedText>
                  <PreferenceRow label="Auto-start Breaks" value={preferences?.auto_start_breaks ? 'On' : 'Off'} colors={colors} styles={styles} />
                  <PreferenceRow label="Notifications" value={preferences?.notifications_enabled ? 'On' : 'Off'} colors={colors} styles={styles} />
                </View>
              </View>
            )}
          </GlassCard>
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <ThemedText variant="titleLarge" color={colors.onSurface} style={styles.sectionTitle}>Account</ThemedText>
          <GlassCard>
<TouchableOpacity style={styles.accountRow} onPress={handleChangePassword}>
               <View style={styles.accountLeft}>
                 <IconSymbol name="lock" size={20} color={colors.onSurface} />
                 <ThemedText variant="bodyMedium" color={colors.onSurface}>Change Password</ThemedText>
               </View>
               <ThemedText style={{ fontSize: 16 }}>➡️</ThemedText>
             </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <ThemedText variant="titleLarge" color={colors.onSurface} style={styles.sectionTitle}>Appearance</ThemedText>
          <GlassCard>
            <View style={styles.switchRow}>
              <View style={styles.accountLeft}>
                <IconSymbol name={isDark ? "moon.fill" : "sun.max"} size={20} color={colors.onSurface} />
                <ThemedText variant="bodyMedium" color={colors.onSurface}>Dark Mode</ThemedText>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              />
            </View>
          </GlassCard>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
          <ThemedText variant="titleMedium" color={colors.error}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

function PreferenceRow({ label, value, colors, styles }: { label: string; value: string; colors: ReturnType<typeof useThemeColors>; styles: any }) {
  return (
    <View style={styles.prefRow}>
      <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>{label}</ThemedText>
      <ThemedText variant="bodyMedium" color={colors.onSurface}>{value}</ThemedText>
    </View>
  );
}

function PreferenceInput({
  label,
  value,
  unit,
  onChange,
  colors,
  styles,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  colors: ReturnType<typeof useThemeColors>;
  styles: any;
}) {
  return (
    <View style={styles.prefInputRow}>
      <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>{label}</ThemedText>
      <View style={styles.prefInputWrapper}>
        <TextInput
          style={styles.prefInput}
          value={String(value)}
          onChangeText={(t) => onChange(parseInt(t) || 0)}
          keyboardType="number-pad"
        />
        <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>{unit}</ThemedText>
      </View>
    </View>
  );
}