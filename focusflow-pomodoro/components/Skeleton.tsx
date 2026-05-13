import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[{ width: width as any, height, borderRadius, overflow: 'hidden', backgroundColor: Colors.surfaceContainerHigh }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Colors.surfaceContainerLowest,
            opacity: 0.5,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

export function SkeletonText({ lines = 1, width = '100%', style }: { lines?: number; width?: number | string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 8 }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={typeof width === 'string' ? (i === lines - 1 ? '60%' : width) : width}
          height={14}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ padding: 16, backgroundColor: Colors.surfaceContainer, borderRadius: 12, gap: 12 }, style]}>
      <Skeleton width="70%" height={18} borderRadius={4} />
      <SkeletonText lines={2} width="100%" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Skeleton width={60} height={24} borderRadius={9999} />
        <Skeleton width={60} height={24} borderRadius={9999} />
      </View>
    </View>
  );
}
