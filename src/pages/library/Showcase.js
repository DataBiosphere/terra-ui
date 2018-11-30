import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { withWorkspaces } from 'src/components/workspace-utils'
import featuredBg from 'src/images/library/showcase/featured-workspace.svg'
import gatkLogo from 'src/images/library/showcase/gatk-logo-light.svg'
import colors from 'src/libs/colors'
import * as Config from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  header: {
    fontSize: 22, color: colors.darkBlue[0], fontWeight: 500,
    marginBottom: '1rem'
  }
}

const makeCard = isGATK => ({ workspace: { namespace, name, attributes: { description } } }) => {
  return a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    style: {
      backgroundColor: 'white',
      width: 400, height: 175,
      borderRadius: 5,
      display: 'flex',
      marginBottom: 20,
      boxShadow: Style.standardShadow
    }
  }, [
    div({ style: { flex: 1, padding: '15px 20px' } }, [
      div({ style: { color: colors.blue[0], fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [description])
    ]),
    div({
      style: {
        backgroundRepeat: 'no-repeat', backgroundPosition: 'center', borderRadius: '0 5px 5px 0',
        flex: '0 0 87px',
        ...(isGATK ?
          { backgroundColor: '#333', backgroundImage: `url(${gatkLogo})` } :
          { backgroundImage: `url(${featuredBg})`, opacity: 0.75, backgroundSize: 'auto 176px' })
      }
    })
  ])
}


const Showcase = withWorkspaces({ persist: true })(class Showcase extends Component {
  constructor(props) {
    super(props)
    this.state = { featuredList: StateHistory.get().featuredList }
  }

  async componentDidMount() {
    const featuredList = await fetch(`${await Config.getFirecloudBucketRoot()}/featured-workspaces.json`).then(res => res.json())

    this.setState({ featuredList })
    StateHistory.update({ featuredList })
  }

  render() {
    const { workspaces } = this.props
    const { featuredList } = this.state

    const allFeatured = _.intersectionWith(
      ({ workspace }, featured) => workspace.namespace === featured.namespace && workspace.name === featured.name,
      workspaces,
      featuredList)

    const bestPractices = _.filter(
      ({ workspace: { attributes: { description } } }) => description && description.startsWith('### GATK Best Practices'), allFeatured)

    const featured = _.difference(allFeatured, bestPractices)

    return h(Fragment, [
      libraryTopMatter('showcase & tutorials'),
      !(featuredList && workspaces) ?
        centeredSpinner() :
        div({ style: { display: 'flex', margin: '2.5rem' } }, [
          div({ style: { marginRight: '2rem' } }, [
            div({ style: styles.header }, 'GATK4 example workspaces'),
            ..._.map(makeCard(true), bestPractices)
          ]),
          div([
            div({ style: styles.header }, 'Featured workspaces'),
            ..._.map(makeCard(false), featured)
          ])
        ])
    ])
  }
})


export const addNavPaths = () => {
  Nav.defPath('library-showcase', {
    path: '/library/showcase',
    component: Showcase,
    title: 'Showcase & Tutorials'
  })
}
