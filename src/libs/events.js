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
  const { isSignedIn } = Utils.useStore(authStore)

  useEffect(() => {
    if (isSignedIn) {
      Ajax().Metrics.captureEvent(eventsList.pageView)
    }
  }, [isSignedIn, name])

  return null
}

export default eventsList
