import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { clearNotification, notify } from 'src/libs/notifications'
import { asyncImportJobStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const ImportStatus = () => {
  const jobs = Utils.useStore(asyncImportJobStore)
  return h(Fragment, _.map(job => h(ImportStatusItem, {
    job,
    onDone: () => {
      asyncImportJobStore.update(_.reject({ jobId: job.jobId }))
    }
  }), _.uniq(jobs)))
}

const ImportStatusItem = ({ job: { targetWorkspace, jobId }, onDone }) => {
  const signal = Utils.useCancellation()

  Utils.usePollingEffect(
    withErrorReporting('Problem checking status of data import', async () => {
      await checkForCompletion(targetWorkspace, jobId)
    }), { ms: 5000 })

  const checkForCompletion = async ({ namespace, name }, jobId) => {
    const fetchImportStatus = async () => {
      try {
        return await Ajax(signal).Workspaces.workspace(namespace, name).getImportJobStatus(jobId)
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

    // avro-import statuses: PENDING, RUNNING, SUCCESS, ERROR
    // import service statuses: Pending, Translating, ReadyForUpsert, Upserting, Done, Error
    // TODO: only need to support both sets of statuses during the transition from avro-import to import service.
    // once import service is fully adopted, we can/should remove the avro-import status values.

    const successNotify = () => notify('success', 'Data imported successfully.',
      {
        message: `Data import to workspace "${namespace} / ${name}" is complete, please refresh the Data view.
      If your data comes from a PFB, you must include the namespace "pfb:" when referring to attribute names, 
      e.g. "this.pfb:consent_codes" instead of "this.consent_codes."`
      })

    const errorNotify = () => notify('error', 'Error importing data.', { message })

    if (!_.includes(status, ['PENDING', 'RUNNING', 'Pending', 'Translating', 'ReadyForUpsert', 'Upserting'])) {
      Utils.switchCase(status,
        ['SUCCESS', successNotify],
        ['Done', successNotify],
        ['ERROR', errorNotify],
        ['Error', errorNotify],
        [Utils.DEFAULT, () => notify('error', 'Unexpected error importing data', response)]
      )
      clearNotification(jobId)
      onDone()
    }
  }

  return null
}

export default ImportStatus
