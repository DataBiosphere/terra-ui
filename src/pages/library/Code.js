import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable, Link } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import broadSquare from 'src/images/library/code/broad-square.svg'
import dockstoreLogo from 'src/images/library/code/dockstore.svg'
import { Ajax, useCancellation } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import { getAppName, returnParam } from 'src/libs/logos'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { useOnMount, withBusyState } from 'src/libs/utils'


const styles = {
  header: {
    fontSize: 22, color: colors.dark(), fontWeight: 500, lineHeight: '22px',
    marginBottom: '1rem'
  }
}

export const MethodCard = ({ method: { name, synopsis }, ...props }) => {
  return h(Clickable, {
    ...props,
    style: {
      ...Style.elements.card.container,
      backgroundColor: 'white',
      width: 390, height: 140,
      padding: undefined,
      margin: '0 30px 27px 0',
      position: 'relative'
    }
  }, [
    div({ style: { flex: 1, padding: '15px 20px' } }, [
      div({ style: { color: colors.accent(), fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [synopsis])
    ]),
    div({
      style: {
        position: 'absolute', top: 0, right: 8,
        color: 'white', fontSize: 6, fontWeight: 'bold',
        backgroundColor: colors.dark(),
        padding: '10px 2px 3px 2px'
      }
    }, ['WDL'])
  ])
}

const LogoTile = ({ logoFile, ...props }) => {
  return div(_.merge({
    style: {
      flexShrink: 0,
      backgroundImage: `url(${logoFile})`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
      backgroundSize: 27,
      width: 37, height: 37,
      marginRight: 13
    }
  }, props))
}

export const DockstoreTile = () => {
  return div({ style: { display: 'flex' } }, [
    h(LogoTile, { logoFile: dockstoreLogo, style: { backgroundColor: 'white' } }),
    div([
      h(Link, { href: `${getConfig().dockstoreUrlRoot}/search?_type=workflow&descriptorType=wdl&searchMode=files` }, 'Dockstore'),
      div(['Browse WDL workflows in Dockstore, an open platform used by the GA4GH for sharing Docker-based workflows'])
    ])
  ])
}

export const MethodRepoTile = () => {
  return div({ style: { display: 'flex' } }, [
    h(LogoTile, { logoFile: broadSquare, style: { backgroundSize: 37 } }),
    div([
      h(Link, { href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#methods` }, 'Broad Methods Repository'),
      div([`Use Broad workflows in ${getAppName()}. Share your own, or choose from > 700 public workflows`])
    ])
  ])
}

const Code = () => {
  const signal = useCancellation()
  const stateHistory = StateHistory.get()
  const [featuredList, setFeaturedList] = useState(stateHistory.featuredList)
  const [methods, setMethods] = useState(stateHistory.methods)
  const [loading, setLoading] = useState(false)
  const loadData = _.flow(
    withErrorReporting('Error loading workflows'),
    withBusyState(setLoading)
  )(async () => {
    const [newFeaturedList, newMethods] = await Promise.all([
      fetch(`${getConfig().firecloudBucketRoot}/featured-methods.json`, { signal }).then(res => res.json()),
      Ajax(signal).Methods.list({ namespace: 'gatk' })
    ])
    setFeaturedList(newFeaturedList)
    setMethods(newMethods)
  })
  useOnMount(() => {
    loadData()
  })
  useEffect(() => {
    StateHistory.update({ featuredList, methods })
  }, [featuredList, methods])

  const featuredMethods = _.flow(
    _.map(({ namespace, name }) => _.maxBy('snapshotId', _.filter({ namespace, name }, methods))),
    _.compact
  )(featuredList)

  return h(Fragment, [
    libraryTopMatter('code & workflows'),
    div({ role: 'main' }, [
      div({ style: { display: 'flex', flex: 1 } }, [
        div({ style: { flex: 1, margin: '30px 0 30px 40px' } }, [
          div({ style: styles.header }, 'GATK4 Best Practices workflows'),
          div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
            _.map(method => {
              const { namespace, name } = method
              return h(MethodCard, {
                key: `${namespace}/${name}`,
                href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#methods/${namespace}/${name}/`,
                method
              })
            }, featuredMethods)
          ])
        ]),
        div({ style: { width: 385, padding: '25px 30px', backgroundColor: colors.light(), lineHeight: '20px' } }, [
          div({ style: { ...styles.header, fontSize: 16 } }, 'FIND ADDITIONAL WORKFLOWS'),
          h(DockstoreTile),
          div({ style: { marginTop: 40 } }, [
            h(MethodRepoTile)
          ])
        ])
      ]),
      loading && centeredSpinner()
    ])
  ])
}


export const navPaths = [
  {
    name: 'library-code',
    path: '/library/code',
    component: Code,
    public: false,
    title: 'Code & Workflows'
  }
]
