import { ThemeProvider } from '@terra-ui-packages/components';
import { PropsWithChildren } from 'react';
import React from 'react';
import { defaultBrand } from 'src/libs/brands';

const StoryThemeProvider = (props: PropsWithChildren) => {
  return <ThemeProvider theme={defaultBrand.theme}>{props.children}</ThemeProvider>;
};
export default StoryThemeProvider;
