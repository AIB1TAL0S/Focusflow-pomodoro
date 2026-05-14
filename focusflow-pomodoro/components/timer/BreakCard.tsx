import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

interface BreakCardProps {
  isLongBreak: boolean;
  pomodorosBeforeLong: number;
  onSkipBreak: () => void;
}

export function BreakCard({ isLongBreak, pomodorosBeforeLong, onSkipBreak }: BreakCardProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} gradient glow glowColor={Colors.secondary}>
        <View style={[styles.icon, { backgroundColor: `${Colors.secondary}25` }]}>
          <Text style={{ fontSize: 28 }}>☕</Text>
        </View>
        <ThemedText
          variant="bodyLarge"
          color={colors.onSurfaceVariant}
          style={styles.message}
        >
          {isLongBreak
            ? `You've completed ${pomodorosBeforeLong} sessions! Time for a longer break.`
            : 'Step away from the screen. Stretch, hydrate, rest your eyes.'}
        </ThemedText>
        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: colors.surfaceContainerLow }]}
          onPress={onSkipBreak}
        >
          <ThemedText variant="labelLarge" color={colors.onSurface}>Skip Break</ThemedText>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  skipButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
  },
});
