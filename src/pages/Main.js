import { Fragment } from 'react'
import { hot } from 'react-hot-loader'
import { h } from 'react-hyperscript-helpers'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import ErrorBanner from 'src/components/ErrorBanner'
import ErrorWrapper from 'src/components/ErrorWrapper'
import Router from 'src/components/Router'


const Main = () => {
  return h(Fragment, [
    h(ErrorWrapper, [h(Router)]),
    h(ErrorBanner),
    h(ConfigOverridesWarning)
  ])
}

export default hot(module)(Main)
