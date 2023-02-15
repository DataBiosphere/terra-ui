import { PropsWithChildren } from 'react'
import { h3, header, span } from 'react-hyperscript-helpers'


type StepHeaderProps = PropsWithChildren<{
  title: React.ReactNode
  style?: React.CSSProperties
}>

export const StepHeader = ({ title, children, style }: StepHeaderProps) => header({ style: { width: '100%', display: 'flex', flexDirection: 'row', ...style } }, [
  h3({ style: { fontSize: 18, marginTop: 0, marginRight: '1rem' } }, [title]),
  span({ style: { fontSize: '1rem', lineHeight: '22px', width: '75%' } }, [children]),
])
