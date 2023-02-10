import { CSSProperties, ReactNode } from 'react'
import { div, fieldset, form, h, legend } from 'react-hyperscript-helpers'
import { FormLabel } from 'src/libs/forms'


interface StepFieldsProps {
  children?: ReactNode[]
  style?: CSSProperties
}

export const StepFields = ({ children = [], style, disabled = false }: StepFieldsProps & { disabled?: boolean }) => fieldset({
  disabled,
  style: {
    border: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    width: '100%',
    ...style
  }
}, [children])

export const StepFieldLegend = ({ children = [], style }: StepFieldsProps) => legend({
  style: {
    fontSize: '1rem',
    lineHeight: '22px',
    whiteSpace: 'pre-wrap',
    marginTop: '0.25rem',
    marginRight: '1rem',
    float: 'left',
    ...style
  }
}, children)

export const StepFieldForm = ({ children = [], style }: StepFieldsProps) => form({
  style: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...style
  }
}, children)

interface LabeledFieldProps extends StepFieldsProps {
  formId: string
  label: ReactNode
  required?: boolean
}

export const LabeledField = ({ label, formId, required = false, children = [], style }: LabeledFieldProps) => div({ style: { display: 'flex', flexDirection: 'column', ...style } }, [
  h(FormLabel, { htmlFor: formId, required }, [label]),
  children
])
