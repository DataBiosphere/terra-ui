import 'prismjs/themes/prism.css'

import theme from 'prism-react-renderer/themes/vsDark'
import Prism from 'prismjs'
import react, { useLayoutEffect, useRef } from 'react'
import * as hyperscript from 'react-hyperscript-helpers'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import * as Utils from 'src/libs/utils'


const { div, h, code, pre } = hyperscript

export const Playground = Utils.forwardRefWithName('Playground', ({ scopes, children }, ref) => {
  return div({ className: 'language-js' }, [
    h(LiveProvider, { noInline: false, theme, scope: { ...scopes, ...hyperscript, ...react }, code: children }, [
      h(LiveEditor),
      h(LivePreview),
      h(LiveError)
    ])
  ])
})

export const CodeBlock = ({ children, live = false, style, scopes }) => {
  const elem = useRef()
  useLayoutEffect(() => {
    elem?.current && Prism.highlightAll(elem.current)
  }, [elem])

  return live ? h(Playground, { scopes }, children) :
    pre({ className: 'line-numbers', style: { ...style, border: '1px solid black' } }, [
      code({ ref: elem, className: 'language-js' }, children)
    ])
}
