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
  colorPalette: ColorPalette;
};

const defaultTheme: Theme = {
  colorPalette: {
    primary: '#74ae43',
    secondary: '#6d6e70',
    accent: '#4d72aa',
    success: '#74ae43',
    warning: '#f7981c',
    danger: '#db3214',
    light: '#e9ecef',
    dark: '#333f52',
    grey: '#808080',
    disabled: '#b6b7b8',
  },
};

type EnrichedTheme = Theme & {
  colors: { [Color in keyof ColorPalette]: (intensity?: number) => string };
};

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

const EnrichedThemeContext = createContext(enrichTheme(defaultTheme));

type ThemeProviderProps = PropsWithChildren<{
  theme: Theme;
}>;

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props;
  return createElement(EnrichedThemeContext.Provider, { value: enrichTheme(theme) }, children);
};

export const useTheme = (): EnrichedTheme => useContext(EnrichedThemeContext);
