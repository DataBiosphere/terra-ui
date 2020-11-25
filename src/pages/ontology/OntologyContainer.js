import _ from 'lodash/fp'
import { useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { OntologyModal } from 'src/pages/ontology/OntologyModal'


const OntologyContainer = ({ title, setModalOpen, children }) => {
  return h(FooterWrapper, [
    h(TopBar, { title, href: Nav.getLink('root') }, [
      div({ style: { flexGrow: 1 } }),
      div({
        onClick: () => setModalOpen(true), style: {
          height: '3rem',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: colors.light(1),
          padding: '0 1rem',
          borderTopLeftRadius: 5,
          borderBottomLeftRadius: 5,
          cursor: 'pointer'
        }
      }, [
        icon('project-diagram', { size: 21, style: { color: colors.accent(1) } }),
        div({ style: { marginLeft: 10 } }, ['Ontology Search'])
      ])
    ]),
    div({ role: 'main', style: Style.elements.pageContentContainer }, [children])
  ])
}

export const wrapOntology = ({ title }) => WrappedComponent => {
  const Wrapper = props => {
    const [modalOpen, setModalOpen] = useState(false)
    const child = useRef()
    return h(OntologyContainer, {
      title: _.isFunction(title) ? title(props) : title,
      setModalOpen
    }, [
      h(WrappedComponent, {
        ref: child, ...props
      }),
      h(OntologyModal, { isOpen: modalOpen, onDismiss: () => setModalOpen(false) })
    ])
  }
  return Utils.withDisplayName('wrapOntology', Wrapper)
}
