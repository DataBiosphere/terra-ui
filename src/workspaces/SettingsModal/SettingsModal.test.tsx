import { DeepPartial } from '@terra-ui-packages/core-utils';
import { screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import SettingsModal, { suggestedPrefixes } from 'src/workspaces/SettingsModal/SettingsModal';
import { BucketLifecycleSetting } from 'src/workspaces/SettingsModal/utils';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxWorkspacesContract = AjaxContract['Workspaces'];

describe('SettingsModal', () => {
  describe('Bucket Lifecycle Settings', () => {
    const captureEvent = jest.fn();

    const getToggle = () => screen.getByRole('switch');
    const getPrefixInput = (user): SelectHelper =>
      new SelectHelper(
        screen.getByLabelText('Specify if all objects should be deleted, or objects with specific prefixes'),
        user
      );
    const getDays = () => screen.getByLabelText('Days after upload:');

    const fourDaysAllObjects = {
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 4,
              matchesPrefix: [], // TODO, I have a bug here on setting
            },
          },
        ],
      },
      settingType: 'GcpBucketLifecycle',
    };

    const zeroDaysTwoPrefixes = {
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 0,
              matchesPrefix: ['a/', 'b/'],
            },
          },
        ],
      },
      settingType: 'GcpBucketLifecycle',
    };

    const twoRules = {
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 1,
              matchesPrefix: [],
            },
          },
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 2,
              matchesPrefix: ['p/'],
            },
          },
        ],
      },
      settingType: 'GcpBucketLifecycle',
    };

    const noLifecycleRules: BucketLifecycleSetting = { settingType: 'GcpBucketLifecycle', config: { rules: [] } };

    const setup = (currentSetting: BucketLifecycleSetting[], updateSettingsMock: jest.Mock<any, any>) => {
      jest.resetAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => {});
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: { captureEvent },
            Workspaces: {
              workspaceV2: () =>
                ({
                  getSettings: jest.fn().mockResolvedValue(currentSetting),
                  updateSettings: updateSettingsMock,
                } as DeepPartial<AjaxWorkspacesContract>),
            },
          } as DeepPartial<AjaxContract> as AjaxContract)
      );
    };

    it('renders the option as disabled if no settings exist', async () => {
      // Arrange
      const user = userEvent.setup();
      setup([], jest.fn());

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      // Assert
      expect(getToggle()).toHaveAttribute('aria-checked', 'false');

      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual([]);
      expect(prefixInput.inputElement).toHaveAttribute('disabled');

      const daysInput = getDays();
      expect(daysInput).toHaveValue(null);
      expect(daysInput).toHaveAttribute('disabled');
    });

    it('renders the option as enabled if all objects are being deleted', async () => {
      // Arrange
      const user = userEvent.setup();
      setup([fourDaysAllObjects], jest.fn());

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      // Assert
      expect(getToggle()).toHaveAttribute('aria-checked', 'true');

      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual([suggestedPrefixes.allObjects]);
      expect(prefixInput.inputElement).not.toHaveAttribute('disabled');
      const allOptions = await prefixInput.getOptions();
      expect(allOptions).toEqual([suggestedPrefixes.submissions, suggestedPrefixes.submissionIntermediaries]);

      const daysInput = getDays();
      expect(daysInput).toHaveValue(4);
      expect(daysInput).not.toHaveAttribute('disabled');
    });

    it('renders the option as enabled if certain prefixes are being disabled', async () => {
      // Arrange
      const user = userEvent.setup();
      setup([zeroDaysTwoPrefixes], jest.fn());

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      // Assert
      expect(getToggle()).toHaveAttribute('aria-checked', 'true');

      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual(['a/', 'b/']);
      expect(prefixInput.inputElement).not.toHaveAttribute('disabled');
      const allOptions = await prefixInput.getOptions();
      expect(allOptions).toEqual(_.values(suggestedPrefixes));

      const daysInput = getDays();
      expect(daysInput).toHaveValue(0);
      expect(daysInput).not.toHaveAttribute('disabled');
    });

    it('uses the first GcpBucketLifecycle setting present', async () => {
      // Arrange
      const user = userEvent.setup();
      const enabledForAllObjects: BucketLifecycleSetting[] = [fourDaysAllObjects, zeroDaysTwoPrefixes];
      setup(enabledForAllObjects, jest.fn());

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      // Assert
      expect(getToggle()).toHaveAttribute('aria-checked', 'true');
      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual([suggestedPrefixes.allObjects]);
      expect(getDays()).toHaveValue(4);
    });

    it('uses the first set of rules present', async () => {
      // Arrange
      const user = userEvent.setup();
      setup([twoRules], jest.fn());

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      // Assert
      expect(getToggle()).toHaveAttribute('aria-checked', 'true');
      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual([suggestedPrefixes.allObjects]);
      expect(getDays()).toHaveValue(1);
    });

    it('persists disabling single lifecycle rule', async () => {
      // Arrange
      const user = userEvent.setup();
      const updateSettingsMock = jest.fn();
      setup([fourDaysAllObjects], updateSettingsMock);

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      const toggle = getToggle();
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      // Options get cleared
      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual([]);
      expect(getDays()).toHaveValue(null);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Assert
      expect(updateSettingsMock).toHaveBeenCalledWith([noLifecycleRules]);
    });

    it('removes first lifecycle rule if user disables it', async () => {
      // Arrange
      const user = userEvent.setup();
      const updateSettingsMock = jest.fn();
      setup([twoRules], updateSettingsMock);

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      const toggle = getToggle();
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      // Options get cleared
      const prefixInput = getPrefixInput(user);
      expect(prefixInput.getSelectedOptions()).toEqual([]);
      expect(getDays()).toHaveValue(null);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Assert
      expect(updateSettingsMock).toHaveBeenCalledWith([
        {
          config: {
            rules: [
              {
                action: {
                  actionType: 'Delete',
                },
                conditions: {
                  age: 2,
                  matchesPrefix: ['p/'],
                },
              },
            ],
          },
          settingType: 'GcpBucketLifecycle',
        },
      ]);
    });

    it('modifies only the first rule', async () => {
      // Arrange
      const user = userEvent.setup();
      const updateSettingsMock = jest.fn();
      setup([twoRules], updateSettingsMock);

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      const daysInput = getDays();
      await user.clear(daysInput);
      await user.type(daysInput, '7');
      expect(daysInput).toHaveValue(7);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Assert
      expect(updateSettingsMock).toHaveBeenCalledWith([
        {
          config: {
            rules: [
              {
                action: {
                  actionType: 'Delete',
                },
                conditions: {
                  age: 7,
                  matchesPrefix: [],
                },
              },
              {
                action: {
                  actionType: 'Delete',
                },
                conditions: {
                  age: 2,
                  matchesPrefix: ['p/'],
                },
              },
            ],
          },
          settingType: 'GcpBucketLifecycle',
        },
      ]);
    });

    it('persists deleting all objects', async () => {
      // Arrange
      const user = userEvent.setup();
      const updateSettingsMock = jest.fn();
      setup([zeroDaysTwoPrefixes], updateSettingsMock);

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      const prefixInput = getPrefixInput(user);
      await prefixInput.selectOption(suggestedPrefixes.allObjects);
      expect(prefixInput.getSelectedOptions()).toEqual([suggestedPrefixes.allObjects]);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Assert
      expect(updateSettingsMock).toHaveBeenCalledWith([
        {
          config: {
            rules: [
              {
                action: {
                  actionType: 'Delete',
                },
                conditions: {
                  age: 0,
                  matchesPrefix: [],
                },
              },
            ],
          },
          settingType: 'GcpBucketLifecycle',
        },
      ]);
    });

    it('persists changing prefixes and changing days', async () => {
      // Arrange
      const user = userEvent.setup();
      const updateSettingsMock = jest.fn();
      setup([fourDaysAllObjects], updateSettingsMock);

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      const prefixInput = getPrefixInput(user);
      await prefixInput.selectOption(suggestedPrefixes.submissions);
      await prefixInput.selectOption(suggestedPrefixes.submissionIntermediaries);
      expect(prefixInput.getSelectedOptions()).toEqual([
        suggestedPrefixes.submissions,
        suggestedPrefixes.submissionIntermediaries,
      ]);

      const daysInput = getDays();
      await user.clear(daysInput);
      await user.type(daysInput, '14');
      expect(daysInput).toHaveValue(14);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toHaveAttribute('aria-disabled', 'false');
      await user.click(saveButton);

      // Assert
      expect(updateSettingsMock).toHaveBeenCalledWith([
        {
          config: {
            rules: [
              {
                action: {
                  actionType: 'Delete',
                },
                conditions: {
                  age: 14,
                  matchesPrefix: [suggestedPrefixes.submissions, suggestedPrefixes.submissionIntermediaries],
                },
              },
            ],
          },
          settingType: 'GcpBucketLifecycle',
        },
      ]);
    });

    it('disables Save if there is no date value specified', async () => {
      // Arrange
      const user = userEvent.setup();
      setup([fourDaysAllObjects], jest.fn());

      // Act
      await act(async () => {
        render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
      });

      const daysInput = getDays();
      await user.clear(daysInput);
      expect(daysInput).toHaveValue(null);

      // Assert
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('has no accessibility errors', async () => {
      setup([twoRules], jest.fn());

      // Act and Assert
      await act(async () => {
        const { container } = render(<SettingsModal workspace={defaultGoogleWorkspace} onDismiss={jest.fn()} />);
        expect(await axe(container)).toHaveNoViolations();
      });
    });
  });
});
