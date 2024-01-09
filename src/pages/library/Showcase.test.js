import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { Showcase, sidebarSections } from 'src/pages/library/Showcase';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockImplementation((_) => _),
  useRoute: jest.fn().mockImplementation(() => ({ query: {} })),
}));

describe('Showcase', () => {
  it('matches on tags', () => {
    // Arrange
    const workspace = {
      tags: {
        items: ['google cloud platform'],
      },
    };
    // Act
    // We only need to test one sidebar section because they all have identical matching behavior
    const matchWorkspaceByTag = sidebarSections[0].matchBy(workspace, 'google cloud platform');
    // Assert
    expect(matchWorkspaceByTag).toBeTruthy();
  });

  it('loads the showcase page', async () => {
    Ajax.mockImplementation(() => {
      return {
        FirecloudBucket: {
          getShowcaseWorkspaces: jest.fn(),
        },
      };
    });

    // Act
    await act(async () => {
      render(h(Showcase, {}));
    });

    const codeAndWorkflows = await screen.getByRole('link', { name: 'code & workflows' });
    expect(codeAndWorkflows).toHaveAttribute('href', 'library-code');
  });
});
