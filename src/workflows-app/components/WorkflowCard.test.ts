import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { WorkflowCard } from 'src/workflows-app/components/WorkflowCard';
import { methodDataWithVersions } from 'src/workflows-app/utils/mock-data';

describe('Workflow card', () => {
  it('should render a simple method with description', () => {
    render(h(WorkflowCard, { method: methodDataWithVersions.methods[0], buttonText: 'foo', onClick: jest.fn() }));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Last run: (Never run)')).toBeInTheDocument();
    expect(screen.getByText('Source: Github')).toBeInTheDocument();
    expect(screen.getByText('Add description')).toBeInTheDocument();
  });

  it('should render a previously run method with no description', () => {
    const newData = _.set('last_run.previously_run', true, _.omit('description', methodDataWithVersions.methods[0]));
    render(h(WorkflowCard, { method: newData, buttonText: 'foo', onClick: jest.fn() }));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Last run: Dec 8, 2022, 11:28 PM')).toBeInTheDocument();
    expect(screen.getByText('Source: Github')).toBeInTheDocument();
    expect(screen.getByText('No method description')).toBeInTheDocument();
  });

  it('should render a button with custom text and onclick', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(h(WorkflowCard, { method: methodDataWithVersions.methods[0], buttonText: 'Click me', onClick }));
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
