import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColors } from './use-theme-colors';
import { Spacing, Shadows } from '@/constants/theme';

export function useProfileStyles() {
  const Colors = useThemeColors();
  
  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.surface,
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
      color: Colors.onSurface,
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
      width: 88,
      height: 88,
      borderRadius: 44,
      marginBottom: Spacing.md,
      boxShadow: Shadows.glow,
    },
    avatarGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileMeta: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 9999,
      backgroundColor: Colors.surfaceContainerLow,
    },
    editForm: {
      width: '100%',
      marginTop: Spacing.md,
    },
    input: {
      backgroundColor: Colors.surfaceContainerLow,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: Colors.onSurface,
      fontFamily: 'Inter_400Regular',
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.outlineVariant,
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
      backgroundColor: Colors.primary,
      borderRadius: 12,
    },
    editButton: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: 12,
      backgroundColor: Colors.surfaceContainerLow,
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
      backgroundColor: Colors.surfaceContainerLow,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      width: 60,
      textAlign: 'center',
      fontSize: 16,
      color: Colors.onSurface,
      fontFamily: 'Inter_400Regular',
      borderWidth: 1,
      borderColor: Colors.outlineVariant,
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
    accountIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: `${Colors.error}15`,
      borderRadius: 16,
      paddingVertical: Spacing.md,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: `${Colors.error}30`,
    },
    themeButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    checkmark: {
      paddingHorizontal: Spacing.md,
    },
  }), [Colors]);
}