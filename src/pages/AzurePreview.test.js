import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { signOut } from 'src/libs/auth'
import { authStore, azurePreviewStore } from 'src/libs/state'

import AzurePreview from './AzurePreview'


jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
  signOut: jest.fn(),
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

    it('renders a message and a link to email support', () => {
      // Act
      render(h(AzurePreview))

      // Assert
      screen.getByText(/You are not currently part of the Terra on Microsoft Azure Preview Program/)

      const supportLink = screen.getByText('preview@terra.bio')
      expect(supportLink.getAttribute('href')).toEqual(expect.stringContaining('mailto:preview@terra.bio'))
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
