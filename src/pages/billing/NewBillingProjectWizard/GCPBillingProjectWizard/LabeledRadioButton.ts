import { div, HTMLElementProps } from 'react-hyperscript-helpers'
import { RadioButton } from 'src/components/common'
import { styles } from 'src/pages/billing/NewBillingProjectWizard/GCPBillingProjectWizard/GCPBillingProjectWizard'


interface LabeledProps extends HTMLElementProps<'input'> {
  text: string
  name: string
  labelStyle?: React.CSSProperties
  style?: React.CSSProperties
}

export const LabeledRadioButton = ({ text, name, labelStyle, style, ...props }: LabeledProps) => div(
  { style: { display: 'flex', flexDirection: 'row', ...style } }, [
    RadioButton({
      text,
      name,
      labelStyle: { ...styles.radioButtonLabel, ...labelStyle },
      ...props
    })
  ]
)

