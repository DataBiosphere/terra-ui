import _ from 'lodash/fp'
import * as qs from 'qs'
import { Component } from 'react'
import { div, h, h2 } from 'react-hyperscript-helpers'
import AuthContainer from 'src/components/AuthContainer'
import { buttonOutline } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { notify } from 'src/components/Notifications'
import TopBar from 'src/components/TopBar'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import * as Projects from 'src/pages/billing/List'
import * as Group from 'src/pages/groups/Group'
import * as Groups from 'src/pages/groups/List'
import * as ImportData from 'src/pages/ImportData'
import * as ImportTool from 'src/pages/ImportTool'
import * as LandingPage from 'src/pages/LandingPage'
import * as Code from 'src/pages/library/Code'
import * as DataExplorer from 'src/pages/library/DataExplorer'
import * as Datasets from 'src/pages/library/Datasets'
import * as Showcase from 'src/pages/library/Showcase'
import * as PrivacyPolicy from 'src/pages/PrivacyPolicy'
import * as Profile from 'src/pages/Profile'
import * as TermsOfService from 'src/pages/TermsOfService'
import * as TestLogin from 'src/pages/TestLogin'
import * as WorkspaceList from 'src/pages/workspaces/List'
import * as Dashboard from 'src/pages/workspaces/workspace/Dashboard'
import * as Data from 'src/pages/workspaces/workspace/Data'
import * as JobHistory from 'src/pages/workspaces/workspace/JobHistory'
import * as SubmissionDetails from 'src/pages/workspaces/workspace/jobHistory/SubmissionDetails'
import * as Notebooks from 'src/pages/workspaces/workspace/Notebooks'
import * as NotebookLauncher from 'src/pages/workspaces/workspace/notebooks/NotebookLauncher'
import * as TerminalLauncher from 'src/pages/workspaces/workspace/notebooks/TerminalLauncher'
import * as Tools from 'src/pages/workspaces/workspace/Tools'
import * as WorkflowView from 'src/pages/workspaces/workspace/tools/WorkflowView'


const pageWrapStyle = { display: 'flex', flexDirection: 'column', flex: '1 0 auto', position: 'relative' }

const initNavPaths = () => {
  Nav.clearPaths()
  _.forEach(Nav.defPath, _.flatten([
    TestLogin.navPaths,
    LandingPage.navPaths,
    WorkspaceList.navPaths,
    WorkflowView.navPaths,
    ImportData.navPaths,
    ImportTool.navPaths,
    PrivacyPolicy.navPaths,
    Dashboard.navPaths,
    Data.navPaths,
    Notebooks.navPaths,
    JobHistory.navPaths,
    SubmissionDetails.navPaths,
    Tools.navPaths,
    NotebookLauncher.navPaths,
    Profile.navPaths,
    Groups.navPaths,
    Group.navPaths,
    TerminalLauncher.navPaths,
    TermsOfService.navPaths,
    Code.navPaths,
    DataExplorer.navPaths,
    Datasets.navPaths,
    Showcase.navPaths,
    Projects.navPaths
  ]))
}

export default class Router extends Component {
  constructor(props) {
    super(props)
    this.state = { pathname: undefined }
  }

  componentDidMount() {
    initNavPaths()
    this.setState({ pathname: Nav.history.location.pathname, search: Nav.history.location.search })
    this.unlisten = Nav.history.listen(
      ({ pathname, search }) => this.setState({ pathname, search })
    )

    if (_.has('fcredir', qs.parse(Nav.history.location.search, { ignoreQueryPrefix: true, plainObjects: true }))) {
      notify('welcome', div({ style: { fontSize: 14 } }, [
        div(['Welcome to the new FireCloud interface, powered by Terra. All of your workspaces are available.']),
        div({ style: { marginTop: '1rem' } }, ['The legacy FireCloud is still available until ' +
        'August 2019. Click the three-bar menu on the upper-left corner and select "Use Classic FireCloud".']),
        div({ style: { marginTop: '1rem' } }, ['Please update your bookmarks to our new URL, firecloud.terra.bio. ' +
        'Welcome to the future of FireCloud!']),
        buttonOutline({
          as: 'a',
          ...Utils.newTabLinkProps,
          href: 'https://support.terra.bio/hc/en-us/sections/360004482892',
          style: { marginTop: '1rem' }
        }, ['Learn what\'s new and different'])
      ]))
      Nav.history.replace(
        { search: qs.stringify(_.omit(['fcredir'], qs.parse(Nav.history.location.search, { ignoreQueryPrefix: true, plainObjects: true }))) })
    }
  }

  // FIXME - shouldn't be using unsafe methods
  UNSAFE_componentWillReceiveProps() { // eslint-disable-line camelcase
    initNavPaths()
  }

  componentDidUpdate(prevProps, prevState) {
    const { pathname, search } = this.state
    if (prevState.pathname === pathname) return

    const handler = Nav.findHandler(pathname)

    if (handler && handler.title) {
      if (_.isFunction(handler.title)) {
        document.title = handler.title(Nav.getHandlerProps(handler, pathname, search))
      } else {
        document.title = handler.title
      }
    } else {
      document.title = getAppName()
    }
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { pathname, search } = this.state
    if (pathname === undefined) {
      return null
    }
    const handler = Nav.findHandler(pathname)
    if (!handler) {
      return h(FooterWrapper, [
        h(TopBar),
        div({ style: { marginLeft: '1rem', ...pageWrapStyle } }, [
          h2('Page not found')
        ])
      ])
    }
    const el = div({ style: pageWrapStyle }, [
      h(handler.component, {
        key: pathname, // forces a remount even if component is the same
        ...Nav.getHandlerProps(handler, pathname, search)
      })
    ])
    return h(AuthContainer, { isPublic: handler.public }, [el])
  }
}
