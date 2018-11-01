import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { icon, spinner } from 'src/components/icons'
import { popNotification, pushNotification } from 'src/components/Notifications'
import { Ajax } from 'src/libs/ajax'
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
        backgroundColor: done ? colors.green[0] : colors.blue[0],
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

    const [{ workflows, submissionEntity, useCallCache }, { rootEntityType }] = await Promise.all([
      workspace.submission(submissionId).get(),
      methodConfig.get()
    ])

    toastProps.set({ text: 'Creating set from failures...' })

    const failedEntities = _.flow(
      _.filter({ status: 'Failed' }),
      _.map('workflowEntity')
    )(workflows)

    const newSetName = `${configName}-${submissionId.slice(0, 5)}-resubmission`
    const newSetType = submissionEntity.entityType
    const newSet = {
      name: newSetName,
      entityType: newSetType,
      attributes: {
        [`${failedEntities[0].entityType}s`]: {
          itemsType: 'EntityReference',
          items: failedEntities
        }
      }
    }

    await workspace.createEntity(newSet)

    toastProps.set({ text: 'Launching new job...' })

    await methodConfig.launch({
      entityName: newSetName,
      entityType: newSetType,
      expression: newSetType !== rootEntityType ? `this.${rootEntityType}s` : undefined,
      useCallCache
    })

    toastProps.set({ text: 'Success!', done: true })

    onDone()

    await Utils.delay(2000)
  } catch (error) {
    reportError('Error rerunning failed workflows', error)
  } finally {
    popNotification(id)
  }
}
