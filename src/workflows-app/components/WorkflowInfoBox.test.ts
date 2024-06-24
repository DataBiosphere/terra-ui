import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { WorkflowInfoBox, WorkflowInfoBoxProps } from './WorkflowInfoBox';

const mockWorkflowInfoBoxProps: WorkflowInfoBoxProps = {
  name: 'name',
  namespace: 'string',
  submissionId: 'string',
  workflowId: 'string',
  workspaceId: 'string',
  showLogModal: jest.fn(),
};

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));

describe('Workflow Info Box Rendering', () => {
  it('should render the titles of each section', async () => {
    await act(() => render(h(WorkflowInfoBox, mockWorkflowInfoBoxProps)));
    expect(screen.getByText('Workflow Timing:')).toBeInTheDocument();
    expect(screen.getByText('Workflow Status:')).toBeInTheDocument();
    expect(screen.getByText('Workflow Script:')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting?')).toBeInTheDocument();
  });
});
