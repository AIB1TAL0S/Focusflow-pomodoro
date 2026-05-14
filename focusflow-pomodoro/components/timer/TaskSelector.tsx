import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';
import { Task } from '@/types/database';

interface TaskSelectorProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

export function TaskSelector({ tasks, onSelect }: TaskSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <ThemedText variant="titleMedium" color={colors.onSurface} style={styles.label}>
        Select a task to focus on
      </ThemedText>

      {tasks.length === 0 ? (
        <GlassCard style={styles.emptyCard} gradient>
          <Text style={{ fontSize: 32 }}>✅</Text>
          <ThemedText
            variant="bodyMedium"
            color={colors.onSurfaceVariant}
            style={{ textAlign: 'center', marginTop: Spacing.sm }}
          >
            No pending tasks. Create one from the Dashboard.
          </ThemedText>
        </GlassCard>
      ) : (
        tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskOption, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={() => onSelect(task)}
          >
            <View style={styles.left}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: task.priority >= 4 ? Colors.error : Colors.primary },
                ]}
              />
              <ThemedText
                variant="bodyLarge"
                color={colors.onSurface}
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {task.title}
              </ThemedText>
            </View>
            <View style={styles.right}>
              <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>
                {task.completed_pomodoros}/{task.estimated_pomodoros}
              </ThemedText>
              <Text style={{ fontSize: 14 }}>›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
