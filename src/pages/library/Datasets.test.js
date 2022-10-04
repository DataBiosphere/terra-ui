import '@testing-library/jest-dom'

import { render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { isRadX } from 'src/libs/brand-utils'
import * as Nav from 'src/libs/nav'
import { Datasets } from 'src/pages/library/Datasets'


jest.mock('src/libs/brand-utils', () => ({
  ...jest.requireActual('src/libs/brand-utils'),
  isRadX: jest.fn()
}))

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn()
}))

beforeEach(() => {
  Nav.useRoute.mockReturnValue({ title: 'Datasets', params: {}, query: {} })
})

describe('Datasets', () => {
  it('shows a toggle for the data catalog', () => {
    const { getByLabelText, getByText } = render(h(Datasets))
    expect(getByText('Preview the new Data Catalog')).toBeTruthy()
    expect(getByLabelText('New Catalog OFF')).toBeTruthy()
  })

  it('does not show a toggle when viewed as RadX', () => {
    isRadX.mockReturnValue(true)

    const { queryByLabelText, queryByText } = render(h(Datasets))
    expect(queryByText('Preview the new Data Catalog')).toBeFalsy()
    expect(queryByLabelText('New Catalog OFF')).toBeFalsy()
    // We can test if the new catalog is shown by checking for filters on the page.
    expect(queryByText('Filters')).toBeTruthy()
  })
})
