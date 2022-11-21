import type { ClickableProps } from 'src/components/common/Clickable'


type LinkProps<T extends keyof JSX.IntrinsicElements> = {
  variant?: 'light'
  baseColor?: () => string
} & ClickableProps<T>

declare const Link: <T extends keyof JSX.IntrinsicElements = 'a'>(props: LinkProps<T>) => JSX.Element

export default Link
