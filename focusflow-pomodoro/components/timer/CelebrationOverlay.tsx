import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';

interface CelebrationOverlayProps {
  visible: boolean;
  sessionCount: number;
  onDismiss: () => void;
}

/**
 * Uses position:absolute + zIndex instead of <Modal> for web compatibility.
 * Modal does not render reliably on Expo web.
 */
export function CelebrationOverlay({
  visible,
  sessionCount,
  onDismiss,
}: CelebrationOverlayProps) {
  const colors = useThemeColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
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
                outputRange: [0.7, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.backdrop} />
      <View style={styles.content}>
        <GlassCard style={styles.card} gradient glow glowColor={Colors.primary}>
          <Text style={styles.emoji}>🎉</Text>
          <ThemedText
            variant="headlineMedium"
            color={colors.onSurface}
            style={{ textAlign: 'center' }}
          >
            Cycle Complete!
          </ThemedText>
          <ThemedText
            variant="bodyLarge"
            color={colors.onSurfaceVariant}
            style={styles.message}
          >
            You crushed {sessionCount} focus sessions. Time for a well-earned long break.
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <LinearGradient
              colors={[Colors.primary, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <ThemedText variant="labelLarge" color="#fff">
                Let&apos;s go! ☕
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
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
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  button: {
    marginTop: Spacing.lg,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 14,
  },
});
