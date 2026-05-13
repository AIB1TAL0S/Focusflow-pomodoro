import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonCard } from '@/components/Skeleton';
import { Colors, Spacing } from '@/constants/theme';

export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={140} height={28} borderRadius={8} />
        <SkeletonCircle size={44} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <SkeletonCard style={[styles.statCard, { flex: 1 }]} />
          <SkeletonCard style={[styles.statCard, { flex: 1 }]} />
          <SkeletonCard style={[styles.statCard, { flex: 1 }]} />
        </View>

        {/* Schedule Section */}
        <Skeleton width={160} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.lg }} />

        {/* Category Chips */}
        <View style={styles.chipRow}>
          <Skeleton width={60} height={32} borderRadius={9999} />
          <Skeleton width={80} height={32} borderRadius={9999} />
          <Skeleton width={70} height={32} borderRadius={9999} />
          <Skeleton width={90} height={32} borderRadius={9999} />
        </View>

        {/* Task Cards */}
        <SkeletonCard style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.md }} />
      </ScrollView>
    </View>
  );
}

function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
