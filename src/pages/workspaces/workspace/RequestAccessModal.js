import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { cond, useOnMount, withBusyState } from 'src/libs/utils'


export const RequestAccessModal = ({ onDismiss, workspace }) => {
  const [groups, setGroups] = useState([])
  const [accessInstructions, setAccessInstructions] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingAccessInstructions, setLoadingAccessInstructions] = useState(false)
  const signal = useCancellation()

  const { Groups, Workspaces } = Ajax(signal)

  const fetchGroups = _.flow(
    withBusyState(setLoadingGroups),
    withErrorReporting('Error loading groups')
  )(async () => {
    setGroups(await Groups.list())
  })

  const fetchAccessInstructions = _.flow(
    withBusyState(setLoadingAccessInstructions),
    withErrorReporting('Error loading groups')
  )(async () => {
    const i = await Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name).accessInstructions()
    console.log(i)
    setAccessInstructions(i)
  })

  useOnMount(() => {
    fetchGroups()
    fetchAccessInstructions()
  })

  const loading = loadingGroups || loadingAccessInstructions
  const groupNames = _.map('groupName', groups)
  const authDomain = workspace.workspace.authorizationDomain
  return h(Modal, {
    title: 'Request Access',
    width: '40rem',
    showCancel: false,
    onDismiss
  }, [
    div(['You cannot access this Workspace because it contains restricted data. You need permission from the admin(s) of all of the Groups in the Authorization Domain protecting the workspace.']),
    loading ?
      centeredSpinner({ size: 32 }) :
      table({ style: { margin: '1rem', width: '100%' } }, [
        thead([
          tr({ style: { height: '2rem' } }, [th({ style: { textAlign: 'left' } }, ['Group Name']), th({ style: { textAlign: 'left', width: '15rem' } }, ['Access'])])
        ]),
        tbody(
          _.map(({ membersGroupName: groupName }) => tr({ style: { height: '2rem' } }, [
            td([groupName]),
            td([
              _.includes(groupName, groupNames) ?
                'Yes' :
                h(RequestAccessButton, {
                  groupName,
                  instructions: accessInstructions[groupName]
                })
            ])
          ]), authDomain)
        )
      ])
  ])
}

const RequestAccessButton = ({ groupName, instructions }) => {
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const signal = useCancellation()

  const { Groups } = Ajax(signal)

  const requestAccess = _.flow(
    withBusyState(setRequesting),
    withErrorReporting('Error requesting group access')
  )(async () => {
    await Groups.group(groupName).requestAccess()
    setRequested(true)
  })

  return buttonPrimary({
    disabled: requesting || requested,
    onClick: async () => {
      await requestAccess()
      setRequested(true)
    }
  }, [
    cond(
      [requested, 'Request Sent'],
      [requesting, 'Sending Request...'],
      'Request Access'
    )
  ])
}
