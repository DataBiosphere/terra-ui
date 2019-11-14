import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { clearNotification, notify } from 'src/components/Notifications'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { pfbImportJobStore } from 'src/libs/state'
import { DEFAULT, delay, switchCase, useAtom, useOnMount } from 'src/libs/utils'


const ImportStatus = () => {
  const jobs = useAtom(pfbImportJobStore)
  return h(Fragment, _.map(job => h(ImportStatusItem, {
    job,
    onDone: () => {
      pfbImportJobStore.update(_.reject({ jobId: job.jobId }))
    }
  }), jobs))
}

const ImportStatusItem = ({ job, onDone }) => {
  const { targetWorkspace, jobId } = job
  const signal = useCancellation()

  useOnMount(() => {
    const poll = async () => {
      while (true) {
        await delay(5000)
        await isComplete(targetWorkspace, jobId)
      }
    }
    poll()
  })

  const isComplete = async ({ namespace, name }, jobId) => {
    const { Workspaces } = Ajax(signal)

    try {
      const response = await Workspaces.workspace(namespace, name).importPFBStatus(jobId)
      const { message, status } = response

      // SR;DN (still running; do nothing)
      if (status !== 'RUNNING') {
        switchCase(status,
          ['SUCCESS', () => notify('success', 'Data imported successfully.',
            { message: `Data import to workspace "${namespace} / ${name}" is complete. Please refresh the Data view.` })],
          ['ERROR', () => notify('error', 'Error importing PFB data.', message)],
          [DEFAULT, () => notify('error', 'Unexpected error importing PFB data', response)]
        )
        clearNotification(jobId)
        onDone()
      }
    } catch (error) {
      // Ignore 404; We're probably asking for status before the status endpoint knows about the job
      if (error.status !== 404) {
        throw error
      }
    }
  }

  return null
}

export default ImportStatus
