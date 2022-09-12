import * as hs from 'react-hyperscript-helpers'
import { ComponentProps, HTMLAttributes, ReactElement, ReactNode } from 'react'


/*
 * This module is a wrapper around react-hyperscript-helpers to provide better type safety
 * on custom and intrinsic components, their props, and related h-helper method overloads.
 * - To start using these versions of h or the intrinsic helpers like div, span, etc., import them
 *   from this module instead of react-hyper-script-helpers lib module.

 */

type ReactComponent<P> = React.ComponentType<P>

// force children to be an array.  'simple string' child will have to be ['simple string']
// this avoids unintended usage which works, but results in arrayLike conversion to
// ['s', 'i', 'm', 'p', 'l', 'e, ...]
type Children = ReactNode[]
type ChildrenProps = { children?: Children }

type HHelper = {
  (_tag: string, _children?: Children): ReactElement;
  (_tag: string, _selector: string, _children?: Children): ReactElement;
  <T extends string>(_tag: T, _selector: string, _properties: HTMLAttributes<T>, _children?: Children): ReactElement;
  <T extends string>(_tag: T, _properties: HTMLAttributes<T>, _children?: Children): ReactElement;
  (_component: ReactComponent<ChildrenProps>, _children?: Children): ReactElement;
  (_component: ReactComponent<ChildrenProps>, _selector: string, _children?: Children): ReactElement;
  <P>(_component: ReactComponent<P>, _selector: string, _properties: Omit<P, 'children'>, _children?: Children): ReactElement;
  <P>(_component: ReactComponent<P>, _properties: Omit<P, 'children'>, _children?: Children): ReactElement;
}

type DataAttributeKey = `data-${string}`

/**
 * Augments a JSX.IntrinsicElement type to allow data-xxxx attributes to be included
 * - i.e const myProps: WithDataAttributes<'div'> = {id: '123', 'data-xyz': 7}
 */
type WithDataAttributes<T extends keyof JSX.IntrinsicElements> = ComponentProps<T> & {
  [dataAttribute: DataAttributeKey]: unknown;
}

/**
 * Improved types for Hyperscript-Helper intrinsic html tag fns.
 * - Uses JSX.IntrinsicElements[tagName], but React.Component<tagName>,
 *   React.ComponentWithRef<tagName> or React.ComponentWithoutRef<tagName>
 *   can also be useful for similar type needs.
 */
type HTag<T extends keyof JSX.IntrinsicElements> = {
  (_children?: Children): ReactElement;
  (_selector: string, _children?: Children): ReactElement;
  (_selector: string, _properties: Omit<WithDataAttributes<T>, 'children'>, _children?: Children): ReactElement;
  (_properties: Omit<WithDataAttributes<T>, 'children'>, _children?: Children): ReactElement;
}

export const h = hs.h as HHelper

// add more intrinsic element helpers to this list as needed.

export const a = hs.a as HTag<'a'>
export const br = hs.br as HTag<'br'>
export const div = hs.div as HTag<'div'>
export const h1 = hs.h1 as HTag<'h1'>
export const h2 = hs.h2 as HTag<'h2'>
export const h3 = hs.h3 as HTag<'h3'>
export const h4 = hs.h4 as HTag<'h4'>
export const h5 = hs.h5 as HTag<'h5'>
export const h6 = hs.h6 as HTag<'h6'>
export const hr = hs.hr as HTag<'hr'>
export const iframe = hs.iframe as HTag<'iframe'>
export const img = hs.img as HTag<'img'>
export const input = hs.input as HTag<'input'>
export const li = hs.li as HTag<'li'>
export const p = hs.p as HTag<'p'>
export const span = hs.span as HTag<'span'>
export const svg = hs.svg as HTag<'svg'>
export const ul = hs.ul as HTag<'ul'>
