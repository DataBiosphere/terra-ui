import _ from 'lodash/fp';
import { Ajax } from 'src/libs/ajax';
import { prepareAttributeForUpload } from 'src/workspace-data/data-table/entity-service/attribute-utils';

jest.mock('src/libs/ajax');
describe('Create Entity', () => {
  it('creates a new entity', async () => {
    const namespace = 'ns';
    const name = 'name';
    const entityType = 'Workflow';
    const entityName = 'data';
    const token = 'testtoken';
    const newToken = 'newtesttoken';

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

    await Ajax()
      .Workspaces.workspace(namespace, name)
      .createEntity({
        entityType,
        name: entityName,
        attributes: _.mapValues(prepareAttributeForUpload, ['attributeValues']),
      });

    // console.log(createEntity);
  });
});
