import '@testing-library/jest-dom'

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import * as Preferences from 'src/libs/prefs'
import CreateNewBillingProjectWizard, { styles } from 'src/pages/billing/CreateNewBillingProjectWizard'


jest.mock('src/libs/ajax')

const getStep1Button = () => screen.getByText('Go to Google Cloud Console')
const getStep2DontHaveBillingAccountButton = () => screen.getByText('I don\'t have access to a Cloud billing account')
const getStep2HaveBillingAccountButton = () => screen.getByText('I have a billing account')
const getStep3DontHaveAccessButton = () => screen.queryByLabelText('I don\'t have access to do this')
const getStep3HaveAddedButton = () => screen.queryByLabelText('I have added terra-billing as a billing account user (requires reauthentication)')
const getStep3CheckBox = () => screen.queryByRole('checkbox')
const textMatcher = text => screen.queryByText((_, node) => {
  const hasText = node => node.textContent === text
  const nodeHasText = hasText(node)
  const childrenDontHaveText = Array.from(node.children).every(
    child => !hasText(child)
  )
  return nodeHasText && childrenDontHaveText
})
const getStep4CreateButton = () => screen.queryByText('Create Terra Billing Project')
const getBillingProjectInput = () => screen.getByLabelText('Terra billing project *')
const getBillingAccountInput = () => screen.getByLabelText('Select billing account *')

const verifyDisabled = item => expect(item).toHaveAttribute('disabled')
const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')
const verifyChecked = item => expect(item).toBeChecked()
const verifyUnchecked = item => expect(item).not.toBeChecked()

const allSteps = index => screen.getAllByRole('listitem')[index]

const testStep2DontHaveAccessToBillingChecked = () => {
  verifyChecked(screen.getByRole('radio', { name: 'I don\'t have access to a Cloud billing account' }))
  verifyUnchecked(getStep2HaveBillingAccountButton())
}

const testStep2HaveBillingChecked = () => {
  verifyChecked(screen.getByRole('radio', { name: 'I have a billing account' }))
  verifyUnchecked(screen.getByRole('radio', { name: 'I don\'t have access to a Cloud billing account' }))
}

const testStep3InitialState = () => {
  verifyDisabled(getStep3DontHaveAccessButton())
  verifyDisabled(getStep3HaveAddedButton())
  verifyUnchecked(screen.queryByRole('radio', { name: 'I don\'t have access to do this' }))
  verifyUnchecked(getStep3HaveAddedButton())
  expect(textMatcher('Add terra-billing@terra.bio as a Billing Account User to your billing account.')).not.toBeNull()
  expect(textMatcher('Contact your billing account administrator and have them add you and terra-billing@terra.bio as a ' +
    "Billing Account User to your organization's billing account.")).toBeNull()
  expect(getStep3CheckBox()).toBeNull()
}

const testStep3RadioButtonsNoneSelected = () => {
  verifyEnabled(getStep3DontHaveAccessButton())
  verifyEnabled(getStep3HaveAddedButton())
  verifyUnchecked(getStep3DontHaveAccessButton())
  verifyUnchecked(getStep3HaveAddedButton())
  expect(getStep3DontHaveAccessButton()).not.toBeNull()
  expect(getStep3HaveAddedButton()).not.toBeNull()
  expect(getStep3CheckBox()).toBeNull()
  textMatcher('Add terra-billing@terra.bio as a Billing Account User to your billing account.')
}

const testStep3Active = () => {
  expect(allSteps(2)).toHaveStyle({ ...styles.stepBanner(true) })
  expect(allSteps(0).getAttribute('aria-current')).toBe('false')
  expect(allSteps(1).getAttribute('aria-current')).toBe('false')
  expect(allSteps(2).getAttribute('aria-current')).toBe('step')
  expect(allSteps(3).getAttribute('aria-current')).toBe('false')
}

const testStep3DontHaveAccessToBillingCheckBox = () => {
  expect(getStep3DontHaveAccessButton()).toBeNull()
  expect(getStep3HaveAddedButton()).toBeNull()
  expect(getStep3CheckBox()).not.toBeNull()
  textMatcher('Contact your billing account administrator and have them add you and terra-billing@terra.bio as a ' +
    "Billing Account User to your organization's billing account.")
}

