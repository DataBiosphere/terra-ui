import { div, h } from 'react-hyperscript-helpers'
import { FormLabel } from 'src/libs/forms'
import {
  CatalogNumberInput,
  generateIndividualInputPropsForObjectField
} from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


export const CountsInput = ({ title, wrapperProps = {}, onChange, counts }) => {
  return div(wrapperProps, [
    title && h(FormLabel, [title]),
    div({ style: { display: 'flex', width: '100%' } }, [
      h(CatalogNumberInput, generateIndividualInputPropsForObjectField('Donors', 'donors', undefined, counts, onChange, undefined, 3)),
      h(CatalogNumberInput, generateIndividualInputPropsForObjectField('Samples', 'samples', undefined, counts, onChange, undefined, 3)),
      h(CatalogNumberInput, generateIndividualInputPropsForObjectField('Files', 'files', undefined, counts, onChange, undefined, 3))
    ])
  ])
}
