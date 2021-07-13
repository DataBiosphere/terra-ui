
import _ from 'lodash/fp'
import { Fragment } from 'react'
import { br, div, h, h2, p, span } from 'react-hyperscript-helpers'
import { HeroWrapper, Link } from 'src/components/common'
import { MarkdownViewer } from 'src/components/markdown'
import FooterWrapper from 'src/components/FooterWrapper'
import SignInButton from 'src/components/SignInButton'
import TopBar from 'src/components/TopBar'
import colors from 'src/libs/colors'
import { isAnvil, isBioDataCatalyst, isFirecloud } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const styles = {
  warningNoticeContainer: {
    lineHeight: 1.5, marginTop: '2rem',
    paddingTop: '1rem', borderTop: Style.standardLine
  },
  warningNotice: {
    fontWeight: 500, textTransform: 'uppercase'
  }
}

// test case
const showcase = [
  {
    namespace: 'broad-dsde-alpha',
    name: '2000_samples',
    description: 'sample fetch anything description',
  }
]

//render
const DashboardPublic = ({ namespace, name }) => {
  const { description } = _.find({namespace , name}, showcase)
  
  return h(FooterWrapper, [
    h(TopBar, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        h2({ style: Style.breadcrumb.textUnderBreadcrumb }, [
          `${namespace}/${name}`,
        ])
      ]),
    ]),
    div({ style: { flex: 1, display: 'flex' } }, [
      div({ style: Style.dashboard.leftBox }, [
        div({ style: Style.dashboard.header }, [
          'About the workspace',
        ]),
        !!description && h(MarkdownViewer, [description]),
      ]),
      div({ style: Style.dashboard.rightBox }, [
        h(SignInButton)   
      ])
    ])
  ])
}

export default DashboardPublic
