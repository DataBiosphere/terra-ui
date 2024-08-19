import { expect } from '@storybook/test';
import { screen } from '@testing-library/react';
import React from 'react';
import { WorkflowModal } from 'src/pages/workflows/workflow/common/WorkflowModal';
import { renderWithAppContexts } from 'src/testing/test-utils';

describe('WorkflowModal', () => {
  it('renders a smoke test', () => {
    renderWithAppContexts(
      <WorkflowModal
        setCreateWorkflowModalOpen={jest.fn}
        title='Create New Workflow'
        namespace='test'
        name='modalTest'
        buttonAction='Upload'
        synopsis=''
        setWorkflowNamespace={jest.fn}
        setWorkflowName={jest.fn}
        setWorkflowSynopsis={jest.fn}
      />
    );

    expect(screen.getByText('Namespace'));
    expect(screen.getByText('Name'));
    expect(screen.getByText('Synopsis (optional, 80 characters max)'));
    expect(screen.getByText('Snapshot Comment (optional)'));

    const textInputs = screen.getAllByRole('textbox');
    expect(textInputs.length).toBe(4);

    const namespaceTextbox = textInputs[0];
    const nameTextbox = textInputs[1];

    expect(namespaceTextbox).toHaveDisplayValue('test');
    expect(nameTextbox).toHaveDisplayValue('modalTest');
  });
});
