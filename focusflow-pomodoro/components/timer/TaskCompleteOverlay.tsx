import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';
import { Task } from '@/types/database';

interface TaskCompleteOverlayProps {
  visible: boolean;
  completedTask: Task | null;
  nextTask: Task | null;
  onStartNext: (task: Task) => void;
  onTakeBreak: () => void;
  onDismiss: () => void;
}

/**
 * Shown when a task's pomodoro target is reached.
 * Uses position:absolute + zIndex (not Modal) for web compatibility.
 */
export function TaskCompleteOverlay({
  visible,
  completedTask,
  nextTask,
  onStartNext,
  onTakeBreak,
  onDismiss,
}: TaskCompleteOverlayProps) {
  const colors = useThemeColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.backdrop} />
      <View style={styles.content}>
        <GlassCard style={styles.card} gradient glow glowColor={Colors.success}>
          {/* Header */}
          <Text style={styles.emoji}>✅</Text>
          <ThemedText
            variant="headlineMedium"
            color={colors.onSurface}
            style={styles.title}
          >
            Task Complete!
          </ThemedText>

          {/* Completed task name */}
          {completedTask && (
            <View style={[styles.completedBadge, { backgroundColor: `${Colors.success}18` }]}>
              <Text style={{ fontSize: 14 }}>🎯</Text>
              <ThemedText
                variant="bodyMedium"
                color={Colors.success}
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {completedTask.title}
              </ThemedText>
            </View>
          )}

          {/* Next task suggestion */}
          {nextTask ? (
            <>
              <ThemedText
                variant="bodyMedium"
                color={colors.onSurfaceVariant}
                style={styles.subtitle}
              >
                Ready for the next one?
              </ThemedText>

              <View style={[styles.nextTaskCard, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.nextTaskLeft}>
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: nextTask.priority >= 4 ? Colors.error : Colors.primary },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                      Up next
                    </ThemedText>
                    <ThemedText
                      variant="titleSmall"
                      color={colors.onSurface}
                      numberOfLines={2}
                    >
                      {nextTask.title}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                  {nextTask.completed_pomodoros}/{nextTask.estimated_pomodoros} 🍅
                </ThemedText>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.breakButton, { backgroundColor: colors.surfaceContainerLow }]}
                  onPress={onTakeBreak}
                >
                  <Text style={{ fontSize: 16 }}>☕</Text>
                  <ThemedText variant="labelLarge" color={colors.onSurfaceVariant}>
                    Take a Break
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => onStartNext(nextTask)}
                >
                  <LinearGradient
                    colors={[Colors.primary, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextButtonGradient}
                  >
                    <Text style={{ fontSize: 16 }}>▶️</Text>
                    <ThemedText variant="labelLarge" color="#fff">
                      Start Next
                    </ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* No more tasks */}
              <ThemedText
                variant="bodyLarge"
                color={colors.onSurfaceVariant}
                style={styles.subtitle}
              >
                All tasks done for now. Time to rest!
              </ThemedText>

              <TouchableOpacity
                style={styles.singleButton}
                onPress={onDismiss}
              >
                <LinearGradient
                  colors={[Colors.primary, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={{ fontSize: 16 }}>🎉</Text>
                  <ThemedText variant="labelLarge" color="#fff">
                    Awesome!
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    zIndex: 998,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  content: {
    width: '100%',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginBottom: Spacing.md,
    width: '100%',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  nextTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  nextTaskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  breakButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: 14,
  },
  nextButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: 14,
  },
  singleButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
});
