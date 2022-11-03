import type { InteractiveProps } from 'src/components/Interactive'


export type ClickableProps<T extends keyof JSX.Element = 'div'> = {
  as?: T
  href?: string
  tooltip?: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  tooltipDelay?: number
  useTooltipAsLabel?: boolean
} & Omit<InteractiveProps<T>, 'as'>

declare const Clickable: <T extends keyof JSX.Element>(props: ClickableProps<T>) => JSX.Element

export default Clickable
