import { Fragment } from 'react'
import { hot } from 'react-hot-loader/root'
import { h } from 'react-hyperscript-helpers'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import ErrorWrapper from 'src/components/ErrorWrapper'
import { NihLinkWarning } from 'src/components/NihLinkWarning'
import Notifications from 'src/components/Notifications'
import { NpsSurvey } from 'src/components/NpsSurvey'
import Router from 'src/components/Router'
import SupportRequest from 'src/components/SupportRequest'
import { TrialBanner } from 'src/components/TrialBanner'


const Main = () => {
  return h(Fragment, [
    h(Notifications),
    h(ErrorWrapper, [h(NihLinkWarning), h(TrialBanner), h(Router)]),
    h(SupportRequest),
    h(NpsSurvey),
    h(ConfigOverridesWarning)
  ])
}

export default hot(Main)
