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


class NewGroupModal extends Component {
  render() {
    const { onDismiss, onSuccess } = this.props

    return [
      h(Modal, {
        onDismiss,
        title: 'Create New Group',
        okButton: buttonPrimary({
          onClick: onSuccess
        })
      })
    ]
  }
}

const GroupCard = pure(({ group: { groupName, groupEmail, role }, onDelete }) => {
  const isAdmin = role === 'Admin'

  return a({
    href: isAdmin ? Nav.getLink('group', { groupName }) : undefined,
    style: styles.longCard
  }, [
    div({
      style: {
        width: '30%', color: isAdmin ? Style.colors.secondary : undefined,
        ...styles.longTitle
      }
    }, [groupName]),
    div({ style: { flexGrow: 1 } }, [groupEmail]),
    div({ style: { width: 100, display: 'flex', alignItems: 'center' } }, [
      div({ style: { flexGrow: 1 } }, [role]),
      isAdmin && link({ onClick: onDelete, as: 'div' }, [
        icon('trash', { className: 'is-solid', size: 17 })
      ])
    ])
  ])
})

const NewGroupCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: styles.shortCreateCard,
    onClick
  }, [
    div(['Create a']),
    div(['New Group']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export class GroupList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      groups: null,
      creatingNewGroup: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    try {
      this.setState({ isDataLoaded: false })
      const groups = await Rawls.listGroups()
      this.setState({
        isDataLoaded: true,
        groups: _.sortBy('group.groupName', groups)
      })
    } catch (error) {
      reportError('Error loading group list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { groups, isDataLoaded, filter, creatingNewGroup } = this.state

    return h(Fragment, [
      h(TopBar, { title: 'Groups' }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH GROUPS',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      div({ style: styles.toolbarContainer }, [
        div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, [
          'Group Management'
        ]),
        div({ style: styles.toolbarButtons }, [
          h(Clickable, {
            style: styles.toolbarButton,
            onClick: () => {}
          }, [icon('filter', { className: 'is-solid', size: 24 })])
        ])
      ]),
      div({ style: styles.cardContainer }, [
        h(NewGroupCard, {
          onClick: () => this.setState({ creatingNewGroup: true })
        }),
        div({ style: { flexGrow: 1 } },
          _.map(group => {
            return h(GroupCard, { group, key: group.groupName })
          }, _.filter(({ groupName }) => Utils.textMatch(filter, groupName), groups))
        ),
        !isDataLoaded && spinnerOverlay
      ]),
      creatingNewGroup && h(NewGroupModal, {
        onDismiss: () => this.setState({ creatingNewGroup: false }),
        onSuccess: () => {
          this.setState({ creatingNewGroup: false })
          this.refresh()
        }
      })
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['groups', 'filter'],
      this.state)
    )
  }
}


export const addNavPaths = () => {
  Nav.defPath('groups', {
    path: '/groups',
    component: GroupList,
    title: 'Group Management'
  })
}
