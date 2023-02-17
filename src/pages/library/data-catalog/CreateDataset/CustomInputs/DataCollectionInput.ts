import * as _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { DataCollection } from 'src/libs/ajax/Catalog'
import { FormLabel } from 'src/libs/forms'
import {
  generateIndividualInputPropsForObjectField,
  StringInput
} from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


interface DataCollectionInputProps {
  title?: string
  dataCollection: DataCollection
  onChange: (value: DataCollection) => void
  wrapperProps?: any
}

export const DataCollectionInput = ({ title = undefined, dataCollection, onChange, wrapperProps }: DataCollectionInputProps) => {
  return div(wrapperProps, [
    title && h(FormLabel, [title]),
    div({ style: { display: 'flex', width: '100%' } }, _.map(
      field => h(StringInput, generateIndividualInputPropsForObjectField(
        field.title,
        field.key,
        field.placeholder,
        dataCollection,
        onChange,
        undefined,
        7
      )), [
        { title: 'Identifier', key: 'dct:identifier', placeholder: 'Enter a short identifier' },
        { title: 'Title', key: 'dct:title', placeholder: 'Enter the full title' },
        { title: 'Description', key: 'dct:description', placeholder: 'Enter a description' },
        { title: 'Creator', key: 'dct:creator', placeholder: 'Enter the creator' },
        { title: 'Publisher', key: 'dct:publisher', placeholder: 'Enter a publisher' },
        { title: 'Issued', key: 'dct:issued', placeholder: 'Enter  issued time' },
        { title: 'Modified', key: 'dct:modified', placeholder: 'Enter last modified time' }
      ])
    )
  ])
}
