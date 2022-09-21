import type * as React from 'react'


declare module 'react-hyperscript-helpers' {
  type Component<P> = React.FunctionComponent<P> | React.ComponentClass<P>
  type ComponentOrTag<P> = Component<P> | string
  type Props<P> = React.Attributes & P | null
  type Children = React.ReactNode[]

  export function h<P extends {}>(type: ComponentOrTag<P>, selector: string, props: Props<P>, children: Children): React.ReactElement<P>
  export function h<P extends {}>(type: ComponentOrTag<P>, selectorOrProps: string | Props<P>, children: Children): React.ReactElement<P>
  export function h<P extends {}>(type: ComponentOrTag<P>, selectorOrPropsOrChildren?: string | Props<P> | Children): React.ReactElement<P>

  interface htmlHelper<AttributesType extends React.HTMLAttributes<ElementType>, ElementType extends HTMLElement> {
    (selector: string, props: React.DetailedHTMLProps<AttributesType, ElementType>, children: Children): React.DetailedReactHTMLElement<AttributesType, ElementType>
    (selectorOrProps: string | React.DetailedHTMLProps<AttributesType, ElementType>, children: Children): React.DetailedReactHTMLElement<AttributesType, ElementType>
    (selectorOrPropsOrChildren?: string | React.DetailedHTMLProps<AttributesType, ElementType> | Children): React.DetailedReactHTMLElement<AttributesType, ElementType>
  }

  type SVGElementProps = ClassAttributes<SVGElement> & SVGAttributes<SVGElement> | null

  interface svgHelper {
    (selector: string, props: SVGElementProps, children: Children): React.ReactSVGElement
    (selectorOrProps: string | SVGElementProps, children: Children): React.ReactSVGElement
    (selectorOrPropsOrChildren?: string | SVGElementProps | Children): React.ReactSVGElement
  }

  // TODO: Use more specific attribute/element types
  export const a: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const abbr: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const address: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const area: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const article: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const aside: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const audio: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const b: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const base: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const bdi: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const bdo: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const big: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const blockquote: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const body: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const br: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const button: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const canvas: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const caption: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const cite: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const code: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const col: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const colgroup: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const data: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const datalist: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const dd: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const del: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const details: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const dfn: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const dialog: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const div: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const dl: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const dt: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const em: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const embed: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const fieldset: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const figcaption: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const figure: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const footer: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const form: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const h1: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const h2: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const h3: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const h4: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const h5: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const h6: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const head: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const header: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const hgroup: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const hr: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const html: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const i: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const iframe: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const img: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const input: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const ins: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const kbd: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const keygen: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const label: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const legend: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const li: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const link: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const main: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const map: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const mark: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const menu: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const menuitem: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const meta: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const meter: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const nav: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const noscript: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const object: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const ol: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const optgroup: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const option: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const output: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const p: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const param: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const picture: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const pre: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const progress: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const q: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const rp: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const rt: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const ruby: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const s: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const samp: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const script: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const section: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const select: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const small: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const source: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const span: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const strong: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const style: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const sub: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const summary: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const sup: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const table: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const tbody: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const td: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const textarea: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const tfoot: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const th: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const thead: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const time: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const title: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const tr: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const track: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const u: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const ul: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const video: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>
  export const wbr: htmlHelper<React.HTMLAttributes<HTMLElement>, HTMLElement>

  export const circle: svgHelper
  export const clipPath: svgHelper
  export const defs: svgHelper
  export const ellipse: svgHelper
  export const g: svgHelper
  export const image: svgHelper
  export const line: svgHelper
  export const linearGradient: svgHelper
  export const mask: svgHelper
  export const path: svgHelper
  export const pattern: svgHelper
  export const polygon: svgHelper
  export const polyline: svgHelper
  export const radialGradient: svgHelper
  export const rect: svgHelper
  export const stop: svgHelper
  export const svg: svgHelper
  export const text: svgHelper
  export const tspan: svgHelper
}
