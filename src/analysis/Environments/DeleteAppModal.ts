import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import { SaveFilesHelpGalaxy } from 'src/analysis/runtime-common-components';
import { appTools } from 'src/analysis/utils/tool-utils';
import { LabeledCheckbox, spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { LeoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { withErrorReportingInModal } from 'src/libs/error';
import * as Utils from 'src/libs/utils';

export type DeleteAppProvider = Pick<LeoAppProvider, 'delete'>;

export interface DeleteAppModalProps {
  app: App;
  onDismiss: () => void;
  onSuccess: () => void;
  deleteProvider: DeleteAppProvider;
}

export const DeleteAppModal: React.FC<DeleteAppModalProps> = (props) => {
  const { app, onDismiss, onSuccess, deleteProvider } = props;
  const [deleteDisk, setDeleteDisk] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const {
    appName,
    appType,
    cloudContext: { cloudProvider, cloudResource },
  } = app;
  const deleteApp = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReportingInModal('Error deleting cloud environment', onDismiss)
  )(async () => {
    // TODO: this should use types in IA-3824
    if (cloudProvider === 'GCP') {
      // await ajax().Apps.app(cloudResource, appName).delete(deleteDisk);
      await deleteProvider.delete(cloudResource, appName, deleteDisk);
      onSuccess();
    } else {
      throw new Error('Deleting apps is currently only supported on GCP');
    }
  });
  return h(
    Modal,
    {
      title: 'Delete cloud environment?',
      onDismiss,
      okButton: deleteApp,
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        app.diskName
          ? h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
              span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it']),
            ])
          : p([
              'Deleting this cloud environment will also ',
              span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.']),
            ]),
        appType === appTools.GALAXY.label && h(SaveFilesHelpGalaxy),
      ]),
      deleting && spinnerOverlay,
    ]
  );
};
