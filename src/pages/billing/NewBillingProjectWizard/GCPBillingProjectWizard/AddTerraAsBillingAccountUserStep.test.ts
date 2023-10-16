import { fireEvent, render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import * as Preferences from 'src/libs/prefs';
import {
  AddTerraAsBillingAccountUserStep,
  AddTerraAsBillingAccountUserStepProps,
} from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/AddTerraAsBillingAccountUserStep';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.spyOn(Preferences, 'getLocalPref');

type AjaxContract = ReturnType<typeof Ajax>;

function expectNotNull<T>(value: T | null): T {
  expect(value).not.toBeNull();
  return value as T;
}

const textMatcher = (text) =>
  screen.queryByText((_, node) => {
    const hasText = (node) => node.textContent === text;
    const nodeHasText = hasText(node);
    const childrenDontHaveText = Array.from(node?.children || []).every((child) => !hasText(child));
    return nodeHasText && childrenDontHaveText;
  });

const getNoAccessButton = () => expectNotNull(screen.queryByLabelText("I don't have access to do this"));
const getUserAddedButton = () =>
  expectNotNull(
    screen.queryByLabelText('I have added terra-billing as a billing account user (requires reauthentication)')
  );

const createGCPProject = jest.fn(() => Promise.resolve());
const captureEvent = jest.fn();
describe('AddTerraAsBillingAccountUserStep', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: { createGCPProject } as Partial<AjaxContract['Billing']>,
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  describe('The initial state when the step is active', () => {
    beforeEach(() => {
      render(
        h(AddTerraAsBillingAccountUserStep, {
          isActive: true,
          setAccessToAddBillingAccountUser: jest.fn,
          isFinished: false,
        })
      );
    });

    it('has both radio button options shown, with neither selected ', () => {
      const noAccessButton = screen.queryByLabelText("I don't have access to do this");
      expect(noAccessButton).toBeDefined();
      expect(noAccessButton).not.toBeChecked();
      expect(noAccessButton).not.toBeDisabled();
      const terraUserAddedButton = screen.queryByLabelText(
        'I have added terra-billing as a billing account user (requires reauthentication)'
      );
      expect(terraUserAddedButton).toBeDefined();
      expect(terraUserAddedButton).not.toBeChecked();
      expect(terraUserAddedButton).not.toBeDisabled();
    });

    it('shows the correct instructions to the user', () => {
      const instructions = textMatcher(
        'Add terra-billing@terra.bio as a Billing Account User to your billing account.'
      );
      expect(instructions).not.toBeNull();
    });
  });

  describe('the behavior of the buttons', () => {
    const defaultProps = {
      isActive: true,
      setAccessToAddBillingAccountUser: jest.fn(),
      isFinished: false,
    };

    const renderStep = (overrides: Partial<AddTerraAsBillingAccountUserStepProps>) =>
      render(
        h(AddTerraAsBillingAccountUserStep, {
          ...defaultProps,
          ...overrides,
        })
      );

    beforeEach(() => {});

    it('is a radio button', () => {
      renderStep({});
      const userAddedButton = getUserAddedButton();
      expect(userAddedButton).toHaveAttribute('type', 'radio');
      const noAccessButton = getNoAccessButton();
      expect(noAccessButton).toHaveAttribute('type', 'radio');
    });

    it('is disabled before we get to the step', () => {
      renderStep({ isActive: false });
      const userAddedButton = getUserAddedButton();
      expect(userAddedButton).toBeDisabled();
      const noAccessButton = getNoAccessButton();
      expect(noAccessButton).toBeDisabled();
    });

    it('is enabled when the step is active', () => {
      renderStep({});
      const userAddedButton = getUserAddedButton();
      expect(userAddedButton).not.toBeDisabled();
      const noAccessButton = getNoAccessButton();
      expect(noAccessButton).not.toBeDisabled();
    });

    it('is enabled when the step is inactive but complete', () => {
      renderStep({ isActive: false, isFinished: true });
      const userAddedButton = getUserAddedButton();
      expect(userAddedButton).not.toBeDisabled();
      const noAccessButton = getNoAccessButton();
      expect(noAccessButton).not.toBeDisabled();
    });

    it('calls the prop function to setAccessToAddBillingAccountUser when the no access button is selected', () => {
      renderStep({});
      const noAccessButton = getNoAccessButton();
      fireEvent.click(noAccessButton);
      expect(defaultProps.setAccessToAddBillingAccountUser).toHaveBeenCalledWith(false);
    });

    it('calls the prop function to setAccessToAddBillingAccountUser when the user added button is selected', () => {
      renderStep({});
      const userAddedButton = getUserAddedButton();
      fireEvent.click(userAddedButton);
      expect(defaultProps.setAccessToAddBillingAccountUser).toHaveBeenCalledWith(true);
    });
  });
});
