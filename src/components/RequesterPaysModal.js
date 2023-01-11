import * as _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { useWorkspaces } from 'src/components/workspace-utils'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { requesterPaysProjectStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const requesterPaysHelpInfo = div({ style: { paddingTop: '1rem' } }, [
  h(Link, {
    href: 'https://support.terra.bio/hc/en-us/articles/360029801491',
    ...Utils.newTabLinkProps
  }, ['Why is a workspace required to access this data?', icon('pop-out', { style: { marginLeft: '0.25rem' }, size: 12 })])
])

const RequesterPaysModal = ({ onDismiss, onSuccess }) => {
  const { workspaces, loading } = useWorkspaces()
  const billableWorkspaces = _.filter(workspace => workspace.accessLevel === 'OWNER' || workspace.accessLevel === 'PROJECT_OWNER', workspaces)

  const [selectedGoogleProject, setSelectedGoogleProject] = useState(requesterPaysProjectStore.get())

  return Utils.cond(
    [loading, () => h(Modal, {
      title: 'Loading',
      onDismiss,
      showCancel: false,
      okButton: false
    }, [
      spinnerOverlay
    ])],
    [billableWorkspaces.length > 0, () => h(Modal, {
      title: 'Choose a workspace to bill to',
      onDismiss,
      shouldCloseOnOverlayClick: false,
      okButton: h(ButtonPrimary, {
        disabled: !selectedGoogleProject,
        onClick: () => {
          onSuccess(selectedGoogleProject)
        }
      }, ['Ok'])
    }, [
      'This data is in a requester pays bucket. Choose a workspace to bill to in order to continue:',
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Workspace']),
        h(Select, {
          id,
          isClearable: false,
          value: selectedGoogleProject,
          placeholder: 'Select a workspace',
          onChange: ({ value }) => setSelectedGoogleProject(value),
          options: _.flow(
            _.map(({ workspace: { googleProject, namespace, name } }) => ({
              value: googleProject, label: `${namespace}/${name}`
            })),
            _.sortBy('label')
          )(billableWorkspaces)
        }),
        requesterPaysHelpInfo
      ])])
    ])],
    () => h(Modal, {
      title: 'Cannot access data',
      onDismiss,
      okButton: h(ButtonPrimary, {
        onClick: () => {
          Nav.goToPath('workspaces')
        }
      }, 'Go to Workspaces')
    }, [
      div('To view or download data in this workspace, please ensure you have at least one workspace with owner or project owner permissions in order to bill to.'),
      requesterPaysHelpInfo
    ])
  )
}

export default RequesterPaysModal
