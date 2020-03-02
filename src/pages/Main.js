import 'src/libs/routes'

import { hot } from 'react-hot-loader/root'
import { h } from 'react-hyperscript-helpers'
import AuthContainer from 'src/components/AuthContainer'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import ErrorWrapper from 'src/components/ErrorWrapper'
import FirecloudNotification from 'src/components/FirecloudNotification'
import FreeCreditsModal from 'src/components/FreeCreditsModal'
import IdleStatusMonitor from 'src/components/IdleStatusMonitor'
import ImportStatus from 'src/components/ImportStatus'
import Notifications from 'src/components/Notifications'
import { NpsSurvey } from 'src/components/NpsSurvey'
import ServiceAlerts from 'src/components/ServiceAlerts'
import SupportRequest from 'src/components/SupportRequest'
import { TrialBanner } from 'src/components/TrialBanner'
import { PageViewReporter } from 'src/libs/events'
import { LocationProvider, Router, TitleManager } from 'src/libs/nav'


const Main = () => {
  return h(LocationProvider, [
    h(Notifications),
    h(ImportStatus),
    h(ServiceAlerts),
    h(FreeCreditsModal),
    h(IdleStatusMonitor),
    h(ErrorWrapper, [
      h(TitleManager),
      h(FirecloudNotification),
      h(TrialBanner),
      h(AuthContainer, [h(Router)])
    ]),
    h(PageViewReporter),
    h(SupportRequest),
    h(NpsSurvey),
    h(ConfigOverridesWarning)
  ])
}

export default hot(Main)
