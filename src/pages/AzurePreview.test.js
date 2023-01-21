import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { signOut } from 'src/libs/auth'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { authStore, azurePreviewStore } from 'src/libs/state'

import AzurePreview, { submittedPreviewFormPrefKey } from './AzurePreview'


jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
  signOut: jest.fn(),
}))

jest.mock('src/libs/prefs', () => ({
  getLocalPref: jest.fn(),
  setLocalPref: jest.fn(),
}))

describe('AzurePreview', () => {
  it('renders different content based on whether the user is a preview user', () => {
    // Act
    const [previewUserContent, nonPreviewUserContent] = [true, false].map(isAzurePreviewUser => {
      authStore.set({ isAzurePreviewUser })
      const { container, unmount } = render(h(AzurePreview))
      const content = container.innerHTML
      unmount()
      return content
    })

    // Assert
    expect(previewUserContent).not.toBe(nonPreviewUserContent)
  })

  describe('for preview users', () => {
    beforeAll(() => {
      authStore.set({ isAzurePreviewUser: true })
    })

    it('renders a button to proceed to Terra', async () => {
      // Arrange
      const user = userEvent.setup()

      jest.spyOn(azurePreviewStore, 'set')

      // Act
      render(h(AzurePreview))

      const proceedToTerraButton = screen.getByText('Proceed to Terra on Microsoft Azure Preview')
      await user.click(proceedToTerraButton)

      // Assert
      expect(azurePreviewStore.set).toHaveBeenCalledWith(true)
    })

    it('renders a sign out button', async () => {
      // Arrange
      const user = userEvent.setup()

      // Act
      render(h(AzurePreview))

      const signOutButton = screen.getByText('Sign Out')
      await user.click(signOutButton)

      // Assert
      expect(signOut).toHaveBeenCalled()
    })
  })

  describe('for non-preview users', () => {
    beforeAll(() => {
      authStore.set({ isAzurePreviewUser: false })
    })

    describe('for users who have not submitted the form', () => {
      beforeAll(() => {
        getLocalPref.mockImplementation(key => key === submittedPreviewFormPrefKey ? false : undefined)
      })

      it('renders a message', () => {
        // Act
        render(h(AzurePreview))

        // Assert
        screen.getByText('You are not currently part of the Terra on Microsoft Azure Preview Program. If you are interested in joining the program, please complete the form below.')
      })

      it('renders the form', () => {
        // Act
        render(h(AzurePreview))

        // Assert
        screen.getByRole('form')
      })

      describe('submitting the form', () => {
        let user

        beforeEach(async () => {
          // Arrange
          user = userEvent.setup()

          render(h(AzurePreview))

          // Act
          const submitButton = screen.getByText('Submit')
          await user.click(submitButton)
        })

        it('hides the form', () => {
          // Assert
          expect(screen.queryByRole('form')).toBeNull()
        })

        it('shows a thank you message', () => {
          // Assert
          screen.getByText('Thank you for your interest in using Terra on Microsoft Azure. We will be in touch with you shortly with your access information.')
        })

        it('saves submission status', () => {
          expect(setLocalPref).toHaveBeenCalledWith(submittedPreviewFormPrefKey, true)
        })
      })
    })

    describe('for users who have submitted the form', () => {
      beforeAll(() => {
        getLocalPref.mockImplementation(key => key === submittedPreviewFormPrefKey ? true : undefined)
      })

      it('renders a message', () => {
        // Act
        render(h(AzurePreview))

        // Assert
        screen.getByText('Thank you for your interest in using Terra on Microsoft Azure. We will be in touch with you shortly with your access information.')
      })

      it('does not render the form', () => {
        // Act
        render(h(AzurePreview))

        // Assert
        expect(screen.queryByRole('form')).toBeNull()
      })
    })

    it('renders a sign out button', async () => {
      // Arrange
      const user = userEvent.setup()

      // Act
      render(h(AzurePreview))

      const signOutButton = screen.getByText('Sign Out')
      await user.click(signOutButton)

      // Assert
      expect(signOut).toHaveBeenCalled()
    })
  })
})
