import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { Ajax } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils'


const activeTab = 'browse & explore'

const DataBrowserPreview = ({ id }) => {
  const signal = Utils.useCancellation()
  const { dataCatalog } = useDataCatalog()
  const dataMap = _.keyBy('dct:identifier', dataCatalog)
  const snapshot = dataMap[id]
  const [previewData, setPreviewData] = useState()
  console.log('snapshot', snapshot)

  Utils.useOnMount(() => {
    const loadData = async () => {
      console.log('in loadData', snapshot)
      if (snapshot) {
        setPreviewData(await Ajax(signal).DataRepo.getPreviewTable({
          datasetProject: snapshot?.projectId,
          datasetBqSnapshotName: snapshot['dct:title'],
          tableName: 'tablename'
        }))
        console.log('previewData', previewData)
      }
      else {
        console.log('no snapshot to load')
      }
    }
    loadData()
  })

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'top', width: '100%', lineHeight: '26px' } }, [
          h1([snapshot['dct:title']])
        ])
      ])
  ])
}

export const navPaths = [{
  name: 'library-catalog-preview',
  path: '/library/browser/:id/preview',
  component: DataBrowserPreview,
  title: ({ id }) => `Catalog - Dataset Preview`
}]
