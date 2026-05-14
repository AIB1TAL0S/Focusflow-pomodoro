import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';
import { Task } from '@/types/database';
import {
  calculateRemainingTimelineDuration,
  getRemainingTaskPomodoros,
} from '@/lib/schedule';

interface EstimatedFinishProps {
  tasks: Task[];
  selectedTask: Task | null;
  focusDuration: number;   // seconds
  shortBreak: number;      // seconds
  longBreak: number;       // seconds
  pomodorosBeforeLong: number;
  sessionCount: number;
}

function formatFinishTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function EstimatedFinish({
  tasks,
  selectedTask,
  focusDuration,
  shortBreak,
  longBreak,
  pomodorosBeforeLong,
  sessionCount,
}: EstimatedFinishProps) {
  const colors = useThemeColors();

  const remainingPomodoros = getRemainingTaskPomodoros(tasks);

  if (remainingPomodoros === 0) return null;

  const totalSeconds = calculateRemainingTimelineDuration(
    remainingPomodoros,
    focusDuration,
    shortBreak,
    longBreak,
    pomodorosBeforeLong,
    sessionCount
  );

  const finishAt = new Date(Date.now() + totalSeconds * 1000);
  const totalMins = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <View style={styles.item}>
        <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>Remaining</ThemedText>
        <ThemedText variant="labelLarge" color={colors.onSurface}>
          {remainingPomodoros} 🍅
        </ThemedText>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>Total time</ThemedText>
        <ThemedText variant="labelLarge" color={colors.onSurface}>{durationLabel}</ThemedText>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>Done by</ThemedText>
        <ThemedText variant="labelLarge" color={Colors.primary}>
          {formatFinishTime(finishAt)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#ffffff20',
    marginVertical: 4,
  },
});
