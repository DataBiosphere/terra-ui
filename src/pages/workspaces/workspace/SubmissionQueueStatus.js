import { formatDistanceToNow } from 'date-fns'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { spinner } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { useCancellation, useOnMount, withBusyState } from 'src/libs/utils'


export const SubmissionQueueStatus = () => {
  const [queueStatus, setQueueStatus] = useState()
  const [loading, setLoading] = useState(false)

  const signal = useCancellation()
  useOnMount(() => {
    const fetchQueueStatus = _.flow(
      withBusyState(setLoading),
      withErrorReporting('Error loading submission queue status')
    )(async () => {
      const { Submissions } = Ajax(signal)
      const status = await Submissions.queueStatus()
      setQueueStatus(status)
    })

    fetchQueueStatus()
  })

  return h(Fragment, [
    loading && spinner(),
    queueStatus && table({ style: {} }, [tbody([
      tr([
        td({ style: { paddingRight: '0.5rem', textAlign: 'right' } }, ['Estimated wait time:']),
        td([formatDistanceToNow(Date.now() + queueStatus.estimatedQueueTimeMS)])
      ]),
      tr([
        td({ style: { paddingRight: '0.5rem', textAlign: 'right' } }, ['Workflows ahead of yours:']),
        td([queueStatus.workflowsBeforeNextUserWorkflow])
      ]),
      tr([
        td({ style: { paddingRight: '0.5rem', textAlign: 'right' } }, ['Queue status:']),
        td([
          _.sum([0, ..._.at(['Queued', 'Launching'], queueStatus.workflowCountsByStatus)]),
          ' Queued; ',
          _.sum([0, ..._.at(['Submitted', 'Running', 'Aborting'], queueStatus.workflowCountsByStatus)]),
          ' Active'
        ])
      ])
    ])])
  ])
}
