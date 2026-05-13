import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonCard } from '@/components/Skeleton';
import { Colors, Spacing } from '@/constants/theme';

export function AnalyticsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={140} height={28} borderRadius={8} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Toggle */}
        <Skeleton width="100%" height={40} borderRadius={12} style={{ marginBottom: Spacing.lg }} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <SkeletonCard style={[styles.statCard, { flex: 1 }]} />
          <SkeletonCard style={[styles.statCard, { flex: 1 }]} />
          <SkeletonCard style={[styles.statCard, { flex: 1 }]} />
        </View>

        {/* Streak Card */}
        <SkeletonCard style={{ marginBottom: Spacing.lg }} />

        {/* Chart */}
        <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.lg, height: 200 }} />

        {/* Category Distribution */}
        <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
        <SkeletonCard style={{ marginBottom: Spacing.lg }} />

        {/* Task Completion */}
        <Skeleton width={140} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
