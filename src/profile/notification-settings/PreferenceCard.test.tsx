import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { NotificationCard, NotificationCardProps, UserAttributesCard, UserAttributesCardProps } from './PreferenceCard';

describe('NotificationCard', () => {
  it('renders each of the preferences with their respective labels', async () => {
    // Arrange
    const props: NotificationCardProps = {
      label: 'general name',
      setSaving: jest.fn(),
      prefsData: { key1: 'false', key2: 'true' },
      options: [
        { notificationKeys: ['key1'], notificationType: 'WorkspaceSubmission', optionLabel: 'submission event' },
        { notificationKeys: ['key2'], notificationType: 'WorkspaceChanged', optionLabel: 'workspace changed' },
      ],
    };

    // Act
    await render(<NotificationCard {...props} />);

    // Assert
    screen.getByText('general name');
    const submissionCheckbox = screen.getByLabelText('submission event');
    expect(submissionCheckbox).not.toBeChecked();

    const workspaceChangedCheckbox = screen.getByLabelText('workspace changed');
    expect(workspaceChangedCheckbox).toBeChecked();
  });

  it('has no accessibility issues', async () => {
    // Arrange
    document.body.innerHTML = '';
    const listRoot = document.createElement('div');
    listRoot.setAttribute('role', 'list');

    const props: NotificationCardProps = {
      label: 'general name',
      setSaving: jest.fn(),
      prefsData: { key1: 'false', key2: 'true' },
      options: [
        { notificationKeys: ['key1'], notificationType: 'WorkspaceSubmission', optionLabel: 'submission event' },
        { notificationKeys: ['key2'], notificationType: 'WorkspaceChanged', optionLabel: 'workspace changed' },
      ],
    };

    // Act
    const result = await render(<NotificationCard {...props} />, { container: document.body.appendChild(listRoot) });

    // Assert
    expect(await axe(result.container)).toHaveNoViolations();
  });
});

describe('UserAttributeCard', () => {
  const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');
  const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

  it('renders the card with an enabled checkbox', async () => {
    // Arrange
    const props: UserAttributesCardProps = {
      label: 'test label',
      setSaving: jest.fn(),
      notificationKeys: ['key'],
      notificationType: 'Marketing',
      value: true,
      disabled: false,
    };

    // Act
    await render(<UserAttributesCard {...props} />);

    // Assert
    screen.getByText('test label');
    const checkbox = screen.getByLabelText('test label');
    expect(checkbox).toBeChecked();
    verifyEnabled(checkbox);
  });

  it('renders the card with a disabled checkbox', async () => {
    // Arrange
    const props: UserAttributesCardProps = {
      label: 'test label',
      setSaving: jest.fn(),
      notificationKeys: ['key'],
      notificationType: 'Marketing',
      value: false,
      disabled: true,
    };

    // Act
    await render(<UserAttributesCard {...props} />);

    // Assert
    screen.getByText('test label');
    const checkbox = screen.getByLabelText('test label');
    expect(checkbox).not.toBeChecked();
    verifyDisabled(checkbox);
  });

  it('has no accessibility issues', async () => {
    // Arrange
    document.body.innerHTML = '';
    const listRoot = document.createElement('div');
    listRoot.setAttribute('role', 'list');

    const props: UserAttributesCardProps = {
      label: 'test label',
      setSaving: jest.fn(),
      notificationKeys: ['key'],
      notificationType: 'Marketing',
      value: true,
      disabled: false,
    };

    // Act
    const result = await render(<UserAttributesCard {...props} />, { container: document.body.appendChild(listRoot) });

    // Assert
    expect(await axe(result.container)).toHaveNoViolations();
  });
});
