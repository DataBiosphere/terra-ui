import { CSSProperties, PropsWithChildren } from 'react'


export type InteractiveProps<Tag extends keyof JSX.IntrinsicElements> = PropsWithChildren<{
  as: Tag
  disabled?: boolean
  hover?: Pick<CSSProperties, 'background' | 'backgroundColor' | 'border' | 'color' | 'boxShadow' | 'opacity' | 'textDecoration'>
} & JSX.IntrinsicElements[Tag]>

const Interactive: <Tag>(props: InteractiveProps<Tag>) => JSX.Element

export default Interactive
