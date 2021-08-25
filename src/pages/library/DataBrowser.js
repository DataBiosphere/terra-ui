import { SearchAndFilterComponent } from 'src/pages/library/common'


// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sidebarSections = [{
  name: 'Test',
  labels: ['test1', 'test2']
}]


const DataBrowser = () => {
  const featuredList = [
    {
      namespace: 'test-test',
      name: 'this is a really really long name that should wrap onto another line',
      created: '2020-01-13T18:25:28.340Z',
      lastUpdated: '2020-01-13T18:25:28.340Z',
      tags: {
        itemsType: 'AttributeValue',
        items: ['test1']
      },
      description: 'test desc',
      lowerName: 'test1',
      lowerDescription: 'test desc',
      project: {
        id: '112',
        name: 'NIH'
      },
      subjects: 123,
      dataType: 'RNA Seq',
      keepCollapsed: true,
      locked: true
    },
    {
      namespace: 'harry-potter',
      name: 'Harry Potter',
      created: '2020-01-13T18:25:28.340Z',
      lastUpdated: '2020-01-13T18:25:28.340Z',
      tags: {
        itemsType: 'AttributeValue',
        items: ['wizarding']
      },
      description: 'The boy who lived',
      lowerName: 'harry potter',
      lowerDescription: 'lower description',
      project: {
        id: '112',
        name: 'NIH'
      },
      subjects: 10,
      dataType: 'RNA Seq',
      keepCollapsed: true,
      locked: false
    }
  ]

  return SearchAndFilterComponent(featuredList, sidebarSections, 'browse & explore', 'datasets')
}

export const navPaths = [{
  name: 'library-browser',
  path: '/library/browser',
  component: DataBrowser,
  title: 'Browse & Explore'
}]
