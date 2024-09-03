import { GroupDetails } from 'src/groups/GroupDetails';

export const navPaths = [
  {
    name: 'group',
    path: '/groups/:groupName',
    component: GroupDetails,
    title: ({ groupName }) => `Group Management - ${groupName}`,
  },
];
