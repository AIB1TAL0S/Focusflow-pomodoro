import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

interface PomodoroDotsRowProps {
  /** Total completed pomodoros today */
  completed: number;
  /** How many before a long break (cycle size) */
  cycleSize: number;
}

export function PomodoroDotsRow({ completed, cycleSize }: PomodoroDotsRowProps) {
  const colors = useThemeColors();

  // Show the current cycle's dots (last N within the cycle)
  const positionInCycle = completed % cycleSize;
  const dotsToShow = cycleSize;

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: dotsToShow }).map((_, i) => {
          // After a full cycle, all dots are filled until next session starts
          const allFilled = positionInCycle === 0 && completed > 0;
          const isDone = allFilled || i < positionInCycle;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: isDone
                    ? Colors.primary
                    : colors.surfaceContainerHigh,
                },
              ]}
            />
          );
        })}
      </View>
      <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
        {completed} today
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
