/* eslint-disable import/no-webpack-loader-syntax */
// import ButtonBar from '!babel-loader!@mdx-js/loader!../Components/ButtonBar.mdx'
import { MDXProvider } from '@mdx-js/react'
import { div, h, pre } from 'react-hyperscript-helpers'
import { CodeBlock, Playground } from 'src/pages/CodeBlock'

import Content from '!babel-loader!@mdx-js/loader!./Content.mdx'


const components = {
  pre: props => div(props, ['Stuff'])
}

const Doc = () => {
  return div([
    h(Content),
    h(CodeBlock, ['console.log(\'test\')']),
    h(Playground, [`      
    () => div(['hello', div(['world'])])`])
  ])
}

const Provider = props => {
  return pre({ className: 'line-numbers' }, [
    h(MDXProvider, { className: '', components }, [
      h(Doc, { })
    ])
  ])
}

export const navPaths = [
  {
    name: 'doc',
    path: '/doc',
    component: Provider,
    title: 'Docs',
    public: true
  }
]

export default Provider
