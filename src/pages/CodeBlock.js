import Prism from 'prismjs'
import { useLayoutEffect, useRef } from 'react'
import * as hyperscript from 'react-hyperscript-helpers'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import * as Utils from 'src/libs/utils'


const { div, h, code, pre } = hyperscript

export const Playground = Utils.forwardRefWithName('Playground', ({ children }, ref) => {
  return div({ ref, className: 'language-js', style: { marginTop: '40px' } }, [
    h(LiveProvider, { scope: { ...hyperscript }, code: children }, [
      h(LiveEditor),
      h(LivePreview),
      h(LiveError)
    ])
  ])
})

export const CodeBlock = ({ children, live = false, style }) => {
  const elem = useRef()
  useLayoutEffect(() => {
    elem?.current && Prism.highlightElement(elem.current)
  }, [elem])

  return pre({ className: 'line-numbers', style: { ...style, padding: '20px' } }, [
    live ? h(Playground, children) : code({ ref: elem, className: 'language-js' }, children)
  ])
}
