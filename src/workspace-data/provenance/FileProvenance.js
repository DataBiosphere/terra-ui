import { cond, switchCase } from '@terra-ui-packages/core-utils';
import { h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import * as Nav from 'src/libs/nav';

import { fileProvenanceTypes, useFileProvenance } from './workspace-data-provenance-utils';

export const FileProvenance = ({ workspace, fileUrl }) => {
  const {
    workspace: { namespace, name },
  } = workspace;
  const { fileProvenance, loading, error } = useFileProvenance(workspace, fileUrl);

  return cond([loading, () => 'Loading provenance...'], [!!error, () => 'Unable to load provenance information.'], () =>
    switchCase(
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
