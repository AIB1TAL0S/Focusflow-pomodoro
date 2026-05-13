import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const colors = useThemeColors();

  // Redirect to login when user signs out.
  useEffect(() => {
    if (!loading && !user) {
      // Use setTimeout to avoid navigation during render
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Don't render tabs while unauthenticated or loading
  if (loading || !user) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.outline,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLow,
          borderTopWidth: 0,
          elevation: 0,
          boxShadow: Shadows.ambient,
          paddingTop: Spacing.sm,
          paddingBottom: Spacing.md,
          height: 80,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>⏱️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}