const testStep4Active = () => {
  expect(allSteps(3)).toHaveStyle({ ...styles.stepBanner(true) })
  expect(allSteps(0).getAttribute('aria-current')).toBe('false')
  expect(allSteps(1).getAttribute('aria-current')).toBe('false')
  expect(allSteps(2).getAttribute('aria-current')).toBe('false')
  expect(allSteps(3).getAttribute('aria-current')).toBe('step')
}

const testStep4Disabled = () => {
  verifyDisabled(getBillingProjectInput())
  verifyDisabled(getBillingAccountInput())
  verifyDisabled(getStep4CreateButton())
  expect(screen.queryByText('Refresh Step 3')).toBeNull()
}

const testStep4Enabled = () => {
  verifyEnabled(getStep4CreateButton())
  verifyEnabled(getBillingProjectInput())
  verifyEnabled(getBillingAccountInput())
}

const accountName = 'Billing_Account_Name'
const displayName = 'Billing_Account_Display_Name'
const createGCPProject = jest.fn(() => Promise.resolve())

describe('CreateNewBillingProjectWizard', () => {
  beforeEach(() => {
    // Arrange
    Ajax.mockImplementation(() => {
      return {
        Billing: { createGCPProject }
      }
    })
    render(h(CreateNewBillingProjectWizard, {
      onSuccess: jest.fn(),
      billingAccounts: [{ accountName, displayName }], authorizeAndLoadAccounts: jest.fn()
    }))

    jest.spyOn(Preferences, 'getLocalPref')
    jest.spyOn(Preferences, 'getLocalPref')
    // STEP 1 BUTTON (always enabled)
    verifyEnabled(getStep1Button())
    expect(getStep1Button().getAttribute('href')).toBe('https://console.cloud.google.com')
    // STEP 2 BUTTONS (always enabled)
    verifyEnabled(getStep2DontHaveBillingAccountButton())
    verifyEnabled(getStep2HaveBillingAccountButton())
  })

  describe('Active Step: Step 1', () => {
    // Assert
    it('has Step 1 set active', () => {
      expect(allSteps(0)).toHaveStyle({ ...styles.stepBanner(true) })
      expect(allSteps(0).getAttribute('aria-current')).toBe('step')
      expect(allSteps(1).getAttribute('aria-current')).toBe('false')
      expect(allSteps(2).getAttribute('aria-current')).toBe('false')
      expect(allSteps(3).getAttribute('aria-current')).toBe('false')
    })
    it('has the correct initial state for Step 3', () => {
      testStep3InitialState()
    })
    it('has the correct initial state for Step 4', () => {
      testStep4Disabled()
    })
  })

  describe('Active Step: Step 2', () => {
    // Arrange
    beforeEach(() => {
      fireEvent.click(getStep1Button())
    })
    // Assert
    it('has Step 2 set active', () => {
      expect(allSteps(1)).toHaveStyle({ ...styles.stepBanner(true) })
      expect(allSteps(0).getAttribute('aria-current')).toBe('false')
      expect(allSteps(1).getAttribute('aria-current')).toBe('step')
      expect(allSteps(2).getAttribute('aria-current')).toBe('false')
      expect(allSteps(3).getAttribute('aria-current')).toBe('false')
    })
    it('has the correct initial state for Step 3', () => {
      testStep3InitialState()
    })
    it('has the correct initial state for Step 4', () => {
      testStep4Disabled()
    })
  })

  describe('Active Step: Step 3 and 4 - I dont have access to a Cloud Billing Account', () => {
    describe('Active Step: Step 3', () => {
      // Act
      beforeEach(() => {
        fireEvent.click(getStep2DontHaveBillingAccountButton())
        // Step 2 selected
        verifyChecked(screen.getByRole('radio', { name: 'I don\'t have access to a Cloud billing account' }))
        verifyUnchecked(getStep2HaveBillingAccountButton())
      })
      // Assert
      it('checks if Step 3 is active', () => { testStep3Active() })
      it("checks Step 3 text (when user doesn't have access) and checkbox", () => {
        testStep3DontHaveAccessToBillingCheckBox()
      })
      it('checks initial state of Step 4', () => testStep4Disabled())
    })

    describe('Active Step: Step 4', () => {
      // Act
      beforeEach(async () => {
        fireEvent.click(getStep2DontHaveBillingAccountButton())
        await act(async () => {
          await userEvent.click(getStep3CheckBox())
        })
      })
      // Assert
      it('checks if Step 4 is active ', () => { testStep4Active() })
      it("checks Step 3 text (when user doesn't have access) and checkbox", () => {
        testStep3DontHaveAccessToBillingCheckBox()
      })
      it('checks Step 4 status', () => {
        verifyEnabled(getStep4CreateButton())
        verifyEnabled(getBillingProjectInput())
        verifyEnabled(getBillingAccountInput())
      })
    })
  })


  describe('Active Step: Step 3 and 4 - I have a billing account', () => {
    describe('Active Step: Step 3', () => {
      // Act
      beforeEach(() => {
        fireEvent.click(getStep2HaveBillingAccountButton())
      })
      it('checks Step 2 state', () => { testStep2HaveBillingChecked() })
      it('checks if Step 3 is active', () => { testStep3Active() })
      it('checks Step 3 text and radio buttons', () => {
        testStep3RadioButtonsNoneSelected()
      })
      it('checks initial state of Step 4', () => testStep4Disabled())
    })

    describe('Active Step: Step 3 - I dont have access to do this', () => {
      // Act
      beforeEach(() => {
        fireEvent.click(getStep2HaveBillingAccountButton())
        fireEvent.click(getStep3DontHaveAccessButton())
      })
      // Assert
      it('checks Step 2 state', () => { testStep2HaveBillingChecked() })
      it('checks if Step 3 is active', () => { testStep3Active() })
      it("checks Step 3 text and checkbox (when user doesn't have access to a billing account)", () => {
        testStep3DontHaveAccessToBillingCheckBox()
      })
      it('checks initial state of Step 4', () => testStep4Disabled())
    })

    describe('Active Step: Step 4 - I dont have access to do this', () => {
      // Act
      beforeEach(async () => {
        fireEvent.click(getStep2HaveBillingAccountButton())
        fireEvent.click(getStep3DontHaveAccessButton())
        await act(async () => {
          await fireEvent.click(getStep3CheckBox())
        })
      })
      // Assert
      it('checks Step 2 state', () => { testStep2HaveBillingChecked() })
      it('checks if Step 4 is active', () => { testStep4Active() })
      it("checks Step 3 text and checkbox (when user doesn't have access to add..)", () => {
        testStep3DontHaveAccessToBillingCheckBox()
        verifyChecked(getStep3CheckBox())
      })
      it('checks Step 4 status', () => { testStep4Enabled() })
    })

    describe('Active Step: Step 3 and 4- I have added terra-billing as a billing account user', () => {
      // Act
      beforeEach(() => {
        fireEvent.click(getStep2HaveBillingAccountButton())
        testStep2HaveBillingChecked()
        testStep4Disabled()
      })
      // Assert
      it('checks Step 3 text and buttons', () => {
        expect(getStep3DontHaveAccessButton()).not.toBeNull()
        expect(getStep3HaveAddedButton()).not.toBeNull()
        expect(getStep3CheckBox()).toBeNull()
        textMatcher('Add terra-billing@terra.bio as a Billing Account User to your billing account.')
      })
      it('checks if Step 4 is active', async () => {
        await act(async () => {
          await userEvent.click(getStep3HaveAddedButton())
        })
        verifyChecked(getStep3HaveAddedButton())
        verifyUnchecked(getStep3DontHaveAccessButton())
        testStep4Active()
      })
    })
  })

  describe('Active Step: Step 4', () => {
    it('tests if Step 4 can create a project given valid inputs', async () => {
      // Arrange
      const projectName = 'Billing_Project_Name'
      // Complete Step 2 and 3
      fireEvent.click(getStep2DontHaveBillingAccountButton())
      await act(async () => { await userEvent.click(getStep3CheckBox()) })

      // Step 4 status
      testStep4Enabled()
      expect(screen.queryByText('Create Terra Billing Project')).not.toBeNull()
      expect(screen.queryByText('You do not have access to any Google Billing Accounts. Please verify that a billing account ' +
        'has been created in the Google Billing Console and terra-billing@terra.bio has been added as a Billing Account User to your ' +
        'billing account.')).toBeNull()
      expect(screen.queryByText('Refresh Step 3')).toBeNull()

      // Insert valid project Name
      await userEvent.type(getBillingProjectInput(), projectName)
      // Select a billing account
      await userEvent.click(getBillingAccountInput())
      const selectOption = await screen.findByText(displayName)
      await userEvent.click(selectOption)
      // Act - Click Create
      await act(async () => {
        await userEvent.click(getStep4CreateButton())
      })
      // Assert
      expect(createGCPProject).toHaveBeenCalledWith(projectName, accountName)
    })
  })

  describe('Changing prior answers', () => {
    it('should reset from Step 3 if Step 2 answer is changed (option 1 to 2)', () => {
      // Arrange
      fireEvent.click(getStep2DontHaveBillingAccountButton())
      // Assert
      testStep2DontHaveAccessToBillingChecked()
      testStep3Active()
      testStep3DontHaveAccessToBillingCheckBox()
      // Act
      fireEvent.click(getStep2HaveBillingAccountButton())
      // Assert
      testStep2HaveBillingChecked()
      testStep3RadioButtonsNoneSelected()
      testStep4Disabled()
    })

    it('should reset from Step 3 if Step 2 answer is changed (option 2 to 1)', () => {
      // Arrange
      fireEvent.click(getStep2HaveBillingAccountButton())
      fireEvent.click(getStep3DontHaveAccessButton())
      // Assert
      testStep2HaveBillingChecked()
      testStep3Active()
      testStep3DontHaveAccessToBillingCheckBox()
      // Act
      fireEvent.click(getStep2DontHaveBillingAccountButton())
      // Assert
      testStep2DontHaveAccessToBillingChecked()
      testStep3DontHaveAccessToBillingCheckBox()
      testStep4Disabled()
    })

    it('should reset from Step 3 if Step 3 checkbox is unchecked from Step 4', async () => {
      // Act - Check
      fireEvent.click(getStep2DontHaveBillingAccountButton())
      await act(async () => { await userEvent.click(getStep3CheckBox()) })
      // Assert
      testStep2DontHaveAccessToBillingChecked()
      testStep4Enabled()
      verifyChecked(getStep3CheckBox())
      // Act - Uncheck
      await act(async () => { await userEvent.click(getStep3CheckBox()) })
      // Assert
      testStep2DontHaveAccessToBillingChecked()
      verifyUnchecked(getStep3CheckBox())
      testStep3Active()
      testStep4Disabled()
    })

    it('should reset from Step 3 if Step 3 radio button answer is changed from Step 4', async () => {
      // Act - Check
      fireEvent.click(getStep2HaveBillingAccountButton())
      await act(async () => { await userEvent.click(getStep3HaveAddedButton()) })
      // Assert
      testStep2HaveBillingChecked()
      testStep4Enabled()
      verifyChecked(getStep3HaveAddedButton())
      // Act - Uncheck
      await act(async () => { await userEvent.click(getStep3DontHaveAccessButton()) })
      // Assert
      testStep2HaveBillingChecked()
      testStep3DontHaveAccessToBillingCheckBox()
      testStep3Active()
      testStep4Disabled()
    })
  })
})

