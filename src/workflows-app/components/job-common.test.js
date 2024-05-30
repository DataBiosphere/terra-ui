import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h, span } from 'react-hyperscript-helpers';
import { calculateTotalCost, getTaskCost } from 'src/components/job-common';
import * as Nav from 'src/libs/nav';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { HeaderSection, PageHeader } from 'src/workflows-app/components/job-common';

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest
    .fn()
    .mockImplementation((path, pathParams, queryParams) =>
      path === 'workspace-workflows-app'
        ? `/#workspaces/${pathParams.namespace}/${pathParams.name}/workflows-app${jest
            .requireActual('qs')
            .stringify(queryParams, { addQueryPrefix: true })}`
        : '/#test-link'
    ),
  goToPath: jest.fn(),
}));

describe('Job Common Components - Page Header', () => {
  it('renders header text for provided text', async () => {
    const props = { title: 'Test Header' };
    render(h(PageHeader, props));
    screen.getByText(props.title);
  });

  it('renders a breadcrumb trail of links when provided the config object', async () => {
    const breadcrumbPathObjects = [
      {
        label: 'Submission History',
        path: 'workspace-workflows-app',
        pathParams: { namespace: 'foo', name: 'bar' },
        queryParams: { tab: 'submission-history' },
      },
      {
        label: 'Test link',
        path: 'test-link',
      },
    ];

    const props = {
      title: 'Test Header',
      breadcrumbPathObjects,
    };

    render(h(PageHeader, props));

    const historyLink = screen.getByText(breadcrumbPathObjects[0].label);
    expect(historyLink).toHaveAttribute(
      'href',
      Nav.getLink(breadcrumbPathObjects[0].path, breadcrumbPathObjects[0].pathParams, breadcrumbPathObjects[0].queryParams)
    );
    const testLink = screen.getByText(breadcrumbPathObjects[1].label);
    expect(testLink).toHaveAttribute('href', Nav.getLink(breadcrumbPathObjects[1].path));
  });
});

describe('Job Common Components - Header Section', () => {
  it('renders the PageHeader and button', async () => {
    const buttonText = 'Test button';
    const buttonClick = jest.fn();
    const props = {
      title: 'Test Title',
      button: span({ onClick: buttonClick }, [buttonText]),
    };

    const user = userEvent.setup();
    render(h(HeaderSection, props));
    screen.getByText(props.title);
    const button = screen.getByText(buttonText);
    await user.click(button);
    expect(buttonClick).toHaveBeenCalled();
  });
});

describe('Job Common Components - Cost Elements', () => {
  it.each([
    { taskStartTime: '2024-05-30T18:29:42.6042077Z', taskEndTime: '2024-05-30T18:36:35.8020768Z', vmCostUsd: '0.203', expectedCost: 0.02 },
    { taskStartTime: '2024-05-30T18:29:42.6042077Z', taskEndTime: undefined, vmCostUsd: '0.203', expectedCost: 0.02 },
    { taskStartTime: '2024-05-30T18:29:42.6042077Z', taskEndTime: '2024-05-30T18:36:35.8020768Z', vmCostUsd: '0.008', expectedCost: 0 },
  ])('returns expectedCost given $taskStartTime, $taskEndTime, and $vmCostUsd', ({ taskStartTime, taskEndTime, vmCostUsd, expectedCost }) => {
    // Arrange
    const cost = getTaskCost({ vmCostUsd, taskStartTime, taskEndTime });

    // Assert
    expect(cost).toBe(expectedCost);
  });

  it('computes a value greater than zero for In Progress tasks', () => {
    const taskStartTime = '2024-05-30T18:29:42.6042077Z';
    const vmCostUsd = '0.005';
    const cost = getTaskCost({ vmCostUsd, taskStartTime });
    expect(cost).toBeGreaterThan(0);
  });

  it('calculates the total cost of all call objects', () => {
    const shortenedCalls = {
      'fetch_sra_to_bam.Fetch_SRA_to_BAM': [
        {
          executionStatus: 'Done',
          shardIndex: -1,
          callCaching: {
            allowResultReuse: true,
            effectiveCallCachingMode: 'ReadAndWriteCache',
            hit: false,
            result: 'Cache Miss',
          },
          returnCode: 0,
          start: '2023-05-23T10:10:43.783Z',
          taskStartTime: '2023-05-23T10:10:43.783Z',
          taskEndTime: '2023-05-24T11:22:31.784Z',
          vmCostUsd: '0.505',
          backendStatus: 'Complete',
          compressedDockerSize: 1339143280,
          end: '2023-05-24T11:22:31.784Z',
          attempt: 1,
        },
      ],
      // In theory, we'd want to test a case with task start and vm cost and no end time present yet; however, the lack of endtime will cause this cost to increment beyond the timing of the test, causing flakiness.
      // 'fetch_sra_to_bam.Fetch_SRA_to_BAM_2': [
      //   {
      //     executionStatus: 'Running',
      //     returnCode: 0,
      //     jobId: '117f49d5_59bbeae7208642e686a1ca0f57c8c25a',
      //     backend: 'TES',
      //     start: '2023-05-23T10:10:43.783Z',
      //     taskStartTime: '2023-05-23T10:10:43.783Z',
      //     vmCostUsd: '0.203',
      //     backendStatus: 'Running',
      //     compressedDockerSize: 1339143280,
      //     end: '2023-05-24T11:22:31.784Z',
      //     dockerImageUsed: 'docker_img_uri',
      //     attempt: 1,
      //   },
      // ],
      'fetch_sra_to_bam.Fetch_SRA_to_BAM_3': [
        {
          executionStatus: 'Done',
          returnCode: 0,
          jobId: '117f49d5_59bbeae7208642e686a1ca0f57c8c25a',
          backend: 'TES',
          start: '2023-05-23T10:10:43.783Z',
          backendStatus: 'Completed',
          compressedDockerSize: 1339143280,
          end: '2023-05-24T11:22:31.784Z',
          dockerImageUsed: 'docker_img_uri',
          attempt: 1,
          taskStartTime: '2023-05-23T10:50:43.783Z',
          taskEndTime: '2023-05-24T11:22:31.784Z',
          vmCostUsd: '0.005',
        },
      ],
      'fetch_sra_to_bam.Fetch_SRA_to_BAM_4': [
        {
          executionStatus: 'Done',
          callCaching: {
            allowResultReuse: true,
            effectiveCallCachingMode: 'ReadAndWriteCache',
            hit: true,
            result: 'Cache Hit',
          },
          returnCode: 0,
          jobId: '117f49d5_59bbeae7208642e686a1ca0f57c8c25a',
          backend: 'TES',
          start: '2023-05-23T10:10:43.783Z',
          backendStatus: 'Completed',
          compressedDockerSize: 1339143280,
          end: '2023-05-24T11:22:31.784Z',
          dockerImageUsed: 'docker_img_uri',
          attempt: 1,
        },
      ],
    };

    const cost = calculateTotalCost(shortenedCalls);

    expect(cost).toBe(12.84);
  });
});
