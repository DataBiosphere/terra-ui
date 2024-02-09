import type { Preview } from '@storybook/react';
import React from 'react';
import 'src/style.css';

import StoryThemeProvider from './StoryThemeProvider';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryThemeProvider>
        <Story />
      </StoryThemeProvider>
    ),
  ],
};

export default preview;
