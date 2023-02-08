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
    div({ style: { display: 'flex', width: '100%' } }, [
      h(StringInput, generateIndividualInputPropsForObjectField('Identifier', 'dct:identifier', 'Enter a short identifier', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('Title', 'dct:title', 'Enter the full title', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('Description', 'dct:description', 'Enter a description', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('Creator', 'dct:creator', 'Enter the creator', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('Publisher', 'dct:publisher', 'Enter the publisher', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('Issued', 'dct:issued', 'Enter  issued time', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('Modified', 'dct:modified', 'Enter last modified time', dataCollection, onChange, undefined, 7))
    ])
  ])
}
