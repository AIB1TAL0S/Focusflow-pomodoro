import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  gradient?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export function GlassCard({
  children,
  style,
  intensity = 80,
  gradient = false,
  glow = false,
  glowColor,
}: GlassCardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.container,
        glow && { boxShadow: `0px 0px 24px ${glowColor || colors.tertiary}35` },
        { backgroundColor: colors.isDark ? `${colors.surfaceContainer}60` : `${colors.surfaceContainer}80` },
        style,
      ]}
    >
      <BlurView intensity={intensity} style={StyleSheet.absoluteFill} tint={colors.isDark ? "dark" : "light"} />
      {gradient && (
        <LinearGradient
          colors={colors.isDark ? [`${colors.primary}12`, `${colors.secondary}08`, 'transparent'] : [`${colors.primary}08`, `${colors.secondary}05`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: Shadows.ambient,
  },
  content: {
    padding: 16,
  },
});