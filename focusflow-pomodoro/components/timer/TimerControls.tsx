import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing, Shadows } from '@/constants/theme';

interface TimerControlsProps {
  isRunning: boolean;
  isBreak: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
}

export function TimerControls({
  isRunning,
  isBreak,
  onStart,
  onPause,
  onStop,
  onSkip,
}: TimerControlsProps) {
  const colors = useThemeColors();

  if (!isRunning) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <LinearGradient
            colors={[Colors.primary, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            <Text style={{ fontSize: 32 }}>▶️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surfaceContainerLow }]}
          onPress={onPause}
        >
          <Text style={{ fontSize: 28 }}>⏸️</Text>
        </TouchableOpacity>

        {!isBreak && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: `${Colors.warning}20` }]}
            onPress={onSkip}
          >
            <Text style={{ fontSize: 24 }}>⏭️</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: `${Colors.error}15` }]}
          onPress={onStop}
        >
          <Text style={{ fontSize: 28 }}>⏹️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    boxShadow: Shadows.glow,
  },
  startGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: Shadows.elevated,
  },
});
