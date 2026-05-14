import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Category, DailySchedule, UserPreferences } from '@/types/database';
import { ThemedText } from '@/components/ThemedText';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Typography, Spacing, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

import { generateSchedule, saveSchedule } from '@/lib/schedule';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { validateTaskTitle, validateEstimatedPomodoros, validateCategoryName, validateDeadline } from '@/lib/validation';

interface DailyStats {
  completedPomodoros: number;
  focusMinutes: number;
  pendingTasks: number;
}

export default function DashboardScreen() {
  const { user, preferences } = useAuth();
  const colors = useThemeColors();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [stats, setStats] = useState<DailyStats>({ completedPomodoros: 0, focusMinutes: 0, pendingTasks: 0 });
  const [todaySchedule, setTodaySchedule] = useState<DailySchedule | null>(null);
  const [generatedSchedule, setGeneratedSchedule] = useState<DailySchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<string>(colors.secondary);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [taskSavePressed, setTaskSavePressed] = useState(false);
  const [categorySavePressed, setCategorySavePressed] = useState(false);
  const [counterPressed, setCounterPressed] = useState<string | null>(null);
  const [energyPressed, setEnergyPressed] = useState<string | null>(null);
  const [priorityPressed, setPriorityPressed] = useState<number | null>(null);
  const [categoryOptionPressed, setCategoryOptionPressed] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: number;
    estimated_pomodoros: number;
    energy_level: 'low' | 'medium' | 'high';
    category_id: string | null;
    focus_tags: string[];
    deadline: string | null;
  }>({
    title: '',
    description: '',
    priority: 3,
    estimated_pomodoros: 1,
    energy_level: 'medium',
    category_id: null,
    focus_tags: [],
    deadline: null,
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    const [{ data: tasksData }, { data: categoriesData }, { data: sessionsData }, { data: scheduleData }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', `${today}T00:00:00.000Z`),
      supabase
        .from('daily_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .limit(1),
    ]);

    setTasks(tasksData || []);
    setCategories(categoriesData || []);

    const completedPomodoros = sessionsData?.reduce((sum, s) => sum + 1, 0) || 0;
    const focusMinutes = sessionsData?.reduce((sum, s) => sum + (s.actual_duration || s.planned_duration), 0) || 0;
    const pendingTasks = (tasksData || []).filter(t => t.status === 'pending').length;

    setStats({ completedPomodoros, focusMinutes, pendingTasks });

    const schedule = scheduleData && scheduleData.length > 0 ? scheduleData[0] : null;
    if (schedule) {
      setTodaySchedule(schedule);
      setGeneratedSchedule(schedule);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 3,
      estimated_pomodoros: 1,
      energy_level: 'medium',
      category_id: null,
      focus_tags: [],
      deadline: null,
    });
    setTagInput('');
    setEditingTaskId(null);
  };

  const openEditModal = (task: Task) => {
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      estimated_pomodoros: task.estimated_pomodoros,
      energy_level: task.energy_level,
      category_id: task.category_id,
      focus_tags: task.focus_tags || [],
      deadline: task.deadline,
    });
    setTagInput((task.focus_tags || []).join(', '));
    setEditingTaskId(task.id);
    setModalVisible(true);
  };

  const saveTask = async () => {
    const titleValidation = validateTaskTitle(newTask.title);
    const pomodoroValidation = validateEstimatedPomodoros(newTask.estimated_pomodoros);
    const deadlineValidation = validateDeadline(newTask.deadline);

    if (!titleValidation.valid) {
      Alert.alert('Validation Error', titleValidation.message);
      return;
    }
    if (!pomodoroValidation.valid) {
      Alert.alert('Validation Error', pomodoroValidation.message);
      return;
    }
    if (!deadlineValidation.valid) {
      Alert.alert('Validation Error', deadlineValidation.message);
      return;
    }

    const focusTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);

    if (editingTaskId) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          estimated_pomodoros: newTask.estimated_pomodoros,
          energy_level: newTask.energy_level,
          category_id: newTask.category_id,
          focus_tags: focusTags,
          deadline: newTask.deadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTaskId);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setModalVisible(false);
        resetTaskForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('tasks').insert({
        user_id: user?.id,
        ...newTask,
        focus_tags: focusTags,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setModalVisible(false);
        resetTaskForm();
        fetchData();
      }
    }
  };

  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryColor(colors.secondary);
    setEditingCategoryId(null);
  };

  const saveCategory = async () => {
    const validation = validateCategoryName(newCategoryName);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.message);
      return;
    }

    if (editingCategoryId) {
      const { error } = await supabase
        .from('categories')
        .update({ name: newCategoryName, color: newCategoryColor })
        .eq('id', editingCategoryId)
        .eq('user_id', user?.id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        resetCategoryForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('categories').insert({
        user_id: user?.id,
        name: newCategoryName,
        color: newCategoryColor,
        sort_order: categories.length,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        resetCategoryForm();
        fetchData();
      }
    }
  };

  const editCategory = (category: Category) => {
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setEditingCategoryId(category.id);
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      Alert.alert('Delete Failed', error.message);
    } else {
      fetchData();
    }
  };

  const openDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalVisible(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskToDelete.id)
      .eq('user_id', user?.id);

    if (error) {
      Alert.alert('Delete Failed', error.message);
    } else {
      setDeleteModalVisible(false);
      setTaskToDelete(null);
      fetchData();
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user || !preferences) return;

    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'scheduled');
    if (pendingTasks.length === 0) {
      Alert.alert('No Tasks', 'Create some tasks first to generate a schedule.');
      return;
    }

    setScheduleLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { schedule, error } = await generateSchedule(
      pendingTasks,
      preferences as UserPreferences,
      today
    );

    setScheduleLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else if (schedule) {
      setGeneratedSchedule(schedule);
    }
  };

  const handleAcceptSchedule = async () => {
    if (!user || !generatedSchedule) return;

    const { error } = await saveSchedule(
      user.id,
      generatedSchedule.date,
      generatedSchedule.schedule,
      generatedSchedule.algorithm_version
    );

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTodaySchedule(generatedSchedule);
      Alert.alert('Success', 'Schedule saved!');
    }
  };

  const filteredTasks = filteredCategory
    ? tasks.filter(t => t.category_id === filteredCategory)
    : tasks;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return colors.tertiaryFixedDim;
      case 2: return colors.tertiaryFixed;
      case 3: return Colors.warning;
      case 4: return '#F59E0B';
      case 5: return Colors.error;
      default: return Colors.warning;
    }
  };

  const categoryColors = [colors.secondary, colors.primary, '#A855F7', Colors.warning, Colors.error, '#EC4899', '#06B6D4'];
  const router = useRouter();

  const topPendingTask = tasks.find(t => t.status === 'pending' || t.status === 'in_progress');

  if (loading && !refreshing) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar style={colors.isDark ? "light" : "dark"} />
      <LinearGradient
        colors={colors.isDark ? [colors.gradientStart, colors.gradientEnd] : [colors.background, colors.background]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="headlineSmall" style={styles.headerTitle}>FocusFlow</ThemedText>
            <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => { resetTaskForm(); setModalVisible(true); }}>
            <Text style={{ fontSize: 24 }}>➕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.onSurface} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Quick Stats */}
              <View style={styles.statsRow}>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={colors.primary}>
                  <View style={[styles.statIcon, { backgroundColor: `${colors.primary}25` }]}>
                    <Text style={{ fontSize: 20 }}>✅</Text>
                  </View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{stats.completedPomodoros}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Done</ThemedText>
                </GlassCard>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={colors.secondary}>
                  <View style={[styles.statIcon, { backgroundColor: `${colors.secondary}25` }]}>
                    <Text style={{ fontSize: 20 }}>⏱️</Text>
                  </View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{stats.focusMinutes}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Minutes</ThemedText>
                </GlassCard>
                <GlassCard style={[styles.statCard, { flex: 1 }]} gradient glow glowColor={colors.tertiary}>
                  <View style={[styles.statIcon, { backgroundColor: `${colors.tertiary}25` }]}>
                    <Text style={{ fontSize: 20 }}>⚡</Text>
                  </View>
                  <ThemedText variant="displaySmall" color={colors.onSurface}>{stats.pendingTasks}</ThemedText>
                  <ThemedText variant="bodySmall" color={colors.onSurfaceVariant}>Pending</ThemedText>
                </GlassCard>
              </View>

              {/* Quick Focus */}
              {topPendingTask && (
                <TouchableOpacity
                  style={styles.quickFocusCard}
                  onPress={() => router.push('/(tabs)/timer')}
                >
                  <LinearGradient
                    colors={[colors.primary, Colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickFocusGradient}
                  >
                    <View style={styles.quickFocusLeft}>
                      <Text style={{ fontSize: 24 }}>🎯</Text>
                      <View>
                        <ThemedText variant="labelMedium" color={colors.primaryFixedDim}>Top Priority</ThemedText>
                        <ThemedText variant="titleMedium" color={colors.onPrimary} numberOfLines={1}>
                          {topPendingTask.title}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.quickFocusRight}>
                      <ThemedText variant="labelLarge" color={colors.onPrimary}>Start Focus →</ThemedText>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Schedule Section */}
              <View style={styles.scheduleSection}>
                <View style={styles.scheduleHeader}>
                  <ThemedText variant="titleMedium" color={colors.onSurface}>Today{'\''}s Schedule</ThemedText>
                  {todaySchedule?.accepted && (
                    <View style={styles.acceptedBadge}>
                      <Text style={{ fontSize: 12 }}>✓</Text>
                      <ThemedText variant="labelSmall" color={Colors.success}>Accepted</ThemedText>
                    </View>
                  )}
                </View>

                {generatedSchedule && generatedSchedule.schedule.length > 0 ? (
                  <>
                    <GlassCard style={styles.scheduleCard} gradient>
                      {generatedSchedule.schedule.map((entry, index) => {
                        const task = tasks.find(t => t.id === entry.task_id);
                        const startTime = new Date(entry.start_time);
                        return (
                          <View key={index} style={styles.scheduleEntry}>
                            <View style={styles.scheduleTime}>
                              <ThemedText variant="labelMedium" color={colors.primary}>
                                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </ThemedText>
                              <ThemedText variant="labelSmall" color={colors.onSurfaceVariant}>
                                {entry.duration} min
                              </ThemedText>
                            </View>
                            <View style={styles.scheduleDivider} />
                            <View style={styles.scheduleTask}>
                              <ThemedText variant="bodyMedium" color={colors.onSurface} numberOfLines={1}>
                                {task?.title || 'Unknown Task'}
                              </ThemedText>
                              {task?.category && (
                                <View style={[styles.scheduleCategory, { backgroundColor: task.category.color + '25' }]}>
                                  <ThemedText variant="labelSmall" color={task.category.color}>
                                    {task.category.name}
                                  </ThemedText>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </GlassCard>

                    {!todaySchedule?.accepted && (
                      <View style={styles.scheduleActions}>
                        <TouchableOpacity style={[styles.rejectButton, { backgroundColor: colors.surfaceContainer }]} onPress={() => setGeneratedSchedule(null)}>
                          <ThemedText variant="titleSmall" color={colors.onSurfaceVariant}>Dismiss</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptSchedule}>
                          <ThemedText variant="titleSmall" color={colors.onPrimary}>Accept</ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={handleGenerateSchedule}
                    disabled={scheduleLoading}
                  >
                    <LinearGradient
                      colors={[colors.primary, Colors.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.generateButtonGradient}
                    >
                      {scheduleLoading ? (
                        <ThemedText variant="bodyMedium" color={colors.onPrimary}>Generating...</ThemedText>
                      ) : (
                        <>
                          <Text style={{ fontSize: 20 }}>✨</Text>
                          <ThemedText variant="bodyMedium" color={colors.onPrimary}>Generate Schedule</ThemedText>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <TouchableOpacity
                  style={[styles.categoryChip, !filteredCategory && styles.categoryChipActive, { backgroundColor: colors.surfaceContainer }]}
                  onPress={() => setFilteredCategory(null)}
                >
                  <ThemedText variant="labelMedium" color={colors.onSurface}>
                    All
                  </ThemedText>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.surfaceContainer },
                      filteredCategory === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color },
                    ]}
                    onPress={() => setFilteredCategory(cat.id === filteredCategory ? null : cat.id)}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <ThemedText
                      variant="labelMedium"
                      color={colors.onSurface}
                    >
                      {cat.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.categoryChip, styles.addCategoryChip, { backgroundColor: colors.surfaceContainer }]}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={{ fontSize: 14 }}>➕</Text>
                  <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>New</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={{ fontSize: 48 }}>🎯</Text>
              </View>
              <ThemedText variant="titleLarge" color={colors.onSurface}>All caught up!</ThemedText>
              <ThemedText variant="bodyLarge" color={colors.onSurfaceVariant} style={{ textAlign: 'center', marginBottom: Spacing.md }}>
                You have no pending tasks. Create one to get started.
              </ThemedText>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => { resetTaskForm(); setModalVisible(true); }}
              >
                <LinearGradient
                  colors={[colors.primary, Colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateButtonGradient}
                >
                  <Text style={{ fontSize: 16 }}>➕</Text>
                  <ThemedText variant="titleSmall" color={colors.onPrimary}>Create Your First Task</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.taskCard} gradient>
              <View style={styles.taskHeader}>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
                <ThemedText variant="titleMedium" style={[styles.taskTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.title}
                </ThemedText>
                <View style={styles.taskActions}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
                    <Text style={{ fontSize: 16 }}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openDeleteModal(item)} style={styles.actionButton}>
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {item.focus_tags && item.focus_tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.focus_tags.map((tag, idx) => (
                    <View key={idx} style={[styles.tagChip, { backgroundColor: `${colors.primary}20` }]}>
                      <ThemedText variant="labelSmall" color={colors.primary}>{tag}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {item.description && (
                <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} numberOfLines={2}>
                  {item.description}
                </ThemedText>
              )}

              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Text style={{ fontSize: 14 }}>⏱️</Text>
                  <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>
                    {item.completed_pomodoros}/{item.estimated_pomodoros}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                  <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>
                    {item.energy_level.charAt(0).toUpperCase() + item.energy_level.slice(1)}
                  </ThemedText>
                </View>
                {item.deadline && (
                  <View style={styles.metaItem}>
                    <Text style={{ fontSize: 14 }}>📅</Text>
                    <ThemedText variant="labelMedium" color={colors.onSurfaceVariant}>
                      {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </ThemedText>
                  </View>
                )}
                {item.category && (
                  <View style={[styles.categoryBadge, { backgroundColor: item.category.color + '25' }]}>
                    <ThemedText variant="labelSmall" color={item.category.color}>
                      {item.category.name}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min((item.completed_pomodoros / item.estimated_pomodoros) * 100, 100)}%`,
                        backgroundColor: item.category?.color || colors.primary,
                      }
                    ]}
                  />
                </View>
              </View>
            </GlassCard>
          )}
        />
      </LinearGradient>

      {/* Task Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => { setModalVisible(false); resetTaskForm(); }}>
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity={80} gradient>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText variant="headlineSmall" style={styles.modalTitle}>{editingTaskId ? 'Edit Task' : 'New Task'}</ThemedText>

              <ThemedText variant="labelLarge" style={styles.label}>Title *</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surfaceContainer }]}
                value={newTask.title}
                onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                placeholder="Task title"
                placeholderTextColor={colors.onSurfaceVariant}
              />

              <ThemedText variant="labelLarge" style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.onSurface, backgroundColor: colors.surfaceContainer }]}
                value={newTask.description}
                onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                placeholder="Add details..."
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
              />

              <ThemedText variant="labelLarge" style={styles.label}>Category</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: colors.surfaceContainer },
                      newTask.category_id === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color },
                      categoryOptionPressed === cat.id && { backgroundColor: Colors.primary },
                    ]}
                    onPress={() => setNewTask({ ...newTask, category_id: cat.id })}
                    onPressIn={() => setCategoryOptionPressed(cat.id)}
                    onPressOut={() => setCategoryOptionPressed(null)}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <ThemedText variant="labelMedium" color={colors.onSurface}>{cat.name}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ThemedText variant="labelLarge" style={styles.label}>Priority (1-5)</ThemedText>
              <View style={styles.priorityRow}>
                {[1, 2, 3, 4, 5].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      { backgroundColor: colors.surfaceContainer },
                      newTask.priority === p && { backgroundColor: colors.primary },
                      priorityPressed === p && { backgroundColor: Colors.primary },
                    ]}
                    onPress={() => setNewTask({ ...newTask, priority: p })}
                    onPressIn={() => setPriorityPressed(p)}
                    onPressOut={() => setPriorityPressed(null)}
                  >
                    <ThemedText
                      variant="titleMedium"
                      color={newTask.priority === p ? colors.onPrimary : colors.onSurfaceVariant}
                    >
                      {p}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText variant="labelLarge" style={styles.label}>Estimated Pomodoros</ThemedText>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[styles.counterButton, { backgroundColor: colors.surfaceContainer }, counterPressed === 'dec' && { backgroundColor: Colors.primary }]}
                  onPress={() => setNewTask({ ...newTask, estimated_pomodoros: Math.max(1, newTask.estimated_pomodoros - 1) })}
                  onPressIn={() => setCounterPressed('dec')}
                  onPressOut={() => setCounterPressed(null)}
                >
                  <Text style={{ fontSize: 24 }}>➖</Text>
                </TouchableOpacity>
                <ThemedText variant="displaySmall" color={colors.onSurface}>{newTask.estimated_pomodoros}</ThemedText>
                <TouchableOpacity
                  style={[styles.counterButton, { backgroundColor: colors.surfaceContainer }, counterPressed === 'inc' && { backgroundColor: Colors.primary }]}
                  onPress={() => setNewTask({ ...newTask, estimated_pomodoros: newTask.estimated_pomodoros + 1 })}
                  onPressIn={() => setCounterPressed('inc')}
                  onPressOut={() => setCounterPressed(null)}
                >
                  <Text style={{ fontSize: 24 }}>➕</Text>
                </TouchableOpacity>
              </View>

              <ThemedText variant="labelLarge" style={styles.label}>Energy Level</ThemedText>
              <View style={styles.energyRow}>
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.energyButton,
                      { backgroundColor: colors.surfaceContainer },
                      newTask.energy_level === level && { backgroundColor: colors.primary },
                      energyPressed === level && { backgroundColor: Colors.primary },
                    ]}
                    onPress={() => setNewTask({ ...newTask, energy_level: level })}
                    onPressIn={() => setEnergyPressed(level)}
                    onPressOut={() => setEnergyPressed(null)}
                  >
                    <ThemedText
                      variant="titleSmall"
                      color={newTask.energy_level === level ? colors.onPrimary : colors.onSurfaceVariant}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText variant="labelLarge" style={styles.label}>Focus Tags (comma separated)</ThemedText>
              <TextInput
                style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surfaceContainer }]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="deep work, urgent, review..."
                placeholderTextColor={colors.onSurfaceVariant}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surfaceContainer }]} onPress={() => { setModalVisible(false); resetTaskForm(); }}>
                  <ThemedText variant="titleSmall" color={colors.onSurfaceVariant}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.surfaceContainer }, taskSavePressed && { backgroundColor: Colors.primary }]}
                  onPress={saveTask}
                  onPressIn={() => setTaskSavePressed(true)}
                  onPressOut={() => setTaskSavePressed(false)}>
                  <ThemedText variant="titleSmall" color={colors.onPrimary}>{editingTaskId ? 'Update Task' : 'Save Task'}</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Category Manager Modal */}
      <Modal animationType="slide" transparent visible={categoryModalVisible} onRequestClose={() => { setCategoryModalVisible(false); resetCategoryForm(); }}>
        <View style={styles.modalOverlay}>
          <GlassCard style={[styles.modalContent, { maxHeight: '85%' }]} intensity={80} gradient>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText variant="headlineSmall" style={styles.modalTitle}>
                {editingCategoryId ? 'Edit Category' : 'Manage Categories'}
              </ThemedText>

              {/* Existing Categories List */}
              {categories.length > 0 && (
                <View style={styles.categoryListSection}>
                  <ThemedText variant="labelLarge" color={colors.onSurfaceVariant} style={styles.label}>Your Categories</ThemedText>
                  {categories.map((cat) => (
                    <View key={cat.id} style={[styles.categoryListItem, { backgroundColor: colors.surfaceContainerLow }]}>
                      <View style={styles.categoryListLeft}>
                        <View style={[styles.categoryListDot, { backgroundColor: cat.color }]} />
                        <ThemedText variant="bodyMedium" color={colors.onSurface}>{cat.name}</ThemedText>
                      </View>
                      <View style={styles.categoryListActions}>
                        <TouchableOpacity onPress={() => editCategory(cat)} style={styles.categoryActionBtn}>
                          <Text style={{ fontSize: 16 }}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteCategory(cat.id)} style={styles.categoryActionBtn}>
                          <Text style={{ fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Create / Edit Form */}
              <View style={styles.categoryFormSection}>
                <ThemedText variant="labelLarge" color={colors.onSurfaceVariant} style={styles.label}>
                  {editingCategoryId ? 'Edit Category' : 'New Category'}
                </ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surfaceContainer }]}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Category name"
                  placeholderTextColor={colors.onSurfaceVariant}
                />

                <ThemedText variant="labelLarge" color={colors.onSurfaceVariant} style={styles.label}>Color</ThemedText>
                <View style={styles.colorPicker}>
                  {categoryColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newCategoryColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surfaceContainer }]} onPress={() => { setCategoryModalVisible(false); resetCategoryForm(); }}>
                  <ThemedText variant="titleSmall" color={colors.onSurfaceVariant}>Close</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.surfaceContainer }, categorySavePressed && { backgroundColor: Colors.primary }]}
                  onPress={saveCategory}
                  onPressIn={() => setCategorySavePressed(true)}
                  onPressOut={() => setCategorySavePressed(false)}>
                  <ThemedText variant="titleSmall" color={colors.onPrimary}>
                    {editingCategoryId ? 'Update' : 'Create'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal animationType="fade" transparent visible={deleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.deleteModalOverlay}>
          <GlassCard style={styles.deleteModalContent} intensity={80} gradient glow glowColor={Colors.error}>
            <View style={styles.deleteModalIcon}>
              <Text style={{ fontSize: 48 }}>🗑️</Text>
            </View>
            <ThemedText variant="headlineSmall" color={colors.onSurface} style={styles.deleteModalTitle}>
              Delete Task
            </ThemedText>
            <ThemedText variant="bodyMedium" color={colors.onSurfaceVariant} style={styles.deleteModalMessage}>
              Are you sure you want to delete{' '}
              <ThemedText variant="bodyMedium" color={colors.onSurface} style={{ fontWeight: '700' }}>
                "{taskToDelete?.title}"
              </ThemedText>
              ?{'\n\n'}This action cannot be undone. Your session history will be preserved.
            </ThemedText>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalCancel, { backgroundColor: colors.surfaceContainer }]}
                onPress={() => { setDeleteModalVisible(false); setTaskToDelete(null); }}
              >
                <ThemedText variant="titleSmall" color={colors.onSurfaceVariant}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirm} onPress={confirmDeleteTask}>
                <LinearGradient
                  colors={[Colors.error, '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteModalConfirmGradient}
                >
                  <Text style={{ fontSize: 16 }}>🗑️</Text>
                  <ThemedText variant="titleSmall" color={colors.onPrimary}>Delete Task</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  headerTitle: {},
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: Shadows.glow,
  },
  listContent: {
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
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addCategoryChip: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: Shadows.glow,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  taskCard: {
    marginBottom: Spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskTitle: {
    flex: 1,
    color: Colors.onSurface,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressBarContainer: {
    marginTop: Spacing.md,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '85%',
    margin: 0,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    marginBottom: Spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: Spacing.xs,
  },
  categoryOptionPressed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  priorityButtonPressed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  energyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  energyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  energyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  energyButtonPressed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  counterButtonPressed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.onSurface,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  saveButtonPressed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scheduleSection: {
    marginBottom: Spacing.lg,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${Colors.success}20`,
  },
  scheduleCard: {
    padding: Spacing.md,
  },
  scheduleEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  scheduleTime: {
    width: 70,
    alignItems: 'flex-start',
  },
  scheduleDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: Spacing.md,
  },
  scheduleTask: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  scheduleCategory: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    boxShadow: Shadows.glow,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: Shadows.glow,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
  },
  quickFocusCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    boxShadow: Shadows.glow,
  },
  quickFocusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  quickFocusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  quickFocusRight: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: `${Colors.error}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  deleteModalTitle: {
    marginBottom: Spacing.sm,
  },
  deleteModalMessage: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  deleteModalConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteModalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
  },
  categoryListSection: {
    marginBottom: Spacing.lg,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  categoryListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryListDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryListActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryActionBtn: {
    padding: 4,
  },
  categoryFormSection: {
    marginTop: Spacing.md,
  },
});
