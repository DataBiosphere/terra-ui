import _ from 'lodash/fp'
import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { div, h, h2, p } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { AutocompleteTextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
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

const AclInput = ({ value, onChange, disabled, maxAccessLevel, autoFocus, ...props }) => {
  const { accessLevel, canShare, canCompute } = value
  return div({ style: { display: 'flex', marginTop: '0.25rem' } }, [
    div({ style: { width: 200 } }, [
      h(Select, {
        autoFocus,
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
        menuPortalTarget: document.getElementById('modal-root'),
        ...props
      })
    ]),
    div({ style: { marginLeft: '1rem' } }, [
      div({ style: { marginBottom: '0.2rem' } }, [
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

const ShareWorkspaceModal = ({ onDismiss, workspace, workspace: { workspace: { namespace, name } } }) => {
  // State
  const [shareSuggestions, setShareSuggestions] = useState([])
  const [groups, setGroups] = useState([])
  const [originalAcl, setOriginalAcl] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [acl, setAcl] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [working, setWorking] = useState(false)
  const [updateError, setUpdateError] = useState(undefined)
  const [lastAddedEmail, setLastAddedEmail] = useState(undefined)
  const [searchHasFocus, setSearchHasFocus] = useState(true)

  const list = useRef()
  const signal = useCancellation()


  // Helpers
  const save = Utils.withBusyState(setWorking, async () => {
    const aclEmails = _.map('email', acl)
    const needsDelete = _.remove(entry => aclEmails.includes(entry.email), originalAcl)
    const numAdditions = _.filter(({ email }) => !_.some({ email }, originalAcl), acl).length
    const eventData = { numAdditions, workspaceName: name, workspaceNamespace: namespace }

    const aclUpdates = [
      ..._.flow(
        _.remove({ accessLevel: 'PROJECT_OWNER' }),
        _.map(_.pick(['email', 'accessLevel', 'canShare', 'canCompute']))
      )(acl),
      ..._.map(({ email }) => ({ email, accessLevel: 'NO ACCESS' }), needsDelete)
    ]

    try {
      await Ajax().Workspaces.workspace(namespace, name).updateAcl(aclUpdates)
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { ...eventData, success: true })
      onDismiss()
    } catch (error) {
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { ...eventData, success: false })
      setUpdateError(await error.text())
    }
  })

  const renderCollaborator = ([index, aclItem]) => {
    const { email, accessLevel, pending } = aclItem
    const POAccessLevel = 'PROJECT_OWNER'
    const disabled = accessLevel === POAccessLevel || email === getUser().email
    const isOld = _.find({ email }, originalAcl)

    return div({
      role: 'listitem',
      style: {
        display: 'flex', alignItems: 'center', borderRadius: 5,
        padding: '0.5rem 0.75rem', marginBottom: 10,
        border: isOld ? `1px solid ${colors.dark(0.25)}` : ` 2px dashed ${colors.success(0.5)}`,
        backgroundColor: isOld ? colors.light(0.2) : colors.success(0.05)
      }
    }, [
      div({ style: { flex: 1 } }, [
        email,
        pending && div({ style: styles.pending }, ['Pending']),
        h(AclInput, {
          'aria-label': `permissions for ${email}`,
          autoFocus: email === lastAddedEmail,
          value: aclItem,
          onChange: v => setAcl(_.set([index], v)),
          disabled,
          maxAccessLevel: workspace.accessLevel
        })
      ]),
      !disabled && h(Link, {
        tooltip: 'Remove',
        onClick: () => setAcl(_.remove({ email }))
      }, [icon('times', { size: 20, style: { marginRight: '0.5rem' } })])
    ])
  }


  // Lifecycle
  useOnMount(() => {
    const load = async () => {
      try {
        const [{ acl }, shareSuggestions, groups] = await Promise.all([
          Ajax(signal).Workspaces.workspace(namespace, name).getAcl(),
          Ajax(signal).Workspaces.getShareLog(),
          Ajax(signal).Groups.list()
        ])

        const fixedAcl = _.flow(
          _.toPairs,
          _.map(([email, data]) => ({ email, ...data })),
          _.sortBy(x => -Utils.workspaceAccessLevels.indexOf(x.accessLevel))
        )(acl)

        setAcl(fixedAcl)
        setOriginalAcl(fixedAcl)
        setGroups(groups)
        setShareSuggestions(shareSuggestions)
        setLoaded(true)
      } catch (error) {
        onDismiss()
        reportError('Error looking up collaborators', error)
      }
    }

    load()
  })

  useLayoutEffect(() => {
    !!lastAddedEmail && list.current.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [lastAddedEmail])


  // Render
  const searchValueValid = !validate({ searchValue }, { searchValue: { email: true } })
  const aclEmails = _.map('email', acl)

  const suggestions = _.flow(
    _.map('groupEmail'),
    _.concat(shareSuggestions),
    list => _.difference(list, aclEmails),
    _.uniq
  )(groups)

  const remainingSuggestions = _.difference(suggestions, _.map('email', acl))

  const addUserReminder = `Did you mean to add ${searchValue} as a collaborator? Add them or clear the "User email" field to save changes.`

  return h(Modal, {
    title: 'Share Workspace',
    width: 550,
    okButton: h(ButtonPrimary, {
      disabled: searchValueValid,
      tooltip: searchValueValid && addUserReminder,
      onClick: save
    }, ['Save']),
    onDismiss
  }, [
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { htmlFor: id }, ['User email']),
      h(AutocompleteTextInput, {
        id,
        openOnFocus: true,
        placeholderText: _.includes(searchValue, aclEmails) ?
          'This email has already been added to the list' :
          'Type an email address and press "Enter" or "Return"',
        onPick: value => {
          if (!validate.single(value, { email: true, exclusion: aclEmails })) {
            setSearchValue('')
            setAcl(Utils.append({ email: value, accessLevel: 'READER' }))
            setLastAddedEmail(value)
          }
        },
        placeholder: 'Add people or groups',
        value: searchValue,
        onFocus: () => { setSearchHasFocus(true) },
        onBlur: () => { setSearchHasFocus(false) },
        onChange: setSearchValue,
        suggestions: Utils.cond(
          [searchValueValid && !_.includes(searchValue, aclEmails), () => [searchValue]],
          [remainingSuggestions.length, () => remainingSuggestions],
          () => []
        ),
        style: { fontSize: 16 }
      })
    ])]),
    searchValueValid && !searchHasFocus && p({ style: { color: colors.danger() } }, addUserReminder),
    h2({ style: { ...Style.elements.sectionHeader, margin: '1rem 0 0.5rem 0' } }, ['Current Collaborators']),
    div({ ref: list, role: 'list', style: styles.currentCollaboratorsArea }, [
      h(Fragment, _.map(renderCollaborator, Utils.toIndexPairs(acl))),
      !loaded && centeredSpinner()
    ]),
    updateError && div({ style: { marginTop: '1rem' } }, [
      div(['An error occurred:']),
      updateError
    ]),
    working && spinnerOverlay
  ])
}

export default ShareWorkspaceModal
