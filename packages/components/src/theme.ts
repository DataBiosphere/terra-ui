import Color from 'color';
import { mapValues } from 'lodash/fp';
import { createContext, createElement, PropsWithChildren, useContext } from 'react';

type ColorPalette = {
  /** Used as accent on header, loading spinner, background of beta version tag and some buttons */
  primary: string;
  /** Used as footer background */
  secondary: string;
  /** Used as button backgrounds, headers, links */
  accent: string;
  success: string;
  warning: string;
  danger: string;
  /** Used as header background color, lightened for background of cells, panels, etc. */
  light: string;
  /** Used as text color, menu background (lightened), selected background (lightened) */
  dark: string;
  grey: string;
  disabled: string;
};

export type Theme = {
  /** Base color palette for theme. */
  colorPalette: ColorPalette;
};

type EnrichedTheme = Theme & {
  /** Color mixing functions. Each takes an "intensity" and returns a modified color. */
  colors: { [Color in keyof ColorPalette]: (intensity?: number) => string };
};

/** Add additional functionality (color mixing functions) to theme. */
const enrichTheme = (theme: Theme): EnrichedTheme => {
  const colors = mapValues((color: string) => {
    return (intensity = 1): string => {
      return Color(color)
        .mix(Color('white'), 1 - intensity)
        .hex();
    };
  }, theme.colorPalette) as EnrichedTheme['colors'];

  return {
    ...theme,
    colors,
  };
};

const EnrichedThemeContext = createContext<EnrichedTheme | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  theme: Theme;
}>;

/** Provides a theme to descendents via React Context. */
export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props;
  return createElement(EnrichedThemeContext.Provider, { value: enrichTheme(theme) }, children);
};

/** Gets the current theme from React context. */
export const useThemeFromContext = (): EnrichedTheme => {
  const theme = useContext(EnrichedThemeContext);
  if (!theme) {
    throw new Error('No theme provided. Components using useThemeFromContext must be descendants of ThemeProvider.');
  }
  return theme;
};
