import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Task, Category } from '@/types/database';
import {
  getTasks,
  getActiveTasks,
  createTask,
  updateTask,
  deleteTask,
  getCategories,
  NewTaskInput,
} from '@/lib/api';

interface UseTasksResult {
  tasks: Task[];
  activeTasks: Task[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  filteredCategory: string | null;
  setFilteredCategory: (id: string | null) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  create: (input: NewTaskInput) => Promise<{ error: string | null }>;
  update: (id: string, updates: Partial<Task>) => Promise<{ error: string | null }>;
  remove: (id: string) => Promise<{ error: string | null }>;
  refetch: () => Promise<void>;
}

export function useTasks(userId: string | null): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const [tasksResult, activeResult, catsResult] = await Promise.all([
      getTasks(userId),
      getActiveTasks(userId),
      getCategories(userId),
    ]);

    if (tasksResult.error) setError(tasksResult.error.message);
    setTasks(tasksResult.data || []);
    setActiveTasks(activeResult.data || []);
    setCategories(catsResult.data || []);

    // Keep selectedTask in sync — clear it if the task was completed
    setSelectedTask((prev) => {
      if (!prev) return prev;
      return (activeResult.data || []).find((t) => t.id === prev.id) || null;
    });

    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const create = useCallback(
    async (input: NewTaskInput): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Not authenticated' };
      const { error } = await createTask(userId, input);
      if (!error) await fetchAll();
      return { error: error?.message || null };
    },
    [userId, fetchAll]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Task>): Promise<{ error: string | null }> => {
      const { error } = await updateTask(id, updates);
      if (!error) await fetchAll();
      return { error: error?.message || null };
    },
    [fetchAll]
  );

  const remove = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Not authenticated' };
      const { error } = await deleteTask(id, userId);
      if (!error) await fetchAll();
      return { error: error?.message || null };
    },
    [userId, fetchAll]
  );

  return {
    tasks,
    activeTasks,
    categories,
    loading,
    error,
    filteredCategory,
    setFilteredCategory,
    selectedTask,
    setSelectedTask,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
}
