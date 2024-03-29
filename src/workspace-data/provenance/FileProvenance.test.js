import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { FileProvenance } from './FileProvenance';
import { fileProvenanceTypes, useFileProvenance } from './workspace-data-provenance-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: () => '',
}));

jest.mock('./workspace-data-provenance-utils', () => ({
  ...jest.requireActual('./workspace-data-provenance-utils'),
  useFileProvenance: jest.fn(),
}));

describe('FileProvenance', () => {
  const testCases = [
    [{ type: fileProvenanceTypes.externalFile }, 'Unknown. Provenance information is only available for files in the workspace bucket.'],
    [{ type: fileProvenanceTypes.unknown }, 'Unknown. This file does not appear to be associated with a submission.'],
    [
      { type: fileProvenanceTypes.maybeSubmission, submissionId: '842371e3-2cea-4929-94f4-dda074e6fd71' },
      'Unknown. This file may be associated with submission 842371e3-2cea-4929-94f4-dda074e6fd71, but it was not found in workflow outputs.',
    ],
    [
      {
        type: fileProvenanceTypes.workflowOutput,
        submissionId: '842371e3-2cea-4929-94f4-dda074e6fd71',
        workflowId: 'e8e3447c-10c7-4265-b812-e6a5183e99a5',
      },
      'This file is an output of workflow e8e3447c-10c7-4265-b812-e6a5183e99a5 (part of submission 842371e3-2cea-4929-94f4-dda074e6fd71).',
    ],
    [
      {
        type: fileProvenanceTypes.workflowLog,
        submissionId: '842371e3-2cea-4929-94f4-dda074e6fd71',
        workflowId: 'e8e3447c-10c7-4265-b812-e6a5183e99a5',
      },
      'This file is a log from workflow e8e3447c-10c7-4265-b812-e6a5183e99a5 (part of submission 842371e3-2cea-4929-94f4-dda074e6fd71).',
    ],
  ];

  _.forEach(([fileProvenance, expectedMessage]) => {
    it(`renders ${fileProvenance.type} provenance`, () => {
      asMockedFn(useFileProvenance).mockReturnValue({ fileProvenance, error: null, loading: false });

      const workspace = { workspace: { namespace: 'test', name: 'test' } };
      const { container } = render(h(FileProvenance, { workspace, fileUrl: 'gs://my-bucket/file.txt' }));

      expect(container).toHaveTextContent(expectedMessage);
    });
  }, testCases);
});
