import { div, h } from 'react-hyperscript-helpers'
import { generateIndividualInputPropsForObjectField, StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'
import { validate } from 'validate.js'


export const ContributorInput = ({ contributor, onChange, wrapperProps }) => {
  const contributorConstraints = {
    email: {
      email: true
    }
  }
  const errors = validate(contributor, contributorConstraints)

  return div(wrapperProps, [
    div({ style: { display: 'flex', width: '100%' } }, [
      h(StringInput, generateIndividualInputPropsForObjectField('Name', 'name', 'Enter a name', contributor, onChange, errors, 2)),
      h(StringInput, generateIndividualInputPropsForObjectField('Email', 'email', 'Enter a contact email', contributor, onChange, errors, 2))
    ])
  ])
}
