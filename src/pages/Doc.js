/* eslint-disable import/no-webpack-loader-syntax */
// import ButtonBar from '!babel-loader!@mdx-js/loader!../Components/ButtonBar.mdx'
import { MDXProvider } from '@mdx-js/react'
import { div, h, pre } from 'react-hyperscript-helpers'

import Content from '!babel-loader!@mdx-js/loader!./Content.mdx'


const Doc = () => {
  return div({ style: { display: 'flex', width: '100%' } }, [
    div({ style: { width: '10rem' } }, ['Menu']),
    div({ style: { width: '100%' } }, [h(Content)])
  ])
}

const Provider = props => {
  return h(MDXProvider, [h(Doc)])
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
