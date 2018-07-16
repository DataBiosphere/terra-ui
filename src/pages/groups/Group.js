import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, link, search, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { styles } from 'src/pages/groups/common'


class NewUserModal extends Component {
  render() {
    const { onDismiss, onSuccess } = this.props

    return [
      h(Modal, {
        onDismiss,
        title: 'Add user to Saturn Group',
        okButton: buttonPrimary({
          onClick: onDismiss
        })
      })
    ]
  }
}

const MemberCard = pure(({ member: { email, isAdmin }, onDelete }) => {
  return div({
    style: styles.longCard
  }, [
    div({}, email)
    // div({
    //   style: {
    //     width: '30%', color: role === 'Admin' ? Style.colors.secondary : undefined,
    //     ...styles.longTitle
    //   }
    // }, [groupName]),
    // div({ style: { flexGrow: 1 } }, [groupEmail]),
    // div({ style: { width: 100, display: 'flex', alignItems: 'center' } }, [
    //   div({ style: { flexGrow: 1 } }, [role]),
    //   role === 'Admin' && link({ onClick: onDelete, as: 'div' }, [
    //     icon('trash', { className: 'is-solid', size: 17 })
    //   ])
    // ])
  ])
})

const NewUserCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: styles.shortCreateCard,
    onClick
  }, [
    div(['Add a User']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export class GroupDetails extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      members: null,
      creatingNewUser: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { groupName } = this.props

    try {
      this.setState({ isDataLoaded: false })
      const { membersEmails, adminsEmails } = await Rawls.group(groupName).listMembers()
      this.setState({
        isDataLoaded: true,
        members: _.concat(
          _.map(adm => ({ email: adm, isAdmin: true }), adminsEmails),
          _.map(mem => ({ email: mem, isAdmin: false }), membersEmails)
        )
      })
    } catch (error) {
      reportError('Error loading group list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { members, isDataLoaded, filter, creatingNewUser } = this.state
    const { groupName } = this.props

    return h(Fragment, [
      h(TopBar, { title: 'Groups' }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH GROUP',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      div({ style: styles.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          `Group Management: ${groupName}`
        ]),
        div({ style: styles.toolbarButtons }, [
          h(Clickable, {
            style: styles.toolbarButton,
            onClick: () => {}
          }, [icon('filter', { className: 'is-solid', size: 24 })])
        ])
      ]),
      div({ style: styles.cardContainer }, [
        h(NewUserCard, {
          onClick: () => this.setState({ creatingNewUser: true })
        }),
        div({ style: { flexGrow: 1 } },
          _.map(member => {
            return h(MemberCard, { member })
          }, _.filter(({ email }) => Utils.textMatch(filter, email), members))
        ),
        !isDataLoaded && spinnerOverlay
      ]),
      creatingNewUser && h(NewUserModal, {
        onDismiss: () => this.setState({ creatingNewUser: false }),
        onSuccess: () => {
          this.setState({ creatingNewUser: false })
          this.refresh()
        }
      })
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['members', 'filter'],
      this.state)
    )
  }
}


export const addNavPaths = () => {
  Nav.defPath('group', {
    path: '/groups/:groupName',
    component: GroupDetails,
    title: ({ groupName }) => `Group Management - ${groupName}`
  })
}
