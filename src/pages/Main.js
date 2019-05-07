import { Fragment } from 'react'
import { hot } from 'react-hot-loader/root'
import { h } from 'react-hyperscript-helpers'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import ErrorWrapper from 'src/components/ErrorWrapper'
import Notifications from 'src/components/Notifications'
import { NpsSurvey } from 'src/components/NpsSurvey'
import Router from 'src/components/Router'
import ServiceAlerts from 'src/components/ServiceAlerts'
import SupportRequest from 'src/components/SupportRequest'
import { TrialBanner } from 'src/components/TrialBanner'


const Main = () => {
  return h(Fragment, [
    h(Notifications),
    h(ServiceAlerts),
    h(ErrorWrapper, [h(TrialBanner), h(Router)]),
    h(SupportRequest),
    h(NpsSurvey),
    h(ConfigOverridesWarning)
  ])
}

export default hot(Main)
