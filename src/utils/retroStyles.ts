import { ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../constants/theme';

/**
 * Retro Style Utilities
 *
 * Helper functions to apply groovy 70s retro styling to components
 * when the retro theme is active.
 */

interface RetroCardStyleOptions {
  theme: Theme;
  isRetro: boolean;
  variant?: 'default' | 'chunky' | 'subtle';
}

interface RetroButtonStyleOptions {
  theme: Theme;
  isRetro: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface RetroTextStyleOptions {
  isRetro: boolean;
  variant?: 'heading' | 'title' | 'body' | 'label';
}

/**
 * Get retro card styles with thick borders, rounded corners, and colored shadows
 */
export const getRetroCardStyle = ({
  theme,
  isRetro,
  variant = 'default',
}: RetroCardStyleOptions): ViewStyle => {
  if (!isRetro) {
    return {
      borderRadius: 12,
      elevation: 2,
    };
  }

  const baseRetroStyle: ViewStyle = {
    borderRadius: 24,
    ...theme.elevation.level2,
  };

  switch (variant) {
    case 'chunky':
      return {
        ...baseRetroStyle,
        borderWidth: 5,
        borderColor: theme.colors.border,
        borderRadius: 28,
      };
    case 'subtle':
      return {
        ...baseRetroStyle,
        borderWidth: 2,
        borderColor: theme.colors.divider,
        borderRadius: 20,
      };
    default:
      return {
        ...baseRetroStyle,
        borderWidth: 4,
        borderColor: theme.colors.border,
      };
  }
};

/**
 * Get retro button styles with bold borders and pill shapes
 */
export const getRetroButtonStyle = ({
  theme,
  isRetro,
  variant = 'primary',
}: RetroButtonStyleOptions): ViewStyle => {
  if (!isRetro) {
    return {};
  }

  const baseRetroStyle: ViewStyle = {
    borderRadius: 28,
    borderWidth: 3,
  };

  switch (variant) {
    case 'danger':
      return {
        ...baseRetroStyle,
        borderColor: '#B82E2E',
      };
    case 'secondary':
      return {
        ...baseRetroStyle,
        borderColor: theme.colors.secondary,
      };
    default:
      return {
        ...baseRetroStyle,
        borderColor: theme.colors.primaryDark,
      };
  }
};

/**
 * Get retro text styles with bold weights and tighter letter spacing
 */
export const getRetroTextStyle = ({
  isRetro,
  variant = 'body',
}: RetroTextStyleOptions): TextStyle => {
  if (!isRetro) {
    return {};
  }

  switch (variant) {
    case 'heading':
      return {
        fontWeight: '800',
        letterSpacing: 0.5,
      };
    case 'title':
      return {
        fontWeight: '700',
        letterSpacing: 0.3,
      };
    case 'label':
      return {
        fontWeight: '600',
        letterSpacing: 0.2,
      };
    default:
      return {
        fontWeight: '500',
      };
  }
};

/**
 * Get retro container/surface styles
 */
export const getRetroContainerStyle = ({
  theme,
  isRetro,
}: {
  theme: Theme;
  isRetro: boolean;
}): ViewStyle => {
  if (!isRetro) {
    return {
      borderRadius: 12,
      padding: 4,
    };
  }

  return {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.border,
    padding: 6,
  };
};

/**
 * Get retro input/field styles
 */
export const getRetroInputStyle = ({
  theme,
  isRetro,
}: {
  theme: Theme;
  isRetro: boolean;
}): ViewStyle => {
  if (!isRetro) {
    return {
      borderRadius: 8,
    };
  }

  return {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  };
};
