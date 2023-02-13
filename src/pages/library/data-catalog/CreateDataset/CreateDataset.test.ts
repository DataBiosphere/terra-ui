import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { CreateDataset } from 'src/pages/library/data-catalog/CreateDataset/CreateDataset'


jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  getPath: jest.fn()
}))


describe('CreateDataset', () => {
  it('Validates for title', async () => {
    const user = userEvent.setup()

    render(h(CreateDataset, {
      storageSystem: 'wks',
      storageSourceId: 'abcdef'
    }))
    expect(await screen.queryAllByText('Dct:title can\'t be blank').length).toBe(1)
    const titleInput = screen.getByLabelText('Title *')
    await user.type(titleInput, 'title')
    expect(await screen.queryByText('Dct:title can\'t be blank')).toBeFalsy()
    await user.clear(titleInput)
    // Count increases because we show the red error message after title has been touched
    expect(await screen.queryAllByText('Dct:title can\'t be blank').length).toBe(2)
  })

  // No description test due to label bug with markdown input
})
