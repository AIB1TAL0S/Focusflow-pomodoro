import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * Sign Out Screen
 *
 * A dedicated route that handles sign-out outside the tab layout.
 * Registered as a top-level Stack screen so navigation works reliably
 * from any route group.
 */
export default function SignOutScreen() {
  const { signOut } = useAuth();
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;

    const doSignOut = async () => {
      try {
        await signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      } finally {
        if (!cancelled) {
          router.replace('/(auth)/login');
        }
      }
    };

    doSignOut();

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});