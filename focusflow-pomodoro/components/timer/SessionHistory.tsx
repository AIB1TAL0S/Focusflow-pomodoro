import React, { useMemo, useState } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Colors, Spacing } from '@/constants/theme';
import { PomodoroSession } from '@/types/database';

type Period = 'daily' | 'weekly' | 'monthly';
type SessionStatusFilter = 'all' | PomodoroSession['status'];

interface SessionHistoryProps {
  sessions: PomodoroSession[];
  period: Period;
  loading: boolean;
  error: string | null;
  clearDisabled?: boolean;
  onPeriodChange: (p: Period) => void;
  onClearSessions: (status?: PomodoroSession['status']) => Promise<{ error: Error | null }>;
}

const periodOptions: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const statusOptions: { value: SessionStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'paused', label: 'Paused' },
  { value: 'running', label: 'Running' },
];

function formatSessionTime(session: PomodoroSession, period: Period): string {
  const startedAt = new Date(session.start_time);
  const time = startedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (period === 'daily') return time;

  return `${startedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} · ${time}`;
}

function formatPeriodLabel(period: Period): string {
  switch (period) {
    case 'daily':
      return 'today';
    case 'weekly':
      return 'this week';
    case 'monthly':
      return 'this month';
  }
}

export function SessionHistory({
  sessions,
  period,
  loading,
  error,
  clearDisabled = false,
  onPeriodChange,
  onClearSessions,
}: SessionHistoryProps) {
  const colors = useThemeColors();
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('all');
  const [showAll, setShowAll] = useState(false);
  const [clearing, setClearing] = useState(false);
  const previewLimit = 5;

  const filteredSessions = useMemo(
    () =>
      statusFilter === 'all'
        ? sessions
        : sessions.filter((session) => session.status === statusFilter),
    [sessions, statusFilter]
  );

  const visibleSessions = showAll
    ? filteredSessions
    : filteredSessions.slice(0, previewLimit);
  const hiddenCount = Math.max(0, filteredSessions.length - visibleSessions.length);
  const completedCount = filteredSessions.filter(
    (session) => session.status === 'completed'
  ).length;
  const focusMinutes = filteredSessions.reduce(
    (sum, session) => sum + (session.actual_duration || session.planned_duration || 0),
    0
  );
  const clearStatus = statusFilter === 'all' ? undefined : statusFilter;
  const canClear = filteredSessions.length > 0 && !clearing && !clearDisabled;

  const handlePeriodChange = (nextPeriod: Period) => {
    setShowAll(false);
    onPeriodChange(nextPeriod);
  };

  const handleStatusChange = (nextStatus: SessionStatusFilter) => {
    setShowAll(false);
    setStatusFilter(nextStatus);
  };

  const handleClear = () => {
    if (!canClear) return;

    const statusText = statusFilter === 'all' ? '' : ` ${statusFilter}`;
    Alert.alert(
      'Clear session history?',
      `Delete ${filteredSessions.length}${statusText} sessions from ${formatPeriodLabel(period)}. Task progress will not be changed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            const { error: clearError } = await onClearSessions(clearStatus);
            setClearing(false);

            if (clearError) {
              Alert.alert('Clear Failed', clearError.message);
              return;
            }

            setShowAll(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <ThemedText variant="titleMedium" color={colors.onSurface}>
            Sessions
          </ThemedText>
          <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>
            {filteredSessions.length} shown · {focusMinutes} min
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[
            styles.clearButton,
            {
              backgroundColor: canClear ? `${Colors.error}18` : colors.surfaceContainerLow,
              borderColor: canClear ? `${Colors.error}80` : colors.outlineVariant,
            },
          ]}
          disabled={!canClear}
          onPress={handleClear}
        >
          <Text style={{ fontSize: 13 }}>🗑️</Text>
          <ThemedText
            variant="labelMedium"
            color={canClear ? Colors.error : colors.onSurfaceVariant}
          >
            {clearing ? 'Clearing' : 'Clear'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.panel} gradient>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryItem, { backgroundColor: colors.surfaceContainerLow }]}>
            <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>Completed</ThemedText>
            <ThemedText variant="titleSmall" color={colors.onSurface}>{completedCount}</ThemedText>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: colors.surfaceContainerLow }]}>
            <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>Minutes</ThemedText>
            <ThemedText variant="titleSmall" color={colors.onSurface}>{focusMinutes}</ThemedText>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: colors.surfaceContainerLow }]}>
            <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>Range</ThemedText>
            <ThemedText variant="titleSmall" color={colors.primary}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <View style={styles.filterRow}>
            {periodOptions.map((option) => {
              const active = period === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceContainerLow,
                      borderColor: active ? colors.primary : colors.outlineVariant,
                    },
                  ]}
                  onPress={() => handlePeriodChange(option.value)}
                >
                  <ThemedText
                    variant="labelMedium"
                    color={active ? colors.onPrimary : colors.onSurface}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterRow}>
            {statusOptions.map((option) => {
              const active = statusFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? `${colors.tertiary}24` : colors.surfaceContainerLow,
                      borderColor: active ? colors.tertiary : colors.outlineVariant,
                    },
                  ]}
                  onPress={() => handleStatusChange(option.value)}
                >
                  <ThemedText
                    variant="labelMedium"
                    color={active ? colors.tertiary : colors.onSurface}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {error && (
          <View style={[styles.messageBox, { backgroundColor: `${Colors.error}18` }]}>
            <ThemedText variant="bodySmall" color={Colors.error}>
              {error}
            </ThemedText>
          </View>
        )}

        {loading ? (
          <View style={styles.messageBox}>
            <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
              Loading sessions...
            </ThemedText>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.messageBox}>
            <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
              No sessions for this filter
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {visibleSessions.map((session) => (
                <View
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          session.status === 'completed' ? Colors.success : Colors.error,
                      },
                    ]}
                  />
                  <View style={styles.sessionText}>
                    <ThemedText variant="bodyMedium" color={colors.onSurface} numberOfLines={1}>
                      {(session as any).task?.title || 'Unknown Task'}
                    </ThemedText>
                    <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                      {formatSessionTime(session, period)}
                      {' · '}
                      {session.actual_duration || session.planned_duration} min
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          session.status === 'completed'
                            ? `${Colors.success}20`
                            : `${Colors.error}20`,
                      },
                    ]}
                  >
                    <ThemedText
                      variant="labelSmall"
                      color={session.status === 'completed' ? Colors.success : Colors.error}
                    >
                      {session.status}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {filteredSessions.length > previewLimit && (
              <TouchableOpacity
                style={[
                  styles.showButton,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.outlineVariant,
                  },
                ]}
                onPress={() => setShowAll((current) => !current)}
              >
                <ThemedText variant="labelMedium" color={colors.onSurface}>
                  {showAll ? 'Show less' : `Show all ${filteredSessions.length} sessions`}
                </ThemedText>
                {!showAll && hiddenCount > 0 && (
                  <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                    {hiddenCount} more
                  </ThemedText>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  clearButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  panel: {
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 12,
    gap: 2,
  },
  filterGroup: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageBox: {
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 64,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionText: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  showButton: {
    marginTop: Spacing.md,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
