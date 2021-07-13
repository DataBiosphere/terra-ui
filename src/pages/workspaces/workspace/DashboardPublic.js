import _ from 'lodash/fp'
import { div, h, h2 } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { MarkdownViewer } from 'src/components/markdown'
import SignInButton from 'src/components/SignInButton'
import TopBar from 'src/components/TopBar'
import * as Style from 'src/libs/style'

// test case
const showcase = [
  {
    namespace: 'broad-dsde-alpha',
    name: '2000_samples',
    description: 'sample fetch anything description'
  }
]

//render
const DashboardPublic = ({ namespace, name }) => {
  const { description } = _.find({ namespace, name }, showcase)

  return h(FooterWrapper, [
    h(TopBar, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        h2({ style: Style.breadcrumb.textUnderBreadcrumb }, [
          `${namespace}/${name}`
        ])
      ])
    ]),
    div({ style: { flex: 1, display: 'flex' } }, [
      div({ style: Style.dashboard.leftBox }, [
        div({ style: Style.dashboard.header }, [
          'About the workspace'
        ]),
        !!description && h(MarkdownViewer, [description])
      ]),
      div({ style: Style.dashboard.rightBox }, [
        h(SignInButton)
      ])
    ])
  ])
}

export default DashboardPublic
