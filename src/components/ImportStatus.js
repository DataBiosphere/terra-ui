import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { clearNotification, notify } from 'src/components/Notifications'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { pfbImportJobStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const ImportStatus = () => {
  const jobs = Utils.useStore(pfbImportJobStore)
  return h(Fragment, _.map(job => h(ImportStatusItem, {
    job,
    onDone: () => {
      pfbImportJobStore.update(_.reject({ jobId: job.jobId }))
    }
  }), jobs))
}

const ImportStatusItem = ({ job: { targetWorkspace, jobId }, onDone }) => {
  const signal = Utils.useCancellation()

  Utils.usePollingEffect(
    withErrorReporting('Problem checking status of PFB data import', async () => {
      await checkForCompletion(targetWorkspace, jobId)
    }), { ms: 5000 })

  const checkForCompletion = async ({ namespace, name }, jobId) => {
    const fetchImportStatus = async () => {
      try {
        return await Ajax(signal).Workspaces.workspace(namespace, name).importPFBStatus(jobId)
      } catch (error) {
        // Ignore 404; We're probably asking for status before the status endpoint knows about the job
        if (error.status === 404) {
          return { status: 'PENDING' }
        } else {
          onDone()
          throw error
        }
      }
    }

    const response = await fetchImportStatus()
    const { message, status } = response

    if (!_.includes(status, ['PENDING', 'RUNNING'])) {
      Utils.switchCase(status,
        ['SUCCESS', () => notify('success', 'Data imported successfully.',
          { message: `Data import to workspace "${namespace} / ${name}" is complete. Please refresh the Data view.` })],
        ['ERROR', () => notify('error', 'Error importing PFB data.', message)],
        [Utils.DEFAULT, () => notify('error', 'Unexpected error importing PFB data', response)]
      )
      clearNotification(jobId)
      onDone()
    }
  }

  return null
}

export default ImportStatus
