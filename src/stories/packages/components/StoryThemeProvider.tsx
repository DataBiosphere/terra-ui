import { ThemeProvider } from '@terra-ui-packages/components';
import { PropsWithChildren } from 'react';
import { defaultBrand } from 'src/libs/brands';

const StoryThemeProvider = (props: PropsWithChildren) => {
  const { children } = props;
  return ThemeProvider({ theme: defaultBrand.theme, children });
};
export default StoryThemeProvider;
