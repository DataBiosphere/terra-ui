import { useEffect } from 'react'
import { Ajax } from 'src/libs/ajax'
import { useRoute } from 'src/libs/nav'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const eventsList = {
  workspaceShare: 'workspace:share',
  pageView: 'page:view'
}

export const PageViewReporter = () => {
  const { name } = useRoute()
  const { isSignedIn, registrationStatus } = Utils.useStore(authStore)

  useEffect(() => {
    if (isSignedIn && registrationStatus === 'registered') {
      Ajax().Metrics.captureEvent(eventsList.pageView)
    }
  }, [isSignedIn, name, registrationStatus])

  return null
}

export default eventsList
