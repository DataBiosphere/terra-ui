import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { libraryTopMatter } from 'src/components/library-common'
import * as StateHistory from 'src/libs/state-history'
import { SearchAndFilterComponent } from 'src/pages/library/common'


// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sidebarSections = [{
  name: 'Test',
  labels: ['test1', 'test2'],
  keepCollapsed: true
}]


const DataBrowser = () => {
  const featuredList = [{
    namespace: 'test-test',
    name: 'test1',
    created: '2020-01-13T18:25:28.340Z',
    tags: {
      itemsType: 'AttributeValue',
      items: [
        'test1'
      ]
    },
    description: 'test desc',
    lowerName: 'test1',
    lowerDescription: 'test desc',

    keepCollapsed: true
  }]

  const [workspacesByTag, setWorkspacesByTag] = useState({})
  const [sections, setSections] = useState([])

  return SearchAndFilterComponent(featuredList, workspacesByTag, sections, sidebarSections)
}

export const navPaths = [{
  name: 'library-browser',
  path: '/library/browser',
  component: DataBrowser,
  title: 'Browse & Explore'
}]
