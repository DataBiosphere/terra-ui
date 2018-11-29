import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { withWorkspaces } from 'src/components/workspace-utils'
import colors from 'src/libs/colors'
import * as Config from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  header: {
    fontSize: 22, color: colors.darkBlue[0], fontWeight: 500,
    marginBottom: '1rem'
  },
  content: {
    display: 'flex', margin: '2.5rem'
  },
  title: {
    marginTop: '1rem',
    fontSize: 20, color: colors.darkBlue[0]
  },
  workspace: {
    container: {
      margin: '0 4rem 5rem 0', width: 350
    },
    title: {
      marginTop: '1rem',
      fontSize: 20, color: colors.darkBlue[0]
    },
    description: {
      marginTop: '1rem',
      height: 125
    }
  }
}

const makeCard = ({ workspace: { name, attributes: { description } } }, isGATK) => div({}, [
  name, description
])


const Showcase = withWorkspaces({ persist: true })(class Showcase extends Component {
  async componentDidMount() {
    const featuredList = await fetch(`${await Config.getFirecloudBucketRoot()}/featured-workspaces.json`).then(res => res.json())

    this.setState({ featuredList })
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

    return h(Fragment, [
      libraryTopMatter('showcase'),
      !(featuredList && workspaces) ?
        centeredSpinner() :
        div({ style: styles.content }, [
          div({ style: { marginRight: '2rem' } }, [
            div({ style: styles.header }, 'GATK4 example workspaces')
          ]),
          div([
            div({ style: styles.header }, 'Featured workspaces')
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
