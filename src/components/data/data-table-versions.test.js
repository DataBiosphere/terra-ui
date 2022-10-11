import '@testing-library/jest-dom'

import { fireEvent, render } from '@testing-library/react'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { DataTableSaveVersionModal, DataTableVersion } from 'src/components/data/data-table-versions'


beforeAll(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.append(modalRoot)
})

afterAll(() => {
  document.getElementById('modal-root').remove()
})

describe('DataTableSaveVersionModal', () => {
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

  it('calls onSubmit with entered description and selected set tables', () => {
    const onSubmit = jest.fn()

    const { getAllByRole, getByLabelText, getByText } = render(h(DataTableSaveVersionModal, {
      entityType: 'sample',
      allEntityTypes: ['sample', 'sample_set', 'sample_set_set', 'participant'],
      onDismiss: _.noop,
      onSubmit
    }))

    const descriptionInput = getByLabelText('Description')
    fireEvent.change(descriptionInput, { target: { value: 'this is a version' } })

    const setTableCheckboxes = getAllByRole('checkbox')
    fireEvent.click(setTableCheckboxes[0])

    const saveButton = getByText('Save')
    fireEvent.click(saveButton)

    expect(onSubmit).toHaveBeenCalledWith({
      description: 'this is a version',
      includedSetEntityTypes: ['sample_set']
    })
  })
})

describe('DataTableVersion', () => {
  const testVersion = {
    url: `gs://workspace-bucket/.data-table-versions/sample/sample.1664568527960.zip`,
    createdBy: 'user@example.com',
    entityType: 'sample',
    includedSetEntityTypes: ['sample_set'],
    timestamp: 1664568527960,
    description: 'A version of samples'
  }

  describe('renders version information', () => {
    let renderResult

    beforeEach(() => {
      renderResult = render(h(DataTableVersion, { version: testVersion, onDelete: jest.fn(), onRestore: jest.fn() }))
    })

    it('renders entity type and timestamp', () => {
      const { getByRole } = renderResult
      const heading = getByRole('heading')
      expect(heading).toHaveTextContent('sample (Sep 30, 2022, 8:08 PM)')
    })

    it('renders included set tables', () => {
      const { getByLabelText } = renderResult
      const setTableList = getByLabelText('Included set tables:')
      expect(setTableList).toHaveTextContent('sample_set')
    })

    it('renders creator', () => {
      const { getByText } = renderResult
      expect(getByText('Created by: user@example.com')).toBeTruthy()
    })

    it('renders description', () => {
      const { getByText } = renderResult
      expect(getByText('A version of samples')).toBeTruthy()
    })
  })

  it('renders restore button and confirms restore', () => {
    const onRestore = jest.fn()
    const { getByTestId, getByText } = render(h(DataTableVersion, { version: testVersion, onDelete: jest.fn(), onRestore }))

    const restoreButton = getByText('Import')
    fireEvent.click(restoreButton)

    expect(getByText(/This version will be imported to a new data table/)).toBeTruthy()

    const confirmRestoreButton = getByTestId('confirm-restore')
    fireEvent.click(confirmRestoreButton)

    expect(onRestore).toHaveBeenCalled()
  })

  it('renders delete button and confirms delete', () => {
    const onDelete = jest.fn()
    const { getByTestId, getByText } = render(h(DataTableVersion, { version: testVersion, onDelete, onRestore: jest.fn() }))

    const deleteButton = getByText('Delete')
    fireEvent.click(deleteButton)

    expect(getByText(/Are you sure you want to delete the version/)).toBeTruthy()

    const confirmDeleteButton = getByTestId('confirm-delete')
    fireEvent.click(confirmDeleteButton)

    expect(onDelete).toHaveBeenCalled()
  })
})
