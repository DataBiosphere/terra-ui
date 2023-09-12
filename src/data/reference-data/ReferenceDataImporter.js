import _ from 'lodash/fp';
import { useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Select, spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';

import { RefAliasToName } from './reference_aliases';
import ReferenceData from './references';

export const ReferenceDataImporter = ({ onSuccess, onDismiss, namespace, name }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReference, setSelectedReference] = useState(undefined);

  return h(
    Modal,
    {
      'aria-label': 'Add Reference Data',
      onDismiss,
      title: 'Add Reference Data',
      okButton: h(
        ButtonPrimary,
        {
          disabled: !selectedReference || loading,
          onClick: async () => {
            setLoading(true);
            try {
              await Ajax()
                .Workspaces.workspace(namespace, name)
                .shallowMergeNewAttributes(
                  _.mapKeys((k) => `referenceData_${RefAliasToName[selectedReference]}_${k}`, ReferenceData[RefAliasToName[selectedReference]])
                );
              onSuccess();
            } catch (error) {
              await reportError('Error importing reference data', error);
              onDismiss();
            }
          },
        },
        'OK'
      ),
    },
    [
      h(Select, {
        'aria-label': 'Select data',
        autoFocus: true,
        isSearchable: false,
        placeholder: 'Select data',
        value: selectedReference,
        onChange: ({ value }) => setSelectedReference(value),
        options: _.keys(RefAliasToName),
      }),
      loading && spinnerOverlay,
    ]
  );
};
