/* eslint-disable no-unused-vars */

import type * as React from 'react'


declare module 'react-hyperscript-helpers' {
  type Component<P> = React.FunctionComponent<P> | React.ComponentClass<P>

  type Children<Props> = Props extends { children?: React.ReactNode } ? React.ReactNode[] : (Props extends { children?: unknown } ? [Props['children']] : never)

  type Key = string | number

  type WithKey<P> = P & { key?: Key | null | undefined }

  interface HHelper {
    <Props extends {}>(
      component: Component<Props>,
      props: WithKey<Omit<Props, 'children'>>,
      children: Children<Props>
    ): React.ReactElement<any, any>

    <Props extends {}>(
      component: Component<Props>,
      propsOrChildren: Props extends { children?: unknown } ? WithKey<Props> | Children<Props> : WithKey<Props>
    ): React.ReactElement<any, any>

    <Props extends {}>(component: Component<Props>): React.ReactElement<any, any>
  }

  export const h: HHelper

  type TagName = keyof JSX.IntrinsicElements

  type HTMLElementProps<T extends TagName> = JSX.IntrinsicElements[T]

  type DataAttributeKey = `data-${string}`

  type WithDataAttributes<T> = T & {
    [dataAttribute: DataAttributeKey]: string
  }

  type HtmlHelper<T extends TagName> = {
    (
      props: Omit<WithDataAttributes<HTMLElementProps<T>>, 'children'>,
      children: React.ReactNode[]
    ): React.ReactElement<any, any>

    (
      propsOrChildren?: WithDataAttributes<HTMLElementProps<T>> | React.ReactNode[]
    ): React.ReactElement<any, any>
  }

