import { abandonedPromise } from '@terra-ui-packages/core-utils';
import { act, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { BillingProjectList } from 'src/pages/workspaces/migration/BillingProjectList';
import { mockServerData } from 'src/pages/workspaces/migration/migration-utils.test';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxWorkspacesContract = AjaxContract['Workspaces'];
jest.mock('src/libs/ajax');

describe('BillingProjectList', () => {
  it('shows a loading indicator', async () => {
    // Arrange
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockReturnValue(abandonedPromise()),
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    render(h(BillingProjectList, []));

    // Assert
    await screen.findByText('Fetching billing projects');
  });

  it('shows a message if there are no workspaces to migrate', async () => {
    // Arrange
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockResolvedValue({}),
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    render(h(BillingProjectList, []));

    // Assert
    await screen.findByText('You have no workspaces to migrate');
    expect(screen.queryByText('Fetching billing projects')).toBeNull();
  });

  it('shows the list of billing projects with workspaces, and has no accessibility errors', async () => {
    // Arrange
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockResolvedValue(mockServerData),
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    let renderResult;
    act(() => {
      renderResult = render(h(BillingProjectList, []));
    });

    // Assert
    const billingProjects = await screen.findAllByRole('listitem');
    await within(billingProjects[0]).findByText('CARBilling-2');
    await within(billingProjects[0]).findByText('april29');
    await within(billingProjects[0]).findByText('notmigrated');

    await within(billingProjects[1]).findByText('CARBillingTest');
    await within(billingProjects[1]).findByText('testdata');

    await within(billingProjects[2]).findByText('general-dev-billing-account');
    await within(billingProjects[2]).findByText('Christina test');

    expect(screen.queryByText('Fetching billing projects')).toBeNull();
    expect(screen.queryByText('You have no workspaces to migrate')).toBeNull();

    expect(await axe(renderResult.container)).toHaveNoViolations();
  });
});
