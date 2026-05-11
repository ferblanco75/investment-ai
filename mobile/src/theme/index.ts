import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors } from './colors';

export { colors };

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.textInverse,
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    secondary: colors.accent,
    background: colors.dark.background,
    surface: colors.dark.surface,
    error: colors.error,
    onPrimary: colors.textInverse,
    onBackground: colors.dark.textPrimary,
    onSurface: colors.dark.textPrimary,
  },
};
