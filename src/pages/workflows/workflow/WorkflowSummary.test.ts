import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { snapshotStore } from 'src/libs/state';
import { BaseWorkflowSummary } from 'src/pages/workflows/workflow/WorkflowSummary';
import { renderWithAppContexts } from 'src/testing/test-utils';

jest.mock('src/libs/notifications');

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn(),
    goToPath: jest.fn(),
  })
);

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({ orchestrationUrlRoot: 'afirecloudurlroot' }),
}));

describe('WorkflowSummary Component', () => {
  beforeEach(() => {
    jest.spyOn(snapshotStore, 'get').mockImplementation(
      jest.fn().mockReturnValue({
        namespace: 'nameFoo',
        name: 'cnv_somatic_pair_workflow',
        snapshotId: 1,
        createDate: '2017-10-20T20:07:22Z',
        managers: ['nameFoo@fooname.com'],
        synopsis: 'a very fancy method',
        documentation: '',
        public: true,
      })
    );
  });

  it('renders a simple smoke test for the WorkflowSummary component', () => {
    // ** ACT **
    renderWithAppContexts(h(BaseWorkflowSummary));

    // ** ASSERT **
    expect(screen.getByText('a very fancy method')).toBeInTheDocument();
    expect(screen.getByText('No documentation provided')).toBeInTheDocument();
    expect(screen.getByText('10/20/2017')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('nameFoo@fooname.com')).toBeInTheDocument();
    expect(
      screen.getByText(
        'afirecloudurlroot/ga4gh/v1/tools/nameFoo:cnv_somatic_pair_workflow/versions/1/plain-WDL/descriptor'
      )
    ).toBeInTheDocument();
  });
});
