import '@testing-library/jest-dom'

import { fireEvent, getByText, render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { isFeaturePreviewEnabled, toggleFeaturePreview, useAvailableFeaturePreviews } from 'src/libs/feature-previews'
import { FeaturePreviews } from 'src/pages/FeaturePreviews'


jest.mock('src/libs/ajax')
jest.mock('src/libs/feature-previews')


describe('FeaturePreviews', () => {
  beforeEach(() => {
    useAvailableFeaturePreviews.mockReturnValue({
      featurePreviews: [
        {
          id: 'feature1',
          title: 'Feature #1',
          description: 'A new feature'
        },
        {
          id: 'feature2',
          title: 'Feature #2',
          description: 'Another new feature'
        }
      ]
    })

    isFeaturePreviewEnabled.mockReturnValue(false)
  })

  it('should render available feature previews', () => {
    const { getAllByRole } = render(h(FeaturePreviews))
    const cells = getAllByRole('cell')

    expect(getByText(cells[1], 'Feature #1')).toBeTruthy()
    expect(getByText(cells[1], 'A new feature')).toBeTruthy()

    expect(getByText(cells[3], 'Feature #2')).toBeTruthy()
    expect(getByText(cells[3], 'Another new feature')).toBeTruthy()
  })

  it('should render whether features are enabled', () => {
    isFeaturePreviewEnabled.mockImplementation(id => id === 'feature1')

    const { getAllByRole } = render(h(FeaturePreviews))
    const checkboxes = getAllByRole('checkbox')

    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true')
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('false')
  })

  it('checking a checkbox should toggle feature previews', () => {
    const { getAllByRole } = render(h(FeaturePreviews))
    const checkboxes = getAllByRole('checkbox')

    fireEvent.click(checkboxes[0])
    expect(toggleFeaturePreview).toHaveBeenCalledWith('feature1', true)

    fireEvent.click(checkboxes[0])
    expect(toggleFeaturePreview).toHaveBeenCalledWith('feature1', false)
  })
})
