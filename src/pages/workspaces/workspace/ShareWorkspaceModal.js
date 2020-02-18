import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, CreatableSelect, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const styles = {
  currentCollaboratorsArea: {
    margin: '0.5rem -1.25rem 0',
    padding: '1rem 1.25rem',
    maxHeight: 550,
    overflowY: 'auto',
    borderBottom: Style.standardLine,
    borderTop: Style.standardLine
  },
  pending: {
    textTransform: 'uppercase', fontWeight: 500,
    color: colors.warning()
  }
}

const AclInput = ({ value, onChange, disabled, maxAccessLevel }) => {
  const { accessLevel, canShare, canCompute } = value
  return div({ style: { display: 'flex', marginTop: '0.25rem' } }, [
    div({ style: { width: 200 } }, [
      h(Select, {
        isSearchable: false,
        isDisabled: disabled,
        getOptionLabel: o => Utils.normalizeLabel(o.value),
        isOptionDisabled: o => !Utils.hasAccessLevel(o.value, maxAccessLevel),
        value: accessLevel,
        onChange: o => onChange({
          ...value,
          accessLevel: o.value,
          ...Utils.switchCase(o.value,
            ['READER', () => ({ canCompute: false, canShare: false })],
            ['WRITER', () => ({ canCompute: true, canShare: false })],
            ['OWNER', () => ({ canCompute: true, canShare: true })]
          )
        }),
        options: accessLevel === 'PROJECT_OWNER' ? ['PROJECT_OWNER'] : ['READER', 'WRITER', 'OWNER'],
        menuPortalTarget: document.getElementById('modal-root')
      })
    ]),
    div({ style: { marginLeft: '1rem' } }, [
      div([
        h(LabeledCheckbox, {
          disabled: disabled || accessLevel === 'OWNER',
          checked: canShare,
          onChange: () => onChange(_.update('canShare', b => !b, value))
        }, [' Can share'])
      ]),
      div([
        h(LabeledCheckbox, {
          disabled: disabled || accessLevel !== 'WRITER',
          checked: canCompute,
          onChange: () => onChange(_.update('canCompute', b => !b, value))
        }, [' Can compute'])
      ])
    ])
  ])
}

export default ajaxCaller(class ShareWorkspaceModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      shareSuggestions: [],
      groups: [],
      originalAcl: [],
      acl: [],
      loaded: false
    }
  }

  render() {
    const { onDismiss } = this.props
    const { acl, shareSuggestions, groups, loaded, working, updateError } = this.state

    const suggestions = _.flow(
      _.map('groupEmail'),
      _.concat(shareSuggestions),
      list => _.difference(list, _.map('email', acl)),
      _.uniq,
      _.map(value => ({ label: value, value }))
    )(groups)

    return h(Modal, {
      title: 'Share Workspace',
      width: 550,
      okButton: h(ButtonPrimary, { onClick: () => this.save() }, ['Save']),
      onDismiss
    }, [
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id }, ['User email']),
        h(CreatableSelect, {
          id,
          isLoading: !loaded,
          placeholder: 'Add people or groups',
          'aria-label': 'Enter an email address of a person or group',
          isValidNewOption: val => !validate.single(val, { email: true }),
          noOptionsMessage: () => 'Enter an email address',
          allowCreateWhileLoading: true,
          options: suggestions,
          isClearable: true,
          formatCreateLabel: _.identity,
          value: null,
          onChange: ({ value }) => this.setState(_.update('acl', Utils.append({ email: value, accessLevel: 'READER' }))),
          components: { DropdownIndicator: () => null }
        })
      ])]),
      div({ style: { ...Style.elements.sectionHeader, marginTop: '1rem' } }, ['Current Collaborators']),
      div({ style: styles.currentCollaboratorsArea }, [
        h(Fragment, _.map(this.renderCollaborator, Utils.toIndexPairs(acl))),
        !loaded && centeredSpinner()
      ]),
      updateError && div({ style: { marginTop: '1rem' } }, [
        div(['An error occurred:']),
        updateError
      ]),
      working && spinnerOverlay
    ])
  }

  renderCollaborator = ([index, aclItem]) => {
    const { email, accessLevel, pending } = aclItem
    const POAccessLevel = 'PROJECT_OWNER'
    const isPO = accessLevel === POAccessLevel
    const isMe = email === getUser().email
    const { workspace } = this.props
    const { acl, originalAcl } = this.state

    return div({
      style: {
        display: 'flex', alignItems: 'center', borderRadius: 5,
        padding: '0.5rem 0.75rem', marginBottom: 10,
        backgroundColor: _.find({ email }, originalAcl) ? colors.light(0.65) : colors.success(0.15)
      }
    }, [
      div({ style: { flex: 1 } }, [
        email,
        pending && div({ style: styles.pending }, ['Pending']),
        h(AclInput, {
          value: aclItem,
          onChange: v => this.setState(_.set(['acl', index], v)),
          disabled: isPO || isMe,
          maxAccessLevel: workspace.accessLevel
        })
      ]),
      !isPO && !isMe && h(Link, {
        onClick: () => this.setState({ acl: _.remove({ email }, acl) })
      }, [icon('times', { size: 20, style: { marginRight: '0.5rem' } })])
    ])
  }

  async componentDidMount() {
    const { workspace: { workspace: { namespace, name } }, onDismiss, ajax: { Workspaces, Groups } } = this.props

    try {
      const [{ acl }, shareSuggestions, groups] = await Promise.all([
        Workspaces.workspace(namespace, name).getAcl(),
        Workspaces.getShareLog(),
        Groups.list()
      ])

      const fixedAcl = _.flow(
        _.toPairs,
        _.map(([email, data]) => ({ email, ...data })),
        _.sortBy(x => -Utils.workspaceAccessLevels.indexOf(x.accessLevel))
      )(acl)

      this.setState({
        acl: fixedAcl,
        originalAcl: fixedAcl,
        groups,
        shareSuggestions,
        loaded: true
      })
    } catch (error) {
      onDismiss()
      reportError('Error looking up collaborators', error)
    }
  }

  async save() {
    const { workspace: { workspace: { namespace, name } }, onDismiss } = this.props
    const { acl, originalAcl } = this.state

    const aclEmails = _.map('email', acl)
    const needsDelete = _.remove(entry => aclEmails.includes(entry.email), originalAcl)
    const numAdditions = _.filter(({ email }) => !_.some({ email }, originalAcl), acl).length

    const aclUpdates = [
      ..._.flow(
        _.remove({ accessLevel: 'PROJECT_OWNER' }),
        _.map(_.pick(['email', 'accessLevel', 'canShare', 'canCompute']))
      )(acl),
      ..._.map(({ email }) => ({ email, accessLevel: 'NO ACCESS' }), needsDelete)
    ]

    try {
      this.setState({ working: true })
      await Ajax().Workspaces.workspace(namespace, name).updateAcl(aclUpdates)
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { numAdditions, success: true })
      onDismiss()
    } catch (error) {
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { numAdditions, success: false })
      this.setState({ updateError: await error.text(), working: false })
    }
  }
})
