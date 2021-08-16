import { useState } from 'react'
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
