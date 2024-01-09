import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { Code } from 'src/pages/library/Code';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockImplementation((_) => _),
}));

describe('Code page', () => {
  it('loads the code page', async () => {
    const token = 'testtoken';
    const newToken = 'newtesttoken';

    const methodsList = [
      {
        name: 'joint-discovery-gatk4',
        createDate: '2018-11-30T22:19:35Z',
        url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/gatk/joint-discovery-gatk4/1',
        synopsis: 'Implements the joint discovery and VQSR filtering',
        entityType: 'Workflow',
        snapshotComment: '',
        snapshotId: 1,
        namespace: 'gatk',
      },
    ];

    const featuredMethodsList = [
      {
        namespace: 'gatk',
        name: 'joint-discovery-gatk4',
      },
    ];

    const mockOidcUser = {
      id_token: undefined,
      session_state: null,
      access_token: token,
      refresh_token: '',
      token_type: '',
      scope: undefined,
      profile: {
        sub: '',
        iss: '',
        aud: '',
        exp: 0,
        iat: 0,
      },
      expires_at: undefined,
      state: undefined,
      expires_in: 0,
      expired: undefined,
      scopes: [],
      toStorageString: '',
    };

    Ajax.mockImplementation(() => {
      mockOidcUser.access_token = newToken;
      return Promise.resolve({
        status: 'success',
        oidcUser: mockOidcUser,
      });
    });

    Ajax.mockImplementation(() => {
      return {
        FirecloudBucket: {
          getFeaturedMethods: jest.fn(() => Promise.resolve(featuredMethodsList)),
        },
        Methods: {
          list: jest.fn(() => Promise.resolve(methodsList)),
        },
        Dockstore: {
          listTools: jest.fn(),
        },
      };
    });

    // Act
    await act(async () => {
      render(h(Code, {}));
    });
    const codeAndWorkflows = await screen.getByRole('link', { name: 'code & workflows' });
    expect(codeAndWorkflows).toHaveAttribute('href', 'library-code');

    const workflowName = await screen.getByRole('link', { name: 'joint-discovery-gatk4 Implements the joint discovery and VQSR filtering' });
    expect(workflowName.getAttribute('href')).toContain('?return=terra#methods/gatk/joint-discovery-gatk4/');
  });
});
