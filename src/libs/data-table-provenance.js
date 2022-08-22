import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { Ajax } from 'src/libs/ajax'
import { isDataTableProvenanceEnabled } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'


export const maxSubmissionsQueriedForProvenance = 25

const getSubmissionsWithRootEntityType = async (workspace, entityType, { signal } = {}) => {
  const { workspace: { namespace, name } } = workspace

  // The root entity type is stored on method configurations, not submissions. To avoid fetching
  // every submission's configuration, first use the list submissions endpoint and filter by
  // submission entity type.
  //
  // If a workflow is run on a single entity, the submission entity type will be the root entity type.
  // If a workflow is run on multiple entities, the submission entity type will be a set of the root entity type.
  //
  // After fetching method configurations, another filter is required remove submissions whose root entity type
  // was a set of the desired entity type.
  const allSubmissions = await Ajax(signal).Workspaces.workspace(namespace, name).listSubmissions()
  const submissionsMaybeUsingEntityType = _.flow(
    _.filter(submission => {
      const submissionEntityType = submission.submissionEntity.entityType
      return submissionEntityType === entityType || submissionEntityType === `${entityType}_set`
    }),
    _.slice(0, maxSubmissionsQueriedForProvenance)
  )(allSubmissions)

  const submissionConfigurations = await Promise.all(
    _.map(
      submission => Ajax(signal).Workspaces.workspace(namespace, name).submission(submission.submissionId).getConfiguration(),
      submissionsMaybeUsingEntityType
    )
  )

  return _.flow(
    _.map(([submission, configuration]) => ({ submission, configuration })),
    _.filter(({ configuration }) => configuration.rootEntityType === entityType),
    _.orderBy(({ submission }) => new Date(submission.submissionDate), 'desc')
  )(_.zip(submissionsMaybeUsingEntityType, submissionConfigurations))
}

const getColumnFromOutputExpression = expr => {
  const match = /^this\.([^.]+)$/.exec(expr)
  return match ? match[1] : null
}

const getColumnProvenance = async (workspace, entityType, { signal } = {}) => {
  const submissions = await getSubmissionsWithRootEntityType(workspace, entityType, { signal })

  return _.flow(
    _.flatMap(({ submission, configuration }) => _.map(([output, expression]) => ({ submission, configuration, output, expression }), _.toPairs(configuration.outputs))),
    _.map(({ submission, configuration, output, expression }) => ({ submission, configuration, output, column: getColumnFromOutputExpression(expression) })),
    _.filter(({ column }) => !!column),
    _.reduce((acc, { submission, configuration, output, column }) => {
      const provenanceEntry = { submissionId: submission.submissionId, submissionDate: submission.submissionDate, configuration, output }
      return _.update(column, _.flow(_.defaultTo([]), Utils.append(provenanceEntry)), acc)
    }, {})
  )(submissions)
}

export const useColumnProvenance = (workspace, entityType) => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(true)
  const [columnProvenance, setColumnProvenance] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadColumnProvenance = async () => {
      setError(null)
      setLoading(true)
      try {
        setColumnProvenance(await getColumnProvenance(workspace, entityType, { signal }))
      } catch (error) {
        setError(error)
        reportError('Error loading column provenance', error)
      } finally {
        setLoading(false)
      }
    }

    if (isDataTableProvenanceEnabled()) {
      loadColumnProvenance()
    }
  }, [workspace, entityType, signal])

  return { columnProvenance, loading, error }
}
