import { useUniqueId } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import { IComputeConfig } from 'src/analysis/modals/modal-utils';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { Select } from 'src/components/common';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';

export interface AzurePersistentDiskSizeSelectInputProps {
  maxPersistentDiskSize?: number;
  persistentDiskSize: number;
  onChangePersistentDiskSize: (e: number | null | undefined) => void;
  persistentDiskExists: boolean;
}

export const azureDiskSizes: number[] = [32, 64, 128, 256, 512, 1024, 2048, 4095];

const AzurePersistentDiskSizeSelect = Select as typeof Select<IComputeConfig['persistentDiskSize']>;

export const AzurePersistentDiskSizeSelectInput = (props: AzurePersistentDiskSizeSelectInputProps): ReactNode => {
  const { maxPersistentDiskSize, persistentDiskSize, onChangePersistentDiskSize, persistentDiskExists } = props;
  const diskSizeId = useUniqueId();

  // If the user created a PD before the select implementation, we should still
  // show the correct disk size.
  let extendedAzureDiskSizes = azureDiskSizes;
  if (maxPersistentDiskSize) {
    extendedAzureDiskSizes = azureDiskSizes.filter((size) => size <= maxPersistentDiskSize);
  }
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
