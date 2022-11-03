import type { InteractiveProps } from 'src/components/Interactive'


type TagName = keyof JSX.IntrinsicElements

export type ClickableProps<T extends TagName = 'div'> = {
  as?: T
  href?: string
  tooltip?: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  tooltipDelay?: number
  useTooltipAsLabel?: boolean
} & Omit<InteractiveProps<T>, 'as'>

export const Clickable: <T extends TagName>(props: ClickableProps<T>) => JSX.Element

type LinkProps<T extends TagName> = {
  variant?: 'light'
  baseColor?: () => string
} & ClickableProps<T>

export const Link: <T extends TagName = 'a'>(props: LinkProps<T>) => JSX.Element
