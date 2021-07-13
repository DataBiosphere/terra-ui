import _ from 'lodash/fp'
import { useState } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { useWorkspaces } from 'src/components/workspace-utils'
import covidBg from 'src/images/library/showcase/covid-19.jpg'
import featuredBg from 'src/images/library/showcase/featured-workspace.svg'
import gatkLogo from 'src/images/library/showcase/gatk-logo-light.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  column: { marginRight: '1.5rem', flex: '1 1 0px', maxWidth: 415 },
  header: {
    fontSize: 22, color: colors.dark(), fontWeight: 500,
    marginBottom: '1rem'
  }
}

const makeCard = variant => ({ workspace: { namespace, name, attributes: { description } } }) => {
  return a({
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    style: {
      backgroundColor: 'white',
      height: 175,
      borderRadius: 5,
      display: 'flex',
      margin: '1rem 1rem 0',
      boxShadow: Style.standardShadow
    }
  }, [
    div({ style: { flex: 1, minWidth: 0, padding: '15px 20px' } }, [
      div({ style: { color: colors.accent(), fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [description])
    ]),
    div({
      style: {
        backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'auto 100%', borderRadius: '0 5px 5px 0',
        width: 87,
        ...Utils.cond(
          [name.toLowerCase().includes('covid'), () => ({ backgroundImage: `url(${covidBg})` })],
          [variant === 'gatk', () => ({ backgroundColor: '#333', backgroundImage: `url(${gatkLogo})`, backgroundSize: undefined })],
          () => ({ backgroundImage: `url(${featuredBg})`, opacity: 0.75 })
        )
      }
    })
  ])
}


const Showcase = () => {
  const { workspaces } = useWorkspaces()
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)

  Utils.useOnMount(() => {
    const loadData = async () => {
      const featuredList = await Ajax().Buckets.getFeaturedWorkspaces()

      setFeaturedList(featuredList)
      StateHistory.update({ featuredList })
    }

    loadData()
  })

  const allFeatured = _.intersectionWith(
    ({ workspace }, featured) => workspace.namespace === featured.namespace && workspace.name === featured.name,
    workspaces,
    featuredList)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('showcase & tutorials'),
    !allFeatured ?
      centeredSpinner() :
      div({ style: { display: 'flex', margin: '1rem 1rem 0' } }, [
        div({ sytle: { width: 300 } }, [
          div({ style: styles.header }, 'Featured workspaces')
        ]),
        div({ style: { flex: 1 } }, [
          ..._.map(makeCard(), allFeatured)
        ])
      ])
  ])
}


export const navPaths = [
  {
    name: 'library-showcase',
    path: '/library/showcase',
    component: Showcase,
    title: 'Showcase & Tutorials'
  }
]
