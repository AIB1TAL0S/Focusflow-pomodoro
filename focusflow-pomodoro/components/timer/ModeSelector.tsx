import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

interface ModeSelectorProps {
  mode: TimerMode;
  onChange: (mode: TimerMode) => void;
  disabled?: boolean;
}

const MODES: { key: TimerMode; label: string }[] = [
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'short_break', label: 'Short Break' },
  { key: 'long_break', label: 'Long Break' },
];

export function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      {MODES.map((m) => {
        const active = mode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.tab,
              active && { backgroundColor: Colors.primary },
            ]}
            onPress={() => !disabled && onChange(m.key)}
            disabled={disabled}
          >
            <ThemedText
              variant="labelMedium"
              color={active ? '#fff' : colors.onSurfaceVariant}
            >
              {m.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
});
