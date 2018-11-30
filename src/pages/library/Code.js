import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import dockstoreLogo from 'src/images/library/code/dockstore.svg'
import firecloudLogo from 'src/images/library/code/firecloud.svg'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Config from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  header: {
    fontSize: 22, color: colors.darkBlue[0], fontWeight: 500, lineHeight: '22px',
    marginBottom: '1rem'
  }
}

const makeCard = firecloudRoot => method => {
  const { namespace, name, synopsis } = method

  return a({
    href: `${firecloudRoot}/?return=terra#methods/${namespace}/${name}/`,
    style: {
      backgroundColor: 'white',
      width: 390, height: 140,
      borderRadius: 5,
      display: 'flex',
      margin: '0 30px 27px 0',
      boxShadow: Style.standardShadow,
      position: 'relative'
    }
  }, [
    div({ style: { flex: 1, padding: '15px 20px' } }, [
      div({ style: { color: colors.blue[0], fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
      div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [synopsis])
    ]),
    div({
      style: {
        position: 'absolute', top: 0, right: 8,
        color: 'white', fontSize: 6, fontWeight: 'bold',
        backgroundColor: colors.darkBlue[0],
        padding: '10px 2px 3px 2px'
      }
    }, ['WDL'])
  ])
}

const logoTile = logoFile => div({
  style: {
    backgroundImage: `url(${logoFile})`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: 'white',
    backgroundSize: 27,
    width: 37, height: 37,
    marginRight: 13
  }
})


const Code = ajaxCaller(class Code extends Component {
  constructor(props) {
    super(props)
    const { featuredList, methods, firecloudRoot } = StateHistory.get()

    this.state = { featuredList, methods, firecloudRoot }
  }

  async componentDidMount() {
    const { ajax: { Methods } } = this.props

    const [featuredList, methods, firecloudRoot, dockstoreRoot] = await Promise.all([
      fetch(`${await Config.getFirecloudBucketRoot()}/featured-methods.json`).then(res => res.json()),
      Methods.list({ namespace: 'gatk' }),
      Config.getFirecloudUrlRoot(),
      Config.getDockstoreUrlRoot()
    ])

    this.setState({ featuredList, methods, firecloudRoot, dockstoreRoot })
    StateHistory.update({ featuredList, methods, firecloudRoot, dockstoreRoot })
  }

  render() {
    const { featuredList, methods, firecloudRoot, dockstoreRoot } = this.state

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
          div({ style: { margin: '30px 0 30px 40px' } }, [
            div({ style: styles.header }, 'GATK4 Best Practices workflows'),
            div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
              ..._.map(makeCard(firecloudRoot), featuredMethods)
            ])
          ]),
          div({ style: { flex: '0 0 385px', padding: '25px 30px', backgroundColor: colors.gray[5], lineHeight: '20px' } }, [
            div({ style: { ...styles.header, fontSize: 16 } }, 'FIND ADDITIONAL WORKFLOWS'),
            div({ style: { display: 'flex' } }, [
              logoTile(dockstoreLogo),
              div([
                link({ href: dockstoreRoot }, 'Dockstore'),
                div(['Text about Dockstore'])
              ])
            ]),
            div({ style: { display: 'flex', marginTop: 40 } }, [
              logoTile(firecloudLogo),
              div([
                link({ href: `${firecloudRoot}/#methods` }, 'Firecloud Methods Repository'),
                div(['Text about Agora'])
              ])
            ])
          ])
        ])
    ])
  }
})


export const addNavPaths = () => {
  Nav.defPath('library-code', {
    path: '/library/code',
    component: Code,
    public: false,
    title: 'Code & Tools'
  })
}
