import { h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { libraryTopMatter } from 'src/components/library-common'

const DataBrowser = () => {
  return h(FooterWrapper, { alwaysShow: true }, [
      libraryTopMatter('browse & explore')
  ])
}

export const navPaths = [{
    name: 'library-browser',
    path: '/library/browser',
    component: DataBrowser,
    title: 'Browse & Explore'
}]
