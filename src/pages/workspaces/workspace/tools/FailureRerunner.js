import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { icon, spinner } from 'src/components/icons'
import { popNotification, pushNotification } from 'src/components/Notifications'
import { Ajax } from 'src/libs/ajax'
import { launch } from 'src/libs/analysis'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const toastProps = Utils.atom(undefined)

const ToastMessageComponent = Utils.connectAtom(toastProps, 'toastProps')(class ToastMessageComponent extends Component {
  render() {
    const { toastProps: { done, text } } = this.props

    return div({
      style: {
        width: '100%', padding: '1rem', borderRadius: 8,
        backgroundColor: done ? colors.green[0] : colors.gray[0],
        color: 'white'
      }
    }, [
      done ? icon('check', { size: 24, style: { marginRight: '1rem' } }) : spinner({ style: { marginRight: '1rem' } }),
      text
    ])
  }
})

export const rerunFailures = async ({ namespace, name, submissionId, configNamespace, configName, onDone }) => {
  toastProps.set({ text: 'Loading tool info...' })
  const id = pushNotification({
    dismiss: { duration: 0 },
    content: h(ToastMessageComponent)
  })

  try {
    const workspace = Ajax().Workspaces.workspace(namespace, name)
    const methodConfig = workspace.methodConfig(configNamespace, configName)

    const [{ workflows, useCallCache }, { rootEntityType }] = await Promise.all([
      workspace.submission(submissionId).get(),
      methodConfig.get()
    ])

    const failedEntities = _.flow(
      _.filter(v => { return (v.status === 'Aborted' || v.status === 'Failed') }),
      _.map('workflowEntity')
    )(workflows)

    const newSetName = `${configName}-resubmission-${new Date().toISOString().slice(0, -5).replace(/:/g, '-')}`

    await launch({
      workspaceNamespace: namespace, workspaceName: name,
      config: { namespace: configNamespace, name: configName, rootEntityType },
      entityType: rootEntityType, entityNames: _.map('entityName', failedEntities),
      newSetName, useCallCache,
      onCreateSet: () => toastProps.set({ text: 'Creating set from failures...' }),
      onLaunch: () => toastProps.set({ text: 'Launching new job...' }),
      onSuccess: () => {
        toastProps.set({ text: 'Success!', done: true })
        onDone()
      },
      onFailure: error => {
        popNotification(id)
        reportError('Error rerunning failed workflows', error)
      }
    })

    await Utils.delay(2000)
  } catch (error) {
    reportError('Error rerunning failed workflows', error)
  } finally {
    popNotification(id)
  }
}
