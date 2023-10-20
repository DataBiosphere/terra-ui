import _ from 'lodash/fp';
import { Fragment, ReactNode } from 'react';
import { div, h, li, ol, p, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

import { maxSubmissionsQueriedForProvenance } from './workspace-data-provenance-utils';

export interface DataTableColumnProvenanceProps {
  workspace: WorkspaceWrapper;
  column: string;
  provenance: any;
}

export const DataTableColumnProvenance = (props: DataTableColumnProvenanceProps): ReactNode => {
  const { workspace, column, provenance } = props;
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
