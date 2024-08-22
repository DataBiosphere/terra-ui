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
        namespace=''
        name=''
        buttonAction='Upload'
        synopsis=''
        setWorkflowNamespace={jest.fn}
        setWorkflowName={jest.fn}
        setWorkflowSynopsis={jest.fn}
      />
    );

    expect(screen.getByText(/Namespace/));
    expect(screen.getByText(/name \*/i));
    expect(screen.getByText('Synopsis (80 characters max)'));
    expect(screen.getByText('Snapshot Comment'));
  });

  it('populates name and namespace when passed in', () => {
    renderWithAppContexts(
      <WorkflowModal
        setCreateWorkflowModalOpen={jest.fn}
        title='Create New Workflow'
        namespace='namespace'
        name='name'
        buttonAction='Upload'
        synopsis=''
        setWorkflowNamespace={jest.fn}
        setWorkflowName={jest.fn}
        setWorkflowSynopsis={jest.fn}
      />
    );

    const textInputs = screen.getAllByRole('textbox');
    expect(textInputs.length).toBe(4);

    const namespaceTextbox = textInputs[0];
    const nameTextbox = textInputs[1];

    expect(namespaceTextbox).toHaveDisplayValue('namespace');
    expect(nameTextbox).toHaveDisplayValue('name');
  });

  it('upload button is disabled when invalid characters are in namespace and name input', () => {
    renderWithAppContexts(
      <WorkflowModal
        setCreateWorkflowModalOpen={jest.fn}
        title='Create New Workflow'
        namespace=','
        name=','
        buttonAction='Upload'
        synopsis=''
        setWorkflowNamespace={jest.fn}
        setWorkflowName={jest.fn}
        setWorkflowSynopsis={jest.fn}
      />
    );

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    expect(uploadButton).toHaveAttribute('aria-disabled', 'true');
  });
});
