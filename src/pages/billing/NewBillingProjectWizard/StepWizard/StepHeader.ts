import { h3, header, span } from 'react-hyperscript-helpers'


interface StepHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode[]
  styles?: React.CSSProperties
}

export const StepHeader = ({ title, description = [], ...props }: StepHeaderProps) => header({
  style: { width: '100%', display: 'flex', flexDirection: 'row', ...props.styles }, children: [
    h3({ style: { fontSize: 18, marginTop: 0, marginRight: '1rem' } }, [title]),
    span({ style: { fontSize: '1rem', lineHeight: '22px', whiteSpace: 'pre-wrap', width: '75%' } }, description),
  ]
})
