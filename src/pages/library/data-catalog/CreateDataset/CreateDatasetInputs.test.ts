import { fireEvent, render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


describe('CreateDatasetInputs', () => {
  it('Renders a StringInput with the title and value', () => {
    const { getByText, getByLabelText } = render(h(StringInput, {
      title: 'Title',
      value: 'Value',
      placeholder: '',
      onChange: value => value
    }))
    const input = getByLabelText('Title').closest('input')
    expect(getByText('Title')).toBeTruthy()
    expect(input?.value).toBe('Value')
  })

  it('Calls onChange with StringInput', () => {
    let currentValue = ''
    const expectedValue = 'Value'
    const { getByLabelText } = render(h(StringInput, {
      title: 'Title',
      value: '',
      placeholder: '',
      onChange: value => currentValue = value
    }))
    const input = getByLabelText('Title').closest('input')
    input !== null && fireEvent.change(input, { target: { value: expectedValue } })
    expect(currentValue).toBe(expectedValue)
  })
})
