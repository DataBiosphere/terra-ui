import _ from 'lodash/fp';
import { Fragment } from 'react';
import { div, h, li, ol, p, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { fileProvenanceTypes, maxSubmissionsQueriedForProvenance, useFileProvenance } from 'src/libs/data-table-provenance';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

export const DataTableColumnProvenance = ({ workspace, column, provenance }) => {
  const {
    workspace: { namespace, name },
  } = workspace;

  if (!provenance) {
    return p([
      'No provenance information available for column ',
      span({ style: { fontWeight: 600 } }, [column]),
      '. ',
      `It was not configured as an output in any of the last ${maxSubmissionsQueriedForProvenance} workflows run on this data type.`,
    ]);
  }

  return h(Fragment, [
    p([span({ style: { fontWeight: 600 } }, [column]), ' was configured as an output for the following submissions:']),
    ol({ style: { margin: 0, padding: 0, listStyleType: 'none' } }, [
      _.map(({ submissionId, submissionDate, submitter, configuration, output }) => {
        return li({ key: submissionId, style: { marginBottom: '0.75rem' } }, [
          div({ style: { marginBottom: '0.25rem' } }, [
            h(
              Link,
              {
                href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId }),
              },
              [configuration.name]
            ),
          ]),
          div({ style: { marginBottom: '0.25rem' } }, [Utils.makeCompleteDate(submissionDate)]),
          div({ style: { marginBottom: '0.25rem' } }, [`Submitted by ${submitter}`]),
          div({ style: { marginBottom: '0.25rem' } }, [output]),
        ]);
      }, provenance),
    ]),
  ]);
};

export const FileProvenance = ({ workspace, fileUrl }) => {
  const {
    workspace: { namespace, name },
  } = workspace;
  const { fileProvenance, loading, error } = useFileProvenance(workspace, fileUrl);

  return Utils.cond([loading, () => 'Loading provenance...'], [error, () => 'Unable to load provenance information.'], () =>
    Utils.switchCase(
      fileProvenance.type,
      [fileProvenanceTypes.externalFile, () => 'Unknown. Provenance information is only available for files in the workspace bucket.'],
      [fileProvenanceTypes.unknown, () => 'Unknown. This file does not appear to be associated with a submission.'],
      [
        fileProvenanceTypes.maybeSubmission,
        () =>
          span([
            'Unknown. This file may be associated with submission ',
            h(
              Link,
              {
                'aria-label': 'possible parent submission',
                href: Nav.getLink('workspace-submission-details', {
                  namespace,
                  name,
                  submissionId: fileProvenance.submissionId,
                }),
              },
              [fileProvenance.submissionId]
            ),
            ', but it was not found in workflow outputs.',
          ]),
      ],
      [
        fileProvenanceTypes.workflowOutput,
        () =>
          span([
            'This file is an output of workflow ',
            h(
              Link,
              {
                'aria-label': 'parent workflow',
                href: Nav.getLink('workspace-workflow-dashboard', {
                  namespace,
                  name,
                  submissionId: fileProvenance.submissionId,
                  workflowId: fileProvenance.workflowId,
                }),
              },
              [fileProvenance.workflowId]
            ),
            ' (part of submission ',
            h(
              Link,
              {
                'aria-label': 'parent submission',
                href: Nav.getLink('workspace-submission-details', {
                  namespace,
                  name,
                  submissionId: fileProvenance.submissionId,
                }),
              },
              [fileProvenance.submissionId]
            ),
            ').',
          ]),
      ],
      [
        fileProvenanceTypes.workflowLog,
        () =>
          span([
            'This file is a log from workflow ',
            h(
              Link,
              {
                'aria-label': 'parent workflow',
                href: Nav.getLink('workspace-workflow-dashboard', {
                  namespace,
                  name,
                  submissionId: fileProvenance.submissionId,
                  workflowId: fileProvenance.workflowId,
                }),
              },
              [fileProvenance.workflowId]
            ),
            ' (part of submission ',
            h(
              Link,
              {
                'aria-label': 'parent submission',
                href: Nav.getLink('workspace-submission-details', {
                  namespace,
                  name,
                  submissionId: fileProvenance.submissionId,
                }),
              },
              [fileProvenance.submissionId]
            ),
            ').',
          ]),
      ]
    )
  );
};
