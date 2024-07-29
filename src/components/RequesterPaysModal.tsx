import { ButtonPrimary, ExternalLink, Modal, useUniqueId } from '@terra-ui-packages/components';
import * as _ from 'lodash/fp';
import React, { useState } from 'react';
import { spinnerOverlay, VirtualizedSelect } from 'src/components/common';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { requesterPaysProjectStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { DEFAULT } from 'src/libs/utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { isGoogleWorkspace, WorkspaceWrapper } from 'src/workspaces/utils';

const requesterPaysHelpInfo = (
  <div style={{ paddingTop: '1rem' }}>
    <ExternalLink href='https://support.terra.bio/hc/en-us/articles/360029801491'>
      Why is a workspace required to access this data?
    </ExternalLink>
  </div>
);

interface RequesterPaysModalProps {
  onDismiss: () => void;
  onSuccess: (selectedGoogleProject: string) => void;
}

const RequesterPaysModal: React.FC<RequesterPaysModalProps> = ({ onDismiss, onSuccess }) => {
  const { workspaces, loading } = useWorkspaces();
  const billableWorkspaces = _.filter(
    (workspace: WorkspaceWrapper) =>
      isGoogleWorkspace(workspace) && (workspace.accessLevel === 'OWNER' || workspace.accessLevel === 'PROJECT_OWNER'),
    workspaces
  );
  const selectId = useUniqueId('select');

  const [selectedGoogleProject, setSelectedGoogleProject] = useState<string | undefined>(
    requesterPaysProjectStore.get()
  );

  return Utils.cond(
    [
      loading,
      () => (
        <Modal title='Loading' onDismiss={onDismiss} showCancel={false} okButton={false}>
          {spinnerOverlay}
        </Modal>
      ),
    ],
    [
      billableWorkspaces.length > 0,
      () => (
        <Modal
          title='Choose a workspace to bill to'
          onDismiss={onDismiss}
          shouldCloseOnOverlayClick={false}
          okButton={
            <ButtonPrimary
              disabled={!selectedGoogleProject}
              onClick={() => {
                if (selectedGoogleProject) {
                  onSuccess(selectedGoogleProject);
                }
              }}
            >
              Ok
            </ButtonPrimary>
          }
        >
          This data is in a requester pays bucket. Choose a workspace to bill to in order to continue:
          <FormLabel htmlFor={selectId} required>
            Workspace
          </FormLabel>
          <VirtualizedSelect
            id={selectId}
            isClearable={false}
            value={selectedGoogleProject}
            placeholder='Select a workspace'
            onChange={({ value }) => setSelectedGoogleProject(value)}
            options={_.flow(
              _.map(({ workspace: { googleProject, namespace, name } }: WorkspaceWrapper) => ({
                value: googleProject,
                label: `${namespace}/${name}`,
              })),
              _.sortBy('label')
            )(billableWorkspaces)}
          />
          {requesterPaysHelpInfo}
        </Modal>
      ),
    ],
    [
      DEFAULT,
      () => (
        <Modal
          title='Cannot access data'
          onDismiss={onDismiss}
          okButton={
            <ButtonPrimary
              onClick={() => {
                Nav.goToPath('workspaces');
              }}
            >
              Go to Workspaces
            </ButtonPrimary>
          }
        >
          <div>
            To view or download data in this workspace, please ensure you have at least one workspace with owner or
            project owner permissions in order to bill to.
          </div>
          {requesterPaysHelpInfo}
        </Modal>
      ),
    ]
  );
};

export default RequesterPaysModal;
