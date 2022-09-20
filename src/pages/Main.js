import 'src/libs/routes'

import { h } from 'react-hyperscript-helpers'
import ReactNotification from 'react-notifications-component'
import { AuthProvider } from 'react-oidc-context'
import AuthContainer from 'src/components/AuthContainer'
import AuthStoreSetter from 'src/components/AuthStoreSetter'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import CookieRejectModal from 'src/components/CookieRejectModal'
import CookieWarning from 'src/components/CookieWarning'
import ErrorWrapper from 'src/components/ErrorWrapper'
import Favicon from 'src/components/Favicon'
import FirecloudNotification from 'src/components/FirecloudNotification'
import IdleStatusMonitor from 'src/components/IdleStatusMonitor'
import ImportStatus from 'src/components/ImportStatus'
import SupportRequest from 'src/components/SupportRequest'
import { getOidcConfig } from 'src/libs/auth'
import { PageViewReporter } from 'src/libs/events'
import { LocationProvider, PathHashInserter, Router, TitleManager } from 'src/libs/nav'
import { AuthenticatedCookieSetter } from 'src/pages/workspaces/workspace/analysis/runtime-common'


const Main = () => {
  return h(LocationProvider, [
    h(PathHashInserter),
    h(CookieRejectModal),
    h(CookieWarning),
    h(ReactNotification),
    h(ImportStatus),
    h(Favicon),
    h(IdleStatusMonitor),
    h(ErrorWrapper, [
      h(TitleManager),
      h(FirecloudNotification),
      h(AuthenticatedCookieSetter),
      h(AuthProvider, getOidcConfig(), [
        h(AuthStoreSetter)
      ]),
      h(AuthContainer, [h(Router)])
    ]),
    h(PageViewReporter),
    h(SupportRequest),
    h(ConfigOverridesWarning)
  ])
}

export default Main
