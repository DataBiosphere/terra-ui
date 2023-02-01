import { div, h, h2 } from 'react-hyperscript-helpers'


export interface StepWizardProps {
  title: string
  intro: string
  children?: React.ReactNode
}


export const StepWizard = ({ title, intro, ...props }: StepWizardProps) => {
  return div({ style: { padding: '1.5rem 3rem', width: '100%' } }, [
    h2({ style: { fontWeight: 'bold', fontSize: 18 } }, [title]),
    div({ style: { marginTop: '0.5rem', fontSize: 14, padding: 0, listStyleType: 'none', width: '100%' } }, [intro]),
    h(div, { }, [props.children])
  ])
}

