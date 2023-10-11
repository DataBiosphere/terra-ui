import { ReactNode } from 'react';
import { h, span } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import Modal from 'src/components/Modal';

import { tableNameForImport } from './data-table-versioning-utils';

export interface DataTableImportVersionModalProps {
  version: any;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const DataTableImportVersionModal = (props: DataTableImportVersionModalProps): ReactNode => {
  const { version, onDismiss, onConfirm } = props;
  return h(
    Modal,
    {
      onDismiss,
      title: 'Import version',
      okButton: h(ButtonPrimary, { 'data-testid': 'confirm-import', onClick: () => onConfirm() }, ['Import']),
    },
    [
      'This version will be imported to a new data table: ',
      span({ style: { fontWeight: 600 } }, [tableNameForImport(version)]),
    ]
  );
};
