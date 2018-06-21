import { Fragment } from 'react'
import { hot } from 'react-hot-loader'
import { h } from 'react-hyperscript-helpers'
import ConfigOverridesWarning from 'src/components/ConfigOverridesWarning'
import ErrorBanner from 'src/components/ErrorBanner'
import Router from 'src/components/Router'


const Main = () => h(Fragment, [h(Router), h(ErrorBanner), h(ConfigOverridesWarning)])

export default hot(module)(Main)
