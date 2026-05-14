import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

interface FocusRingProps {
  timeLeft: number;
  totalTime: number;
  isBreak: boolean;
  selectedTaskTitle?: string;
  completedPomodoros?: number;
  estimatedPomodoros?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function FocusRing({
  timeLeft,
  totalTime,
  isBreak,
  selectedTaskTitle,
  completedPomodoros,
  estimatedPomodoros,
}: FocusRingProps) {
  const colors = useThemeColors();
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const currentProgress = totalTime > 0 ? timeLeft / totalTime : 1;
    Animated.timing(progress, {
      toValue: currentProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalTime, progress]);

  const rotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          isBreak ? Colors.secondary : Colors.primary,
          isBreak ? colors.gradientAccent : colors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />
      <View style={[styles.track, { borderColor: colors.surfaceContainerHigh }]} />
      <Animated.View
        style={[
          styles.progressArc,
          { transform: [{ rotate: rotation }] },
        ]}
      />
      <View style={[styles.inner, { backgroundColor: colors.surface }]}>
        <ThemedText variant="displayLarge" style={[styles.time, { color: colors.onSurface }]}>
          {formatTime(timeLeft)}
        </ThemedText>
        <ThemedText
          variant="bodyMedium"
          color={colors.onSurfaceVariant}
          style={styles.label}
          numberOfLines={2}
        >
          {isBreak
            ? 'Take a breath'
            : (selectedTaskTitle || 'Select a task')}
        </ThemedText>
        {!isBreak && completedPomodoros !== undefined && estimatedPomodoros !== undefined && (
          <ThemedText variant="labelMedium" color={Colors.primaryFixedDim}>
            {completedPomodoros}/{estimatedPomodoros} pomodoros
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  track: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 12,
  },
  progressArc: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 12,
    borderTopColor: Colors.primary,
    borderRightColor: Colors.gradientEnd,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  time: {
    letterSpacing: -2,
  },
  label: {
    marginTop: Spacing.xs,
    maxWidth: 180,
    textAlign: 'center',
  },
});
