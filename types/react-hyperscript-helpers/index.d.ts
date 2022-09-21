/* eslint-disable no-unused-vars */

import type * as React from 'react'


declare module 'react-hyperscript-helpers' {
  type Component<P> = React.FunctionComponent<P> | React.ComponentClass<P>

  type Children<Props> = Props extends { children?: React.ReactNode } ? React.ReactNode[] : (Props extends { children?: unknown } ? [Props['children']] : never)

  interface hHelper {
    <Props extends {}>(
      component: Component<Props>,
      props: Omit<Props, 'children'>,
      children: Children<Props>
    ): React.ReactElement<any, any>;

    <Props extends {}>(
      component: Component<Props>,
      propsOrChildren: Props extends { children?: unknown } ? Props | Children<Props> : Props
    ): React.ReactElement<any, any>;

    <Props extends {}>(component: Component<Props>): React.ReactElement<any, any>;
  }

  export const h: hHelper

  type TagName = keyof JSX.IntrinsicElements

  type HTMLElementProps<T extends TagName> = JSX.IntrinsicElements[T]

  type DataAttributeKey = `data-${string}`

  type WithDataAttributes<T> = T & {
    [dataAttribute: DataAttributeKey]: string;
  }

  type htmlHelper<T extends TagName> = {
    (
      props: Omit<WithDataAttributes<HTMLElementProps<T>>, 'children'>,
      children: React.ReactNode[]
    ): React.ReactElement<any, any>

    (
      propsOrChildren?: WithDataAttributes<HTMLElementProps<T>> | React.ReactNode[]
    ): React.ReactElement<any, any>
  }

