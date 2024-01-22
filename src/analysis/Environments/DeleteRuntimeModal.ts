import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import { SaveFilesHelp, SaveFilesHelpAzure } from 'src/analysis/runtime-common-components';
import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { LabeledCheckbox, spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { isAzureConfig, isGceWithPdConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { withErrorReporting } from 'src/libs/error';
import { withBusyState } from 'src/libs/utils';

import { DeleteRuntimeProvider } from './Environments.models';

export interface DeleteRuntimeModalProps {
  runtime: ListRuntimeItem;
  onDismiss: () => void;
  onSuccess: () => void;
  deleteProvider: DeleteRuntimeProvider;
}

export const DeleteRuntimeModal = (props: DeleteRuntimeModalProps): ReactNode => {
  const { runtime, deleteProvider, onDismiss, onSuccess } = props;
  const { cloudContext, runtimeConfig } = runtime;
  const [deleteDisk, setDeleteDisk] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteRuntime = _.flow(
    withBusyState(setDeleting),
    withErrorReporting('Error deleting cloud environment')
  )(async () => {
    await deleteProvider.delete(runtime, { deleteDisk });
    onSuccess();
  });

  return h(
    Modal,
    {
      title: 'Delete cloud environment?',
      onDismiss,
      okButton: deleteRuntime,
    },
    [
      div({ style: { lineHeight: 1.5 } }, [
        // show checkbox if config has disk
        isAzureConfig(runtimeConfig) || isGceWithPdConfig(runtimeConfig)
          ? h(LabeledCheckbox, { checked: deleteDisk, onChange: setDeleteDisk }, [
              span({ style: { fontWeight: 600 } }, [' Also delete the persistent disk and all files on it']),
            ])
          : p([
              'Deleting this cloud environment will also ',
              span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk.']),
            ]),
        p([
          'Deleting your cloud environment will stop all running notebooks and associated costs. You can recreate your cloud environment later, ',
          'which will take several minutes.',
        ]),
        !isGcpContext(cloudContext) ? h(SaveFilesHelpAzure) : h(SaveFilesHelp),
      ]),
      deleting && spinnerOverlay,
    ]
  );
};
