import { Fragment } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'


const activeTab = 'browse & explore'
const styles = {
  page: { padding: 20, marginTop: 15 }
}

const getSnapshot = id => {
  return {
    namespace: 'harry-potter',
    name: 'Harry Potter',
    created: '2020-01-07T18:25:28.340Z',
    lastUpdated: '2020-01-07T18:25:28.340Z',
    tags: {
      itemsType: 'AttributeValue',
      items: ['1000 Genomes', 'CMG', 'Open Access', 'Exome']
    },
    description: 'The boy who lived',
    lowerName: 'harry potter',
    lowerDescription: 'lower description',
    project: {
      id: '112',
      name: 'CDC'
    },
    subjects: 10,
    dataType: 'RNA Seq',
    keepCollapsed: true,
    locked: false,
    files: 15,
    fileSize: 4432
  }
}

const DataBrowserDetails = routeParams => {
  const id = routeParams.id
  const snapshot = getSnapshot(id)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'top', width: '100%' } }, [
          div({ style: styles.page }, [
            icon('angle-left', { size: 35 })
          ]),
          getMainContent(snapshot),
          getSidebar(snapshot)
        ])
      ])
  ])
}

const getMainContent = snapshot => {
  return div({ style: { ...styles.page, width: '100%', marginTop: 0 } }, [
    h1(snapshot.name, { style: { marginTop: 0 } }),
    div([JSON.stringify(snapshot)])
  ])
}

const getSidebar = snapshot => {
  return div({ style: { ...styles.page, width: 400, flexShrink: 0 } }, [
    'Sidebar Content Area'
  ])
}

export const navPaths = [{
  name: 'library-details',
  path: '/library/browser/:id',
  component: DataBrowserDetails,
  title: ({ id }) => `${id} - Details`
}]