  export const a: htmlHelper<'a'>
  export const abbr: htmlHelper<'abbr'>
  export const address: htmlHelper<'address'>
  export const area: htmlHelper<'area'>
  export const article: htmlHelper<'article'>
  export const aside: htmlHelper<'aside'>
  export const audio: htmlHelper<'audio'>
  export const b: htmlHelper<'b'>
  export const base: htmlHelper<'base'>
  export const bdi: htmlHelper<'bdi'>
  export const bdo: htmlHelper<'bdo'>
  export const big: htmlHelper<'big'>
  export const blockquote: htmlHelper<'blockquote'>
  export const body: htmlHelper<'body'>
  export const br: htmlHelper<'br'>
  export const button: htmlHelper<'button'>
  export const canvas: htmlHelper<'canvas'>
  export const caption: htmlHelper<'caption'>
  export const cite: htmlHelper<'cite'>
  export const code: htmlHelper<'code'>
  export const col: htmlHelper<'col'>
  export const colgroup: htmlHelper<'colgroup'>
  export const data: htmlHelper<'data'>
  export const datalist: htmlHelper<'datalist'>
  export const dd: htmlHelper<'dd'>
  export const del: htmlHelper<'del'>
  export const details: htmlHelper<'details'>
  export const dfn: htmlHelper<'dfn'>
  export const dialog: htmlHelper<'dialog'>
  export const div: htmlHelper<'div'>
  export const dl: htmlHelper<'dl'>
  export const dt: htmlHelper<'dt'>
  export const em: htmlHelper<'em'>
  export const embed: htmlHelper<'embed'>
  export const fieldset: htmlHelper<'fieldset'>
  export const figcaption: htmlHelper<'figcaption'>
  export const figure: htmlHelper<'figure'>
  export const footer: htmlHelper<'footer'>
  export const form: htmlHelper<'form'>
  export const h1: htmlHelper<'h1'>
  export const h2: htmlHelper<'h2'>
  export const h3: htmlHelper<'h3'>
  export const h4: htmlHelper<'h4'>
  export const h5: htmlHelper<'h5'>
  export const h6: htmlHelper<'h6'>
  export const head: htmlHelper<'head'>
  export const header: htmlHelper<'header'>
  export const hgroup: htmlHelper<'hgroup'>
  export const hr: htmlHelper<'hr'>
  export const html: htmlHelper<'html'>
  export const i: htmlHelper<'i'>
  export const iframe: htmlHelper<'iframe'>
  export const img: htmlHelper<'img'>
  export const input: htmlHelper<'input'>
  export const ins: htmlHelper<'ins'>
  export const kbd: htmlHelper<'kbd'>
  export const keygen: htmlHelper<'keygen'>
  export const label: htmlHelper<'label'>
  export const legend: htmlHelper<'legend'>
  export const li: htmlHelper<'li'>
  export const link: htmlHelper<'link'>
  export const main: htmlHelper<'main'>
  export const map: htmlHelper<'map'>
  export const mark: htmlHelper<'mark'>
  export const menu: htmlHelper<'menu'>
  export const menuitem: htmlHelper<'menuitem'>
  export const meta: htmlHelper<'meta'>
  export const meter: htmlHelper<'meter'>
  export const nav: htmlHelper<'nav'>
  export const noscript: htmlHelper<'noscript'>
  export const object: htmlHelper<'object'>
  export const ol: htmlHelper<'ol'>
  export const optgroup: htmlHelper<'optgroup'>
  export const option: htmlHelper<'option'>
  export const output: htmlHelper<'output'>
  export const p: htmlHelper<'p'>
  export const param: htmlHelper<'param'>
  export const picture: htmlHelper<'picture'>
  export const pre: htmlHelper<'pre'>
  export const progress: htmlHelper<'progress'>
  export const q: htmlHelper<'q'>
  export const rp: htmlHelper<'rp'>
  export const rt: htmlHelper<'rt'>
  export const ruby: htmlHelper<'ruby'>
  export const s: htmlHelper<'s'>
  export const samp: htmlHelper<'samp'>
  export const script: htmlHelper<'script'>
  export const section: htmlHelper<'section'>
  export const select: htmlHelper<'select'>
  export const small: htmlHelper<'small'>
  export const source: htmlHelper<'source'>
  export const span: htmlHelper<'span'>
  export const strong: htmlHelper<'strong'>
  export const style: htmlHelper<'style'>
  export const sub: htmlHelper<'sub'>
  export const summary: htmlHelper<'summary'>
  export const sup: htmlHelper<'sup'>
  export const table: htmlHelper<'table'>
  export const tbody: htmlHelper<'tbody'>
  export const td: htmlHelper<'td'>
  export const textarea: htmlHelper<'textarea'>
  export const tfoot: htmlHelper<'tfoot'>
  export const th: htmlHelper<'th'>
  export const thead: htmlHelper<'thead'>
  export const time: htmlHelper<'time'>
  export const title: htmlHelper<'title'>
  export const tr: htmlHelper<'tr'>
  export const track: htmlHelper<'track'>
  export const u: htmlHelper<'u'>
  export const ul: htmlHelper<'ul'>
  export const video: htmlHelper<'video'>
  export const wbr: htmlHelper<'wbr'>

  export const circle: htmlHelper<'circle'>
  export const clipPath: htmlHelper<'clipPath'>
  export const defs: htmlHelper<'defs'>
  export const ellipse: htmlHelper<'ellipse'>
  export const g: htmlHelper<'g'>
  export const image: htmlHelper<'image'>
  export const line: htmlHelper<'line'>
  export const linearGradient: htmlHelper<'linearGradient'>
  export const mask: htmlHelper<'mask'>
  export const path: htmlHelper<'path'>
  export const pattern: htmlHelper<'pattern'>
  export const polygon: htmlHelper<'polygon'>
  export const polyline: htmlHelper<'polyline'>
  export const radialGradient: htmlHelper<'radialGradient'>
  export const rect: htmlHelper<'rect'>
  export const stop: htmlHelper<'stop'>
  export const svg: htmlHelper<'svg'>
  export const text: htmlHelper<'text'>
  export const tspan: htmlHelper<'tspan'>
}
