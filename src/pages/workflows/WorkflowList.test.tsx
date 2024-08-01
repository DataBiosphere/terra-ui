import { act, screen } from '@testing-library/react';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { MethodDefinition } from 'src/pages/workflows/workflow-utils';
import { WorkflowList } from 'src/pages/workflows/WorkflowList';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));
jest.mock('src/libs/ajax/leonardo/providers/LeoDiskProvider');

// Space for tables is rendered based on the available space. In unit tests, there is no available space, and so we must mock out the space needed to get the data table to render.
jest.mock('react-virtualized', () => {
  const actual = jest.requireActual('react-virtualized');

  const { AutoSizer } = actual;

  class MockAutoSizer extends AutoSizer {
    state = {
      height: 1000,
      width: 1000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMethodsContract = AjaxContract['Methods'];

describe('workflows table', () => {
  const mockMethods = (methods: MethodDefinition[]): Partial<AjaxMethodsContract> => {
    return { definitions: jest.fn(() => Promise.resolve(methods)) };
  };

  const mockAjax = (methods: MethodDefinition[]): Partial<AjaxContract> => {
    return { Methods: mockMethods(methods) as AjaxMethodsContract };
  };

  it('renders the table tabs', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    // Assert
    expect(screen.getByText('My Workflows')).toBeInTheDocument();
    expect(screen.getByText('Public Workflows')).toBeInTheDocument();
  });
});
