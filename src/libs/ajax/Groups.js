import _ from 'lodash/fp';
import { authOpts, fetchSam, jsonBody } from 'src/libs/ajax/ajax-common';

export const Groups = (signal) => ({
  list: async () => {
    const res = await fetchSam('api/groups/v1', _.merge(authOpts(), { signal }));
    return res.json();
  },

  group: (groupName) => {
    const root = `api/groups/v1/${groupName}`;
    const resourceRoot = `api/resources/v1/managed-group/${groupName}`;

    const addRole = (role, email) => {
      return fetchSam(`${root}/${role}/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'PUT' }));
    };

    const removeRole = (role, email) => {
      return fetchSam(`${root}/${role}/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'DELETE' }));
    };

    return {
      create: () => {
        return fetchSam(root, _.merge(authOpts(), { signal, method: 'POST' }));
      },

      delete: () => {
        return fetchSam(root, _.merge(authOpts(), { signal, method: 'DELETE' }));
      },

      listAdmins: async () => {
        const res = await fetchSam(`${root}/admin`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      listMembers: async () => {
        const res = await fetchSam(`${root}/member`, _.merge(authOpts(), { signal }));
        return res.json();
      },

      addUser: (roles, email) => {
        return Promise.all(_.map((role) => addRole(role, email), roles));
      },

      removeUser: (roles, email) => {
        return Promise.all(_.map((role) => removeRole(role, email), roles));
      },

      changeUserRoles: async (email, oldRoles, newRoles) => {
        if (!_.isEqual(oldRoles, newRoles)) {
          await Promise.all(_.map((role) => addRole(role, email), _.difference(newRoles, oldRoles)));
          return Promise.all(_.map((role) => removeRole(role, email), _.difference(oldRoles, newRoles)));
        }
      },

      requestAccess: async () => {
        await fetchSam(`${root}/requestAccess`, _.merge(authOpts(), { signal, method: 'POST' }));
      },

      getPolicy: async (policyName) => {
        const res = await fetchSam(`${resourceRoot}/policies/${policyName}/public`, _.merge(authOpts(), { signal }));
        return await res.json();
      },

      setPolicy: (policyName, value) => {
        return fetchSam(`${resourceRoot}/policies/${policyName}/public`, _.mergeAll([authOpts(), { signal, method: 'PUT' }, jsonBody(value)]));
      },

      isMember: async () => {
        const res = await fetchSam(`${resourceRoot}/action/use`, _.merge(authOpts(), { signal }));
        return res.json();
      },
    };
  },
});
