import * as _ from 'lodash/fp'
import { ReactElement } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable, Select, SelectProps } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput, ValidatedInput } from 'src/components/input'
import { MarkdownEditor } from 'src/components/markdown'
import { FormLabel } from 'src/libs/forms'
import { useUniqueId } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


interface InputProps<T> {
  title?: string
  value?: T
  onChange: Function
  wrapperProps?: {}
  errors?: any
  placeholder?: string
}

interface StringInputProps extends InputProps<string> {
  autoFocus?: boolean
  required?: boolean
}

export const StringInput = ({ title, onChange, value, placeholder, autoFocus = false, required = false, errors, wrapperProps = {} }: StringInputProps): ReactElement => {
  const id = useUniqueId()
  return div(wrapperProps, [
    title && h(FormLabel, { htmlFor: id, required }, [title]),
    h(ValidatedInput, {
      inputProps: {
        id,
        'aria-label': title ? undefined : value,
        autoFocus,
        placeholder,
        value,
        onChange
      },
      error: Utils.summarizeErrors(errors)
    })
  ])
}

interface NumberInputProps extends InputProps<number> {
  required?: boolean
}

export const CatalogNumberInput = ({ title, onChange, value, required = false, wrapperProps = {} }: NumberInputProps): ReactElement => {
  const id = useUniqueId()
  return div(wrapperProps, [
    h(FormLabel, { htmlFor: id, required }, [title]),
    h(NumberInput, {
      id,
      onChange,
      min: 0,
      onlyInteger: true,
      value
    })
  ])
}

export const MarkdownInput = ({ title, onChange, value, placeholder, required = false, errors }: StringInputProps): ReactElement => {
  const id = useUniqueId()
  return h(div, [
    h(FormLabel, { htmlFor: id, required }, [title]),
    h(MarkdownEditor, {
      placeholder,
      value,
      onChange,
      id,
      options: undefined,
      autofocus: false,
      error: Utils.summarizeErrors(errors)
    })
  ])
}

export type SelectInputProps<Value> = SelectProps<Value, false, { value: Value; label: string | undefined }> & {
  title: string
  required?: boolean
  wrapperProps?: Omit<JSX.IntrinsicElements['div'], 'children'>
}

export const SelectInput = <Value>({ title, value, placeholder = '', options, onChange, isClearable = true, required = false, wrapperProps = {} }: SelectInputProps<Value>) => {
  const id = useUniqueId()

  const ParameterizedSelect = Select as typeof Select<Value>
  return div({ ...wrapperProps }, [
    h(FormLabel, { htmlFor: id, required }, [title]),
    h(ParameterizedSelect, {
      id,
      value,
      isClearable,
      isSearchable: false,
      placeholder,
      options,
      onChange
    })
  ])
}

export interface ListInputProps<T> {
  title: string
  list: T[]
  blankValue: T
  renderer: (listItem: T, onChange: (newValue: T) => void) => ReactElement | string
  onChange: (valueChanged: T, index: number) => void
  onRemove: (valueRemoved: T) => void
  listItemTitles?: boolean
}

export const ListInput = <T>({ title, list, blankValue, renderer, onChange, onRemove, listItemTitles = true }: ListInputProps<T>) => {
  return div({ style: { width: '100%' } }, [
    h(FormLabel, [title]),
    _.map(([index, listItem]) => div({ style: { display: 'flex' }, key: index }, [
      renderer(listItem, newValue => { onChange(newValue, index) }),
      h(Clickable, {
        'aria-label': `Remove List Item ${index}`,
        style: {
          marginLeft: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: listItemTitles ? '2.5rem' : 0,
          height: '2rem'
        },
        onClick: () => {
          onRemove(listItem)
        }
      }, [
        icon('times', { size: 24 })
      ])
    ]), Utils.toIndexPairs(list)),
    h(Clickable, {
      'aria-label': 'Add List Item',
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '0.5rem',
        height: '2rem'
      },
      onClick: () => onChange(blankValue, list.length)
    }, [
      icon('plus-circle', { size: 24 })
    ])
  ])
}

export const generateIndividualInputPropsForObjectField = (title, key, placeholder, object, onChange, errors, numbersOfFieldsInRow): InputProps<any> => ({
  wrapperProps: {
    style: { width: `${100 / numbersOfFieldsInRow}%` },
    key
  },
  title,
  onChange: value => onChange(_.set(key, value, object)),
  value: object[key],
  errors: object[key] !== undefined && errors && errors[key],
  placeholder
})