  export const a: HtmlHelper<'a'>
  export const abbr: HtmlHelper<'abbr'>
  export const address: HtmlHelper<'address'>
  export const area: HtmlHelper<'area'>
  export const article: HtmlHelper<'article'>
  export const aside: HtmlHelper<'aside'>
  export const audio: HtmlHelper<'audio'>
  export const b: HtmlHelper<'b'>
  export const base: HtmlHelper<'base'>
  export const bdi: HtmlHelper<'bdi'>
  export const bdo: HtmlHelper<'bdo'>
  export const big: HtmlHelper<'big'>
  export const blockquote: HtmlHelper<'blockquote'>
  export const body: HtmlHelper<'body'>
  export const br: HtmlHelper<'br'>
  export const button: HtmlHelper<'button'>
  export const canvas: HtmlHelper<'canvas'>
  export const caption: HtmlHelper<'caption'>
  export const cite: HtmlHelper<'cite'>
  export const code: HtmlHelper<'code'>
  export const col: HtmlHelper<'col'>
  export const colgroup: HtmlHelper<'colgroup'>
  export const data: HtmlHelper<'data'>
  export const datalist: HtmlHelper<'datalist'>
  export const dd: HtmlHelper<'dd'>
  export const del: HtmlHelper<'del'>
  export const details: HtmlHelper<'details'>
  export const dfn: HtmlHelper<'dfn'>
  export const dialog: HtmlHelper<'dialog'>
  export const div: HtmlHelper<'div'>
  export const dl: HtmlHelper<'dl'>
  export const dt: HtmlHelper<'dt'>
  export const em: HtmlHelper<'em'>
  export const embed: HtmlHelper<'embed'>
  export const fieldset: HtmlHelper<'fieldset'>
  export const figcaption: HtmlHelper<'figcaption'>
  export const figure: HtmlHelper<'figure'>
  export const footer: HtmlHelper<'footer'>
  export const form: HtmlHelper<'form'>
  export const h1: HtmlHelper<'h1'>
  export const h2: HtmlHelper<'h2'>
  export const h3: HtmlHelper<'h3'>
  export const h4: HtmlHelper<'h4'>
  export const h5: HtmlHelper<'h5'>
  export const h6: HtmlHelper<'h6'>
  export const head: HtmlHelper<'head'>
  export const header: HtmlHelper<'header'>
  export const hgroup: HtmlHelper<'hgroup'>
  export const hr: HtmlHelper<'hr'>
  export const html: HtmlHelper<'html'>
  export const i: HtmlHelper<'i'>
  export const iframe: HtmlHelper<'iframe'>
  export const img: HtmlHelper<'img'>
  export const input: HtmlHelper<'input'>
  export const ins: HtmlHelper<'ins'>
  export const kbd: HtmlHelper<'kbd'>
  export const keygen: HtmlHelper<'keygen'>
  export const label: HtmlHelper<'label'>
  export const legend: HtmlHelper<'legend'>
  export const li: HtmlHelper<'li'>
  export const link: HtmlHelper<'link'>
  export const main: HtmlHelper<'main'>
  export const map: HtmlHelper<'map'>
  export const mark: HtmlHelper<'mark'>
  export const menu: HtmlHelper<'menu'>
  export const menuitem: HtmlHelper<'menuitem'>
  export const meta: HtmlHelper<'meta'>
  export const meter: HtmlHelper<'meter'>
  export const nav: HtmlHelper<'nav'>
  export const noscript: HtmlHelper<'noscript'>
  export const object: HtmlHelper<'object'>
  export const ol: HtmlHelper<'ol'>
  export const optgroup: HtmlHelper<'optgroup'>
  export const option: HtmlHelper<'option'>
  export const output: HtmlHelper<'output'>
  export const p: HtmlHelper<'p'>
  export const param: HtmlHelper<'param'>
  export const picture: HtmlHelper<'picture'>
  export const pre: HtmlHelper<'pre'>
  export const progress: HtmlHelper<'progress'>
  export const q: HtmlHelper<'q'>
  export const rp: HtmlHelper<'rp'>
  export const rt: HtmlHelper<'rt'>
  export const ruby: HtmlHelper<'ruby'>
  export const s: HtmlHelper<'s'>
  export const samp: HtmlHelper<'samp'>
  export const script: HtmlHelper<'script'>
  export const section: HtmlHelper<'section'>
  export const select: HtmlHelper<'select'>
  export const small: HtmlHelper<'small'>
  export const source: HtmlHelper<'source'>
  export const span: HtmlHelper<'span'>
  export const strong: HtmlHelper<'strong'>
  export const style: HtmlHelper<'style'>
  export const sub: HtmlHelper<'sub'>
  export const summary: HtmlHelper<'summary'>
  export const sup: HtmlHelper<'sup'>
  export const table: HtmlHelper<'table'>
  export const tbody: HtmlHelper<'tbody'>
  export const td: HtmlHelper<'td'>
  export const textarea: HtmlHelper<'textarea'>
  export const tfoot: HtmlHelper<'tfoot'>
  export const th: HtmlHelper<'th'>
  export const thead: HtmlHelper<'thead'>
  export const time: HtmlHelper<'time'>
  export const title: HtmlHelper<'title'>
  export const tr: HtmlHelper<'tr'>
  export const track: HtmlHelper<'track'>
  export const u: HtmlHelper<'u'>
  export const ul: HtmlHelper<'ul'>
  export const video: HtmlHelper<'video'>
  export const wbr: HtmlHelper<'wbr'>

  export const circle: HtmlHelper<'circle'>
  export const clipPath: HtmlHelper<'clipPath'>
  export const defs: HtmlHelper<'defs'>
  export const ellipse: HtmlHelper<'ellipse'>
  export const g: HtmlHelper<'g'>
  export const image: HtmlHelper<'image'>
  export const line: HtmlHelper<'line'>
  export const linearGradient: HtmlHelper<'linearGradient'>
  export const mask: HtmlHelper<'mask'>
  export const path: HtmlHelper<'path'>
  export const pattern: HtmlHelper<'pattern'>
  export const polygon: HtmlHelper<'polygon'>
  export const polyline: HtmlHelper<'polyline'>
  export const radialGradient: HtmlHelper<'radialGradient'>
  export const rect: HtmlHelper<'rect'>
  export const stop: HtmlHelper<'stop'>
  export const svg: HtmlHelper<'svg'>
  export const text: HtmlHelper<'text'>
  export const tspan: HtmlHelper<'tspan'>
}

