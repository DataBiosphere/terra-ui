import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'


type ImportDockstoreWorkflowArgs = {
  workspace: {
    namespace: string
    name: string
  }
  workflow: {
    path: string
    version: string
    source: string
  }
  workflowName: string
}

export const importDockstoreWorkflow = async ({ workspace, workflow, workflowName }: ImportDockstoreWorkflowArgs) => {
  const { name, namespace } = workspace
  const { path, version, source } = workflow

  const workspaceApi = Ajax().Workspaces.workspace(namespace, name)

  const [entityMetadata, { outputs: workflowOutputs }] = await Promise.all([
    workspaceApi.entityMetadata(),
    Ajax().Methods.configInputsOutputs({
      methodRepoMethod: {
        methodPath: path,
        methodVersion: version,
        sourceRepo: source,
      }
    }),
  ])

  const defaultOutputConfiguration = _.flow(
    _.map((output: { name: string }) => {
      const outputExpression = `this.${_.last(_.split('.', output.name))}`
      return [output.name, outputExpression]
    }),
    _.fromPairs
  )(workflowOutputs)

  await workspaceApi.importMethodConfigFromDocker({
    namespace, name: workflowName,
    rootEntityType: _.head(_.keys(entityMetadata)),
    inputs: {},
    outputs: defaultOutputConfiguration,
    prerequisites: {},
    methodConfigVersion: 1,
    deleted: false,
    methodRepoMethod: {
      sourceRepo: source,
      methodPath: path,
      methodVersion: version
    }
  })
}
