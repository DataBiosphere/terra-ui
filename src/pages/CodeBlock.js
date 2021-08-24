import Prism from 'prismjs'
import { useLayoutEffect, useRef } from 'react'
import react from 'react'
import * as hyperscript from 'react-hyperscript-helpers'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import * as Utils from 'src/libs/utils'


console.log(react)
const { div, h, code, pre } = hyperscript

export const Playground = Utils.forwardRefWithName('Playground', ({ scopes, children }, ref) => {
  try {
    return div({ ref, className: 'language-js', style: { } }, [
      h(LiveProvider, { noInline: true, scope: { ...scopes, ...hyperscript, ...react }, code: children }, [
        h(LiveEditor),
        h(LivePreview),
        h(LiveError)
      ])
    ])
  } catch (e) {
    console.log('Error')
    return div()
  }
})

export const CodeBlock = ({ children, live = false, style, scopes }) => {
  const elem = useRef()
  useLayoutEffect(() => {
    elem?.current && Prism.highlightAll(elem.current)
  }, [elem])

  return live ? h(Playground, { scopes }, children) :
    pre({ className: 'line-numbers', style: { ...style, border: '1px solid black', padding: 10 } }, [
      code({ ref: elem, className: 'language-js' }, children)
    ])
}
