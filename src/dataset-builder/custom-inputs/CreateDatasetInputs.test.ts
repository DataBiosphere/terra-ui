import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { StringInput } from './CreateDatasetInputs';

type MarkdownExports = typeof import('src/components/markdown');
jest.mock('src/components/markdown', (): Partial<MarkdownExports> => {
  const { createElement } = jest.requireActual('react');
  return {
    MarkdownEditor: jest.fn().mockImplementation(() => createElement('div')),
  };
});

// These components are needed to test inputs, because they are designed with their value being managed in a parent component's state
const InputWithState = ({ initialValue, input, props }) => {
  const [value, setValue] = useState(initialValue);

  return h(input, {
    ...props,
    value,
    onChange: (value) => setValue(value),
  });
};

describe('CreateDatasetInputs', () => {
  it('Renders a StringInput with the title and value', async () => {
    const user = userEvent.setup();
    const currentValue = 'Hello, ';
    const addedValue = 'World';
    render(
      h(InputWithState, {
        initialValue: currentValue,
        props: {
          title: 'Title',
          placeholder: '',
        },
        input: StringInput,
      })
    );
    const input = screen.getByLabelText('Title');
    expect(screen.getByText('Title')).toBeTruthy();
    expect(input.closest('input')?.value).toBe(currentValue.toString());
    await user.type(input, addedValue);
    expect(input.closest('input')?.value).toBe(currentValue + addedValue);
  });
});
