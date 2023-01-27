import { h3 } from 'react-hyperscript-helpers'


export const StepTitle = ({ text } : { text: string }) => h3({ style: { fontSize: 18, marginTop: 0 } }, [text])
