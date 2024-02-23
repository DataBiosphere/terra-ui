import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { WorkflowCard, WorkflowMethodSet } from 'src/workflows-app/components/WorkflowCard';
import {
  methodDataWithNullPrivate,
  methodDataWithVersions,
  methodDataWithVersionsAndDetails,
} from 'src/workflows-app/utils/mock-data';

describe('Single workflow card', () => {
  it('should render a simple method with description and no children', () => {
    render(h(WorkflowCard, { method: methodDataWithVersions.methods[0] }));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Last run: (Never run)')).toBeInTheDocument();
    expect(screen.getByText('Source: Github')).toBeInTheDocument();
    expect(screen.getByText('Add description')).toBeInTheDocument();
  });

  it('should render a previously run method with no description', () => {
    const newData = _.set('last_run.previously_run', true, _.omit('description', methodDataWithVersions.methods[0]));
    render(h(WorkflowCard, { method: newData }));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Last run: Dec 8, 2022, 11:28 PM')).toBeInTheDocument();
    expect(screen.getByText('Source: Github')).toBeInTheDocument();
    expect(screen.getByText('No method description')).toBeInTheDocument();
  });

  it('should render a child button with custom text and onclick', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const renderButton = () => h(Clickable, { onClick }, ['Click me']);

    render(h(WorkflowCard, { method: methodDataWithVersions.methods[0] }, [renderButton()]));
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not render a lock icon for a public method', async () => {
    render(h(WorkflowCard, { method: methodDataWithVersions.methods[0] }));
    expect(document.querySelector("[data-icon='lock']")).not.toBeInTheDocument();
    expect(screen.queryByText('This is a private workflow')).not.toBeInTheDocument();
  });

  it('should not render a lock icon for isPrivate null method', async () => {
    render(h(WorkflowCard, { method: methodDataWithNullPrivate.methods[0] }));
    expect(document.querySelector("[data-icon='lock']")).not.toBeInTheDocument();
    expect(screen.queryByText('This is a private workflow')).not.toBeInTheDocument();
  });

  it('should handle a method with no isPrivate', async () => {
    render(h(WorkflowCard, { method: methodDataNoPrivate.methods[0] }));
    expect(document.querySelector("[data-icon='lock']")).not.toBeInTheDocument();
    expect(screen.queryByText('This is a private workflow')).not.toBeInTheDocument();
  });

  it('should render a lock icon for a private method', async () => {
    render(h(WorkflowCard, { method: methodDataWithVersionsAndDetails.methods[0] }));
    expect(document.querySelector("[data-icon='lock']"));
    expect(screen.getByText(/This is a private workflow/));
  });
});

describe('Workflow set card', () => {
  const methodSet: WorkflowMethodSet = {
    name: 'Method set',
    description: 'Description of the entire method set',
    methods: [1, 2, 3].map((i) => ({
      ...methodDataWithVersions.methods[0],
      method_id: `id${i}`,
      name: `Subworkflow${i} title`,
      description: `Description of subworkflow${i}`,
    })),
  };

  it('should render a set of methods', () => {
    render(h(WorkflowCard, { method: methodSet }));

    expect(screen.getByText('Method set')).toBeInTheDocument();
    expect(screen.getByText('Description of the entire method set')).toBeInTheDocument();

    expect(screen.getAllByText('Version 1.0')).toHaveLength(3);
    expect(screen.getAllByText('Last run: (Never run)')).toHaveLength(3);
    expect(screen.getAllByText('Source: Github')).toHaveLength(3);

    expect(screen.getByText('Subworkflow1 title')).toBeInTheDocument();
    expect(screen.getByText('Description of subworkflow1')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Subworkflow2 title')).toBeInTheDocument();
    expect(screen.getByText('Description of subworkflow2')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Subworkflow3 title')).toBeInTheDocument();
    expect(screen.getByText('Description of subworkflow3')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
  });
});
