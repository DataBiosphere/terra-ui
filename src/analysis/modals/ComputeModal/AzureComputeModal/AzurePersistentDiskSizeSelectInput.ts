import {
  AzurePersistentDiskSizeSelect,
  AzurePersistentDiskSizeSelectInputProps,
  useUniqueId,
} from '@terra-ui-packages/components';
import React from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { azureDiskSizes } from 'src/libs/ajax/leonardo/models/disk-models';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';

export const AzurePersistentDiskSizeSelectInput: React.FC<AzurePersistentDiskSizeSelectInputProps> = (
  props: AzurePersistentDiskSizeSelectInputProps
) => {
  const { persistentDiskSize, onChangePersistentDiskSize, persistentDiskExists } = props;
  const diskSizeId = useUniqueId();

  // If the user created a PD before the select implementation, we should still
  // show the correct disk size.
  let extendedAzureDiskSizes = azureDiskSizes;
  if (!azureDiskSizes.includes(persistentDiskSize)) {
    extendedAzureDiskSizes = azureDiskSizes.concat(persistentDiskSize);
  }

  return h(div, [
    label({ htmlFor: diskSizeId, style: computeStyles.label }, ['Disk Size (GB)']),
    div({ style: { width: 110, marginTop: '0.5rem' } }, [
      h(AzurePersistentDiskSizeSelect, {
        id: diskSizeId,
        value: persistentDiskSize,
        isDisabled: persistentDiskExists,
        menuPlacement: 'auto',
        options: extendedAzureDiskSizes,
        onChange: (e) => {
          onChangePersistentDiskSize(e ? e.value : defaultAzureDiskSize);
        }, // Unable to replicate a null case
      }),
    ]),
  ]);
};
