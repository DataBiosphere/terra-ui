import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h, span } from 'react-hyperscript-helpers';
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
