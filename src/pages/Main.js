import { Fragment } from 'react'
import { hot } from 'react-hot-loader'
import { h, div } from 'react-hyperscript-helpers'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import ErrorBanner from 'src/components/ErrorBanner'
import ErrorWrapper from 'src/components/ErrorWrapper'
import { NotificationsContainer } from 'src/components/Notifications'
import { NpsSurvey } from 'src/components/NpsSurvey'
import Router from 'src/components/Router'
import { TrialBanner } from 'src/components/TrialBanner'

const Main = () => {
  return h(Fragment, [
    NotificationsContainer,
    h(ErrorWrapper, [h(TrialBanner), h(Router)]),
    h(ErrorBanner),
    h(NpsSurvey),
    h(ConfigOverridesWarning)
  ])
}

export default hot(module)(Main)
