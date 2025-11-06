import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { Quota } from 'src/workspaces/dashboard/Quota';

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');

describe('Quota', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays the quota section with view quotas link', () => {
    // Arrange
    const workspace = { ...defaultGoogleWorkspace, workspaceInitialized: true };

    // Act
    render(h(Quota, { workspace }));

    // Assert
    const docLink = screen.getByText('View quotas');
    expect(docLink).toBeInTheDocument();
    expect(docLink.closest('a')).toHaveAttribute(
      'href',
      'https://console.cloud.google.com/iam-admin/quotas?project=test-gcp-ws-project'
    );
  });

  it('shows enabled quota adjuster link for owners', () => {
    // Act
    render(h(Quota, { workspace: { ...defaultGoogleWorkspace, accessLevel: 'OWNER', workspaceInitialized: true } }));

    // Assert
    const quotaAdjusterLink = screen.getByText('Open quota adjuster');
    expect(quotaAdjusterLink).toBeInTheDocument();

    const linkElement = quotaAdjusterLink.closest('a');
    expect(linkElement).toHaveAttribute(
      'href',
      'https://console.cloud.google.com/iam-admin/quotas/configurations?project=test-gcp-ws-project'
    );
    expect(linkElement).not.toHaveStyle({ pointerEvents: 'none' });
  });

  it('shows disabled quota adjuster link with tooltip for non-owners', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(h(Quota, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true, accessLevel: 'WRITER' } }));

    // Assert
    const quotaAdjusterLink = screen.getByText('Open quota adjuster');
    expect(quotaAdjusterLink).toBeInTheDocument();

    const linkElement = quotaAdjusterLink.closest('a');
    expect(linkElement).toHaveStyle({ pointerEvents: 'none' });

    // Hover over the link to trigger tooltip
    const spanWrapper = linkElement?.closest('span');
    await user.hover(spanWrapper!);

    // Check that tooltip appears
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(
      'You do not have permission to adjust quotas for this project. Please contact your workspace owner(s) for assistance.'
    );
  });

  it('emits an event when view quotas link is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = jest.fn();
    const workspace = { ...defaultGoogleWorkspace, workspaceInitialized: true };

    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    // Act
    render(h(Quota, { workspace }));
    const viewQuotasLink = screen.getByText('View quotas');
    await user.click(viewQuotasLink);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(
      Events.workspaceOpenQuotaInConsole,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
  });

  it('renders quota documentation link in info box', async () => {
    // Arrange
    const user = userEvent.setup();
    const workspace = { ...defaultGoogleWorkspace, workspaceInitialized: true };

    // Act
    render(h(Quota, { workspace }));
    const infoButton = screen.getByLabelText('More info');
    await user.click(infoButton);

    // Assert
    expect(screen.getByText('For more information on quotas, please refer to the')).toBeInTheDocument();
    const docLink = screen.getByText('resource quota documentation');
    expect(docLink).toBeInTheDocument();
    expect(docLink.closest('a')).toHaveAttribute(
      'href',
      'https://support.terra.bio/hc/en-us/articles/6396351981595-Are-resource-quotas-slowing-your-analysis-down'
    );
  });
});
