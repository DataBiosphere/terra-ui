import { div, h, h2 } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import TopBar from 'src/components/TopBar'


const NotFound = () => {
  return h(FooterWrapper, [
    h(TopBar),
    div({ role: 'main', style: { marginLeft: '1rem', flex: '1 0 auto' } }, [
      h2('Page not found')
    ])
  ])
}

export const navPaths = [
  {
    name: 'not-found',
    path: '/(.*)',
    component: NotFound,
    public: true
  }
]
