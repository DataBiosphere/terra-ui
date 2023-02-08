import { div, h } from 'react-hyperscript-helpers'
import { FormLabel } from 'src/libs/forms'
import {
  generateIndividualInputPropsForObjectField,
  StringInput
} from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


export const DataCollectionInput = ({ title = undefined, dataCollection, onChange, wrapperProps }) => {
  return div(wrapperProps, [
    title && h(FormLabel, [title]),
    div({ style: { display: 'flex', width: '100%' } }, [
      h(StringInput, generateIndividualInputPropsForObjectField('dct:identifier', 'Identifier', 'Enter a short identifier', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('dct:title', 'Title', 'Enter the full title', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('dct:description', 'Description', 'Enter a description', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('dct:creator', 'Creator', 'Enter the creator', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('dct:publisher', 'Publisher', 'Enter the publisher', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('dct:issued', 'Issued', 'Enter  issued time', dataCollection, onChange, undefined, 7)),
      h(StringInput, generateIndividualInputPropsForObjectField('dct:modified', 'Modified', 'Enter last modified time', dataCollection, onChange, undefined, 7))
    ])
  ])
}