describe('Test Warning', () => {
  // Arrange
  const authorizeAndLoadAccounts = jest.fn()
  beforeEach(() => {
    Ajax.mockImplementation(() => {
      return {
        Billing: { createGCPProject }
      }
    })
    render(h(CreateNewBillingProjectWizard, {
      onSuccess: jest.fn(),
      billingAccounts: [], authorizeAndLoadAccounts
    }))
  })

  it('tests Step 4 (warning message and refresh button) when there are no billing accounts', async () => {
    // Act
    // Complete step 2 and 3
    fireEvent.click(getStep2DontHaveBillingAccountButton())
    await act(async () => { await userEvent.click(getStep3CheckBox()) })

    // Assert
    verifyEnabled(getBillingProjectInput())
    verifyEnabled(getBillingAccountInput())
    expect(screen.queryByText('Create Terra Billing Project')).toBeNull()
    expect(screen.queryByText('You do not have access to any Google Billing Accounts. Please verify that a billing account ' +
      'has been created in the Google Billing Console and terra-billing@terra.bio has been added as a Billing Account User to your ' +
      'billing account.')).not.toBeNull()
    expect(screen.queryByText('Refresh Step 3')).not.toBeNull()
    fireEvent.click(screen.queryByText('Refresh Step 3'))
    expect(authorizeAndLoadAccounts).toHaveBeenCalled()
  })

  // it('tests Step 4 (warning message and refresh button) when already refreshed', async () => {
  //
  // })
})

// describe('Saved Stated and Authentication', () => {
//
// })
//
