import { CSSProperties, ReactNode } from 'react'
import { fieldset, legend } from 'react-hyperscript-helpers'


export const StepFields = ({ children, style }: { children: ReactNode[]; style?: CSSProperties }) => fieldset(
  {
    style: {
      border: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'center',
      ...style
    }
  },
  [children]
)

export const StepFieldLegend = ({ children }: { children: React.ReactNode[] }) => legend({
  style: {
    fontSize: 14,
    lineHeight: '22px',
    whiteSpace: 'pre-wrap',
    marginTop: '0.25rem',
    float: 'left'
  }
}, children)
