import { CSSProperties } from 'react'
import { div } from 'react-hyperscript-helpers'
import colors from 'src/libs/colors'
import { StepTitle } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepTitle'


function stepBanner(active: boolean): CSSProperties {
  return {
    borderRadius: '8px',
    boxSizing: 'border-box',
    padding: '1.5rem 2rem',
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    border: active ? `1px solid ${colors.accent()}` : `1px solid ${colors.accent(0.2)}`,
    backgroundColor: active ? colors.light(0.5) : colors.light(0.3),
    boxShadow: active ? '0 0 5px 0 rgba(77,114,170,0.5)' : 'none'
  }
}

export interface StepProps {
  isActive: boolean
  title?: string
  introText?: React.ReactNode
  style?: React.CSSProperties
  children?: React.ReactNode[]
}

export const Step = ({ isActive, title, ...props }: StepProps) => div({
  'aria-current': isActive ? 'step' : false,
  style: { ...stepBanner(isActive), ...props.style },
  children: [
    title ? StepTitle({ text: title }) : undefined,
    props.children || []
  ]
})
