import 'prismjs/themes/prism.css'

import theme from 'prism-react-renderer/themes/vsDark'
import Prism from 'prismjs'
import react, { useLayoutEffect, useRef } from 'react'
import * as hyperscript from 'react-hyperscript-helpers'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import * as Utils from 'src/libs/utils'


const { div, h, code, pre } = hyperscript

const ConsoleArea = Utils.forwardRefWithName('ConsoleArea', ({ style }, ref) => {
  return div({ ref, style: { border: '1px solid black', padding: '1rem', height: '3rem', ...style } })
})

export const Playground = Utils.forwardRefWithName('Playground', ({ scopes, children }, ref) => {
  const elem = useRef()
  const overrides = {
    console: { log: (...args) => elem.current.textContent = args }
  }

  return div({ className: 'language-js' }, [
    h(LiveProvider, { noInline: false, theme, scope: { ...overrides, ...scopes, ...hyperscript, ...react }, code: children }, [
      div({ style: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' } }, [
        h(LiveEditor),
        h(LivePreview),
        h(ConsoleArea, { ref: elem }),
        h(LiveError)
      ])
    ])
  ])
})

export const CodeBlock = ({ children, live = false, style, scopes }) => {
  const elem = useRef()
  useLayoutEffect(() => {
    elem?.current && Prism.highlightAll(elem.current)
  }, [elem])

  return div({ style: { width: '90%' } }, [
    live ? h(Playground, { scopes }, children) :
      pre({ className: 'line-numbers', style: { ...style, border: '1px solid black' } }, [
        code({ ref: elem, className: 'language-js' }, children)
      ])
  ])
}
