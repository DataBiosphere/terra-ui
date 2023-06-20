import React from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import { SingleValue } from 'react-select';
import { IComputeConfig } from 'src/analysis/modal-utils';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { Select } from 'src/components/common';
import { azureDiskSizes } from 'src/libs/ajax/leonardo/models/disk-models';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';
import { useUniqueId } from 'src/libs/react-utils';

export interface AzurePersistentDiskSizeSelectInputProps {
  persistentDiskSize: number;
  onChangePersistentDiskSize: (e: SingleValue<number | undefined>) => void;
  persistentDiskExists: boolean;
}

const AzurePersistentDiskSizeSelect = Select as typeof Select<IComputeConfig['persistentDiskSize']>;

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
