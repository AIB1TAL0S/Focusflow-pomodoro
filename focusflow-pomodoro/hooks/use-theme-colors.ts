import { LightColors, DarkColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export function useThemeColors() {
  const { isDark } = useTheme();
  
  return useMemo(() => {
    return {
      ...(isDark ? DarkColors : LightColors),
      isDark,
    };
  }, [isDark]);
}