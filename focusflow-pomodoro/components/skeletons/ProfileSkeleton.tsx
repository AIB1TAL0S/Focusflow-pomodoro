import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonCard, SkeletonCircle } from '@/components/Skeleton';
import { Colors, Spacing } from '@/constants/theme';

export function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={100} height={28} borderRadius={8} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.lg }]}>
          <SkeletonCircle size={80} style={{ marginBottom: Spacing.md }} />
          <Skeleton width={160} height={24} borderRadius={4} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width={200} height={16} borderRadius={4} style={{ marginBottom: Spacing.sm }} />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Skeleton width={80} height={24} borderRadius={9999} />
            <Skeleton width={120} height={24} borderRadius={9999} />
          </View>
        </View>

        {/* Session Section */}
        <Skeleton width={80} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.lg }} />

        {/* Preferences Section */}
        <Skeleton width={160} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.lg }} />

        {/* Account Section */}
        <Skeleton width={80} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
  },
});
