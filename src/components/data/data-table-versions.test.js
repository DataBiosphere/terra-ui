import '@testing-library/jest-dom'

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { DataTableSaveVersionModal } from 'src/components/data/data-table-versions'


describe('DataTableSaveVersionModal', () => {
  beforeAll(() => {
    const modalRoot = document.createElement('div')
    modalRoot.id = 'modal-root'
    document.body.append(modalRoot)
  })

  afterAll(() => {
    document.getElementById('modal-root').remove()
  })

  it('renders input for description', () => {
    const { getByLabelText } = render(h(DataTableSaveVersionModal, {
      entityType: 'sample',
      allEntityTypes: ['sample'],
      onDismiss: _.noop,
      onSubmit: _.noop
    }))

    const descriptionInput = getByLabelText('Description')
    expect(descriptionInput).toBeTruthy()
  })

  it('renders checkboxes to include related set tables', () => {
    const { getAllByRole } = render(h(DataTableSaveVersionModal, {
      entityType: 'sample',
      allEntityTypes: ['sample', 'sample_set', 'sample_set_set', 'participant'],
      onDismiss: _.noop,
      onSubmit: _.noop
    }))

    const setTableCheckboxes = getAllByRole('checkbox')
    expect(setTableCheckboxes.length).toBe(2)

    expect(setTableCheckboxes[0].parentElement).toHaveTextContent('sample_set')
    expect(setTableCheckboxes[0].getAttribute('aria-checked')).toBe('false')

    expect(setTableCheckboxes[1].parentElement).toHaveTextContent('sample_set_set')
    expect(setTableCheckboxes[1].getAttribute('aria-checked')).toBe('false')
  })

  it('calls onSubmit with entered description and selected set tables', async () => {
    const user = userEvent.setup()

    const onSubmit = jest.fn()

    const { getAllByRole, getByLabelText, getByText } = render(h(DataTableSaveVersionModal, {
      entityType: 'sample',
      allEntityTypes: ['sample', 'sample_set', 'sample_set_set', 'participant'],
      onDismiss: _.noop,
      onSubmit
    }))

    const descriptionInput = getByLabelText('Description')
    await user.type(descriptionInput, 'this is a version')

    const setTableCheckboxes = getAllByRole('checkbox')
    await user.click(setTableCheckboxes[0])

    const saveButton = getByText('Save')
    await user.click(saveButton)

    expect(onSubmit).toHaveBeenCalledWith({
      description: 'this is a version',
      includedSetEntityTypes: ['sample_set']
    })
  })
})
