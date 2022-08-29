import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, li, ol, p, span } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { maxSubmissionsQueriedForProvenance } from 'src/libs/data-table-provenance'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'


export const DataTableColumnProvenance = ({ workspace, column, provenance }) => {
  const { workspace: { namespace, name } } = workspace

  if (!provenance) {
    return p([
      'No provenance information available for column ',
      span({ style: { fontWeight: 600 } }, [column]), '. ',
      `It was not configured as an output in any of the last ${maxSubmissionsQueriedForProvenance} workflows run on this data type.`
    ])
  }

  return h(Fragment, [
    p([
      span({ style: { fontWeight: 600 } }, [column]),
      ' was configured as an output for the following submissions:'
    ]),
    ol({ style: { margin: 0, padding: 0, listStyleType: 'none' } }, [
      _.map(({ submissionId, submissionDate, configuration, output }) => {
        return li({ key: submissionId, style: { marginBottom: '0.75rem' } }, [
          div({ style: { marginBottom: '0.25rem' } }, [
            h(Link, {
              href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId })
            }, [configuration.name])
          ]),
          div({ style: { marginBottom: '0.25rem' } }, [Utils.makeCompleteDate(submissionDate)]),
          div({ style: { marginBottom: '0.25rem' } }, [output])
        ])
      }, provenance)
    ])
  ])
}
