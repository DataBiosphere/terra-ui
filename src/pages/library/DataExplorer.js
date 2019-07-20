import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { commonPaths } from 'src/components/breadcrumbs'
import DataExplorer from 'src/components/DataExplorer'
import PrivateDataExplorer from 'src/components/PrivateDataExplorer'
import TopBar from 'src/components/TopBar'
import datasets from 'src/libs/datasets'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const DataExplorerPage = props => {
  const { dataset } = props
  const { authDomain } = _.find({ name: dataset }, datasets)

  const header = h(TopBar, { title: 'Library', href: Nav.getLink('library-datasets') }, [
    div({ style: Style.breadcrumb.breadcrumb }, [
      div({}, commonPaths.datasetList()),
      div({ style: Style.breadcrumb.textUnderBreadcrumb }, [
        'Data Explorer - ' + dataset
      ])
    ])
  ])

  return h(Fragment, [
    header,
    Utils.cond(
      [authDomain === undefined, h(DataExplorer, { dataset })],
      h(PrivateDataExplorer, { dataset })
    )
  ])
}

export const navPaths = [
  {
    name: 'library-datasets-data-explorer-public',
    path: '/library/datasets/public/:dataset/data-explorer',
    component: DataExplorerPage,
    public: true,
    title: ({ dataset }) => `${dataset} - Data Explorer`
  },
  {
    name: 'library-datasets-data-explorer-private',
    path: '/library/datasets/:dataset/data-explorer',
    component: DataExplorerPage,
    title: ({ dataset }) => `${dataset} - Data Explorer`
  }
]
