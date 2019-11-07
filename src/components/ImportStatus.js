import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { notify } from 'src/components/Notifications'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { pfbImportJobStore } from 'src/libs/state'
import { delay, useAtom, useOnMount } from 'src/libs/utils'


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

      switch (status) {
        case 'RUNNING':
          // SR;DN (still running; do nothing)
          break
        case 'SUCCESS':
          notify('success', 'Data imported successfully.')
          onDone()
          break
        case 'ERROR':
          notify('error', 'Error importing PFB data.', message)
          onDone()
          break
        default:
          notify('error', 'Unexpected error importing PFB data', response)
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
