import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';
import { Task } from '@/types/database';

interface SelectedTaskCardProps {
  task: Task;
  onChangeTask: () => void;
}

export function SelectedTaskCard({ task, onChangeTask }: SelectedTaskCardProps) {
  const colors = useThemeColors();
  const progress = Math.min(
    (task.completed_pomodoros / task.estimated_pomodoros) * 100,
    100
  );

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} gradient glow glowColor={Colors.primary}>
        <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>
          Focusing on
        </ThemedText>
        <ThemedText variant="titleMedium" color={colors.onSurface} style={{ marginTop: Spacing.xs }}>
          {task.title}
        </ThemedText>
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
            {task.completed_pomodoros}/{task.estimated_pomodoros}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={onChangeTask}>
          <ThemedText variant="bodyMedium" color={Colors.primary} style={{ marginTop: Spacing.sm }}>
            Change Task
          </ThemedText>
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
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
