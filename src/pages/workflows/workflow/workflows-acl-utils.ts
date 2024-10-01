export interface RawWorkflowsPermissions {
  user: string;
  role: WorkflowAccessLevel;
}

export type WorkflowsPermissions = RawWorkflowsPermissions[];

export const publicUser: (userPerms: RawWorkflowsPermissions) => boolean = ({ user }) => {
  return user === 'public';
};

export const workflowAccessLevels = ['NO ACCESS', 'READER', 'OWNER'] as const;

export type WorkflowsAccessLevels = typeof workflowAccessLevels;

export type WorkflowAccessLevel = WorkflowsAccessLevels[number];
