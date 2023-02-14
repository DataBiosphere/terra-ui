import { h3, header, span } from 'react-hyperscript-helpers'


interface StepHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode[]
  styles?: React.CSSProperties
}

export const StepHeader = ({ title, children = [], ...props }: StepHeaderProps) => header({ style: { width: '100%', display: 'flex', flexDirection: 'row', ...props.styles } }, [
  h3({ style: { fontSize: 18, marginTop: 0, marginRight: '1rem' } }, [title]),
  span({ style: { fontSize: '1rem', lineHeight: '22px', width: '75%' } }, [children]),
]
)
