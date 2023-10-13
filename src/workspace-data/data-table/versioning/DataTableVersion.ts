import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { div, h, h1, li, p, ul } from 'react-hyperscript-helpers';
import { ButtonPrimary, DeleteConfirmationModal, IdContainer, spinnerOverlay } from 'src/components/common';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

import { DataTableImportVersionModal } from './DataTableImportVersionModal';

export interface DataTableVersionProps {
  version: any;
  onDelete: () => void;
  onImport: () => void;
}

export const DataTableVersion = (props: DataTableVersionProps): ReactNode => {
  const { version, onDelete, onImport } = props;

  const { entityType, includedSetEntityTypes, timestamp, description } = version;

  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);

  return div({ style: { padding: '1rem' } }, [
    h1(
      {
        style: {
          ...Style.elements.sectionHeader,
          fontSize: 20,
          paddingBottom: '0.5rem',
          borderBottom: Style.standardLine,
          marginBottom: '1rem',
        },
      },
      [`${entityType} (${Utils.makeCompleteDate(timestamp)})`]
    ),
    _.size(includedSetEntityTypes) > 0 &&
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            p({ id }, ['Included set tables:']),
            ul({ 'aria-labelledby': id, style: { margin: 0 } }, [
              _.map((type) => li({ key: type }, [type]), includedSetEntityTypes),
            ]),
          ]),
      ]),
    version.createdBy && p([`Created by: ${version.createdBy}`]),
    p([description || 'No description']),
    div({ style: { display: 'flex', marginBottom: '1rem' } }, [
      h(
        ButtonPrimary,
        {
          disabled: busy,
          onClick: () => setShowImportConfirmation(true),
        },
        ['Import']
      ),
      h(
        ButtonPrimary,
        {
          danger: true,
          disabled: busy,
          style: { marginLeft: '1rem' },
          onClick: () => setShowDeleteConfirmation(true),
        },
        ['Delete']
      ),
    ]),
    showImportConfirmation &&
      h(DataTableImportVersionModal, {
        version,
        onConfirm: async () => {
          setShowImportConfirmation(false);
          setBusy(true);
          try {
            await onImport();
          } catch (err) {
            setBusy(false);
          }
        },
        onDismiss: () => {
          setShowImportConfirmation(false);
        },
      }),
    showDeleteConfirmation &&
      h(DeleteConfirmationModal, {
        objectType: 'version',
        objectName: Utils.makeCompleteDate(timestamp),
        onConfirm: async () => {
          setShowDeleteConfirmation(false);
          try {
            setBusy(true);
            await onDelete();
          } catch (err) {
            setBusy(false);
          }
        },
        onDismiss: () => {
          setShowDeleteConfirmation(false);
        },
      }),
    busy && spinnerOverlay,
  ]);
};
