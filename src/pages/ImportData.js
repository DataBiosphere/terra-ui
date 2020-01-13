import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { backgroundLogo, spinnerOverlay } from 'src/components/common'
import { notify } from 'src/components/Notifications'
import TopBar from 'src/components/TopBar'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { pfbImportJobStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.dark(), marginBottom: '2rem'
  },
  card: {
    borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.85)', padding: '2rem',
    flex: 1, minWidth: 0, boxShadow: Style.standardShadow
  }
}

const ImportData = () => {
  const [isImporting, setIsImporting] = useState(false)
  const { query: { url, format, ad, wid } } = Nav.useRoute()

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async ({ namespace, name }) => {
    await Utils.switchCase(format,
      ['PFB', async () => {
        const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importPFB(url)
        pfbImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
        notify('info', 'Data import in progress.', {
          id: jobId,
          message: 'Data will show up incrementally as the job progresses.'
        })
      }],
      ['entitiesJson', async () => {
        await await Ajax().Workspaces.workspace(namespace, name).importJSON(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }],
      [Utils.DEFAULT, async () => {
        await await Ajax().Workspaces.workspace(namespace, name).importBagit(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }]
    )
    Nav.goToPath('workspace-data', { namespace, name })
  })

  return h(Fragment, [
    backgroundLogo,
    h(TopBar, { title: 'Import Data' }),
    div({ role: 'main', style: styles.container }, [
      div({ style: styles.card }, [
        div({ style: styles.title }, ['Importing Data']),
        div({ style: { fontSize: 16 } }, ['From: ', new URL(url).hostname])
      ]),
      div({ style: { ...styles.card, marginLeft: '2rem' } }, [
        div({ style: styles.title }, ['Destination Workspace']),
        h(WorkspaceImporter, {
          authorizationDomain: ad,
          selectedWorkspaceId: wid,
          onImport
        }),
        isImporting && spinnerOverlay
      ])
    ])
  ])
}

export const navPaths = [
  {
    name: 'import-data',
    path: '/import-data',
    component: ImportData,
    title: 'Import Data'
  }
]
