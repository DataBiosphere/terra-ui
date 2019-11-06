import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { notify } from 'src/components/Notifications'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { pfbImportJobStore } from 'src/libs/state'
import { delay, useAtom, useOnMount } from 'src/libs/utils'


const ImportStatus = () => {
  const jobs = useAtom(pfbImportJobStore)
  console.log(jobs)
  return h(Fragment, _.map(job => h(ImportStatusItem, {
    job,
    onDone: () => {
      console.log(`removing job ${(job.jobId)}`)
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
        await isComplete(targetWorkspace, jobId)
        await delay(5000)
      }
    }
    poll()
  })

  const isComplete = async ({ namespace, name }, jobId) => {
    const { Workspaces } = Ajax(signal)

    console.log(`checking status of ${jobId}`)
    try {
      const response = await Workspaces.workspace(namespace, name).importPFBStatus(jobId)
      const { message, status } = response

      switch (status) {
        case 'RUNNING':
          // SR;DN (still running; do nothing)
          // return false
          break
        case 'SUCCESS':
          notify('success', 'Data imported successfully.')
          onDone()
          // return true
          break
        case 'ERROR':
          notify('error', 'Error importing PFB data.', message)
          onDone()
          // return true
          break
        default:
          notify('error', 'Unexpected error importing PFB data', response)
          onDone()
          // return true
      }
    } catch (error) {
      if (error.status === 404) {
        console.log(`job ${jobId} does not yet exist`)
        // return false
      } else {
        throw error
      }
    }
  }

  return null
}

export default ImportStatus
