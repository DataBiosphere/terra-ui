import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { h, p, span } from 'react-hyperscript-helpers';
import { SaveFilesHelp } from 'src/analysis/runtime-common-components';
import { getDiskAppType } from 'src/analysis/utils/app-utils';
import { appTools } from 'src/analysis/utils/tool-utils';
import { spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { withErrorReporting } from 'src/libs/error';
import { withBusyState } from 'src/libs/utils';

import { DeleteDiskProvider, DiskWithWorkspace } from './Environments.models';

export interface DeleteDiskModalProps {
  disk: DiskWithWorkspace;
  onDismiss: () => void;
  onSuccess: () => void;
  deleteProvider: Pick<DeleteDiskProvider, 'delete'>;
}

export const DeleteDiskModal = (props: DeleteDiskModalProps): ReactNode => {
  const { disk, deleteProvider, onDismiss, onSuccess } = props;
  const [busy, setBusy] = useState(false);

  const deleteDisk = _.flow(
    withBusyState(setBusy),
    withErrorReporting('Error deleting persistent disk')
  )(async () => {
    await deleteProvider.delete(disk);
    onSuccess();
  });
  const isGalaxyDisk = getDiskAppType(disk) === appTools.GALAXY.label;

  return h(
    Modal,
    {
      title: 'Delete persistent disk?',
      onDismiss,
      okButton: deleteDisk,
    },
    [
      p(['Deleting the persistent disk will ', span({ style: { fontWeight: 600 } }, ['delete all files on it.'])]),
      isGalaxyDisk && h(SaveFilesHelp),
      busy && spinnerOverlay,
    ]
  );
};
