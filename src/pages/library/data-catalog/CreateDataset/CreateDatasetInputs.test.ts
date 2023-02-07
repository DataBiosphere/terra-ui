import { fireEvent, render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import {
  CatalogNumberInput,
  StringInput
} from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


describe('CreateDatasetInputs', () => {
  const testElementWithValue = (element, getByText, getCurrentValue, getExpectedValue) => {
    expect(getByText('Title')).toBeTruthy()
    expect(element?.value).toBe(getCurrentValue().toString())
    element !== null && fireEvent.change(element, { target: { value: getExpectedValue() } })
    expect(getCurrentValue()).toBe(getExpectedValue())
  }
  it('Renders a StringInput with the title and value', () => {
    let currentValue = 'Value'
    const expectedValue = 'New Value'
    const { getByText, getByLabelText } = render(h(StringInput, {
      title: 'Title',
      value: currentValue,
      placeholder: '',
      onChange: value => currentValue = value
    }))
    const input = getByLabelText('Title').closest('input')
    testElementWithValue(input, getByText, () => currentValue, () => expectedValue)
  })

  it('Renders a NumberInput with the title and value', () => {
    let currentValue = 0
    const expectedValue = 5
    const { getByText, getByLabelText } = render(h(CatalogNumberInput, {
      title: 'Title',
      value: currentValue,
      onChange: value => currentValue = value
    }))
    const input = getByLabelText('Title').closest('input')
    testElementWithValue(input, getByText, () => currentValue, () => expectedValue)
  })
})
