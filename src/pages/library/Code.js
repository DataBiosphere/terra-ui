import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable, link } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import broadSquare from 'src/images/library/code/broad-square.svg'
import dockstoreLogo from 'src/images/library/code/dockstore.svg'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { getAppName, returnParam } from 'src/libs/logos'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  header: {
    fontSize: 22, color: colors.dark(), fontWeight: 500, lineHeight: '22px',
    marginBottom: '1rem'
  }
}

export const makeToolCard = ({ method, onClick }) => {
  const { namespace, name, synopsis } = method

  return h(Clickable, {
    as: 'a',
    href: _.isUndefined(onClick) ? `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#methods/${namespace}/${name}/` : undefined,
    onClick,
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

const logoTile = ({ logoFile, style = {} }) => div({
  style: {
    flexShrink: 0,
    backgroundImage: `url(${logoFile})`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: 'white',
    backgroundSize: 27,
    width: 37, height: 37,
    marginRight: 13,
    ...style
  }
})

export const dockstoreTile = () => div({ style: { display: 'flex' } }, [
  logoTile({ logoFile: dockstoreLogo }),
  div([
    link({ href: `${getConfig().dockstoreUrlRoot}/search?descriptorType=wdl&searchMode=files` }, 'Dockstore'),
    div(['Browse WDL workflows in Dockstore, an open platform used by the GA4GH for sharing Docker-based tools'])
  ])
])

export const fcMethodRepoTile = () => div({ style: { display: 'flex' } }, [
  logoTile({ logoFile: broadSquare, style: { backgroundColor: undefined, backgroundSize: 37 } }),
  div([
    link({ href: `${getConfig().firecloudUrlRoot}/?return=${returnParam()}#methods` }, 'Broad Methods Repository'),
    div([`Use Broad workflows in ${getAppName()}. Share your own, or choose from > 700 public workflows`])
  ])
])


const Code = ajaxCaller(class Code extends Component {
  constructor(props) {
    super(props)
    const { featuredList, methods } = StateHistory.get()

    this.state = { featuredList, methods }
  }

  async componentDidMount() {
    const { ajax: { Methods } } = this.props

    const [featuredList, methods] = await Promise.all([
      fetch(`${getConfig().firecloudBucketRoot}/featured-methods.json`).then(res => res.json()),
      Methods.list({ namespace: 'gatk' })
    ])

    this.setState({ featuredList, methods })
    StateHistory.update({ featuredList, methods })
  }

  render() {
    const { featuredList, methods } = this.state

    const featuredMethods = _.compact(
      _.map(
        ({ namespace, name }) => _.maxBy('snapshotId', _.filter({ namespace, name }, methods)),
        featuredList
      )
    )

    return h(Fragment, [
      libraryTopMatter('code & tools'),
      !(featuredList && methods) ?
        centeredSpinner() :
        div({ style: { display: 'flex', flex: 1 } }, [
          div({ style: { flex: 1, margin: '30px 0 30px 40px' } }, [
            div({ style: styles.header }, 'GATK4 Best Practices workflows'),
            div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
              ..._.map(method => makeToolCard({ method }), featuredMethods)
            ])
          ]),
          div({ style: { width: 385, padding: '25px 30px', backgroundColor: colors.light(), lineHeight: '20px' } }, [
            div({ style: { ...styles.header, fontSize: 16 } }, 'FIND ADDITIONAL WORKFLOWS'),
            dockstoreTile(),
            div({ style: { marginTop: 40 } }, [
              fcMethodRepoTile()
            ])
          ])
        ])
    ])
  }
})


export const navPaths = [
  {
    name: 'library-code',
    path: '/library/code',
    component: Code,
    public: false,
    title: 'Code & Tools'
  }
]
