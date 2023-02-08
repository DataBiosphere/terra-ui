import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as _ from 'lodash/fp'
import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import {
  CatalogNumberInput, ListInput,
  StringInput
} from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


// These components are needed to test inputs, because they are designed with their value being managed in a parent component's state
const InputWithState = ({ initialValue, input, props }) => {
  const [value, setValue] = useState(initialValue)

  return h(input, {
    ...props,
    value,
    onChange: value => setValue(value)
  })
}

const StringListInputWithState = ({ initialList, title, blankValue }) => {
  const [list, setList] = useState(initialList)

  return h(ListInput, {
    title,
    blankValue,
    list,
    renderer: (listItem, onChange) => h(StringInput, {
      title: `Title ${listItem}`,
      value: typeof listItem === 'string' ? listItem : '',
      onChange,
      placeholder: ''
    }),
    onChange: (value, index) => setList(_.set(`[${index}]`, value, list)),
    onRemove: value => setList(_.xor([value], list))
  })
}


describe('CreateDatasetInputs', () => {
  it('Renders a StringInput with the title and value', async () => {
    const user = userEvent.setup()
    const currentValue = 'Hello, '
    const addedValue = 'World'
    render(h(InputWithState, {
      initialValue: currentValue,
      props: {
        title: 'Title',
        placeholder: ''
      },
      input: StringInput
    }))
    const input = screen.getByLabelText('Title')
    expect(screen.getByText('Title')).toBeTruthy()
    expect(input.closest('input')?.value).toBe(currentValue.toString())
    await user.type(input, addedValue)
    expect(input.closest('input')?.value).toBe(currentValue + addedValue)
  })

  it('Renders a NumberInput with the title and value', async () => {
    // Arrange
    const user = userEvent.setup()
    const initialValue = 1
    const addedValue = 5
    render(h(InputWithState, {
      initialValue,
      props: {
        title: 'Title'
      },
      input: CatalogNumberInput
    }))

    const input = screen.getByLabelText('Title')
    expect(screen.getByText('Title')).toBeTruthy()
    expect(input.closest('input')?.value).toBe(initialValue.toString())
    await user.type(input, addedValue.toString())
    expect(input.closest('input')?.value).toBe(initialValue.toString() + addedValue.toString())
  })

  it('Renders a list for ListInput', () => {
    // Arrange
    const initialList = ['a', 'b', 'c']
    // Act
    render(h(StringListInputWithState, {
      initialList,
      title: 'Title',
      blankValue: ''
    }))
    // Assert - for each value in the list we should see an input with the title 'index' and value 'listItem'
    _.forEach(listValue => {
      const input = screen.getByLabelText(`Title ${listValue}`).closest('input')
      expect(input?.value).toBe(listValue.toString())
    }, initialList)
  })

  it('Removes items from the list for ListInput', async () => {
    // Arrange
    const initialList = ['a', 'b', 'c']
    const user = userEvent.setup()
    // Act
    render(h(StringListInputWithState, {
      initialList,
      title: 'Title',
      blankValue: ''
    }))
    await user.click(screen.getByLabelText('Remove List Item 0'))
    // Assert - for each value in the list we should see an input with the title 'index' and value 'listItem'
    _.forEach(listValue => {
      const input = screen.getByLabelText(`Title ${listValue}`).closest('input')
      expect(input?.value).toBe(listValue.toString())
    }, ['b', 'c'])
  })

  it('Adds an item to the list with blankValue for ListInput', async () => {
    // Arrange
    const initialList = ['a', 'b', 'c']
    const user = userEvent.setup()
    // Act
    render(h(StringListInputWithState, {
      initialList,
      title: 'Title',
      blankValue: ''
    }))
    await user.click(screen.getByLabelText('Add List Item'))
    // Assert - for each value in the list we should see an input with the title 'index' and value 'listItem'
    _.forEach(listValue => {
      const input = screen.getByLabelText(listValue !== '' ? `Title ${listValue}` : 'Title').closest('input')
      expect(input?.value).toBe(listValue.toString())
    }, ['a', 'b', 'c', ''])
  })
})
