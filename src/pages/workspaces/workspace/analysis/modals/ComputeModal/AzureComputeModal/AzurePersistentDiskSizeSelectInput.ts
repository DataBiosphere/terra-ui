import { div, h, label } from 'react-hyperscript-helpers';
import { SingleValue } from 'react-select';
import { Select } from 'src/components/common';
import { azureDiskSizes } from 'src/libs/ajax/leonardo/models/disk-models';
import { defaultAzureDiskSize } from 'src/libs/azure-utils';
import { useUniqueId } from 'src/libs/react-utils';
import { IComputeConfig } from 'src/pages/workspaces/workspace/analysis/modal-utils';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface AzurePersistentDiskSizeSelectInputProps {
  persistentDiskSize: number;
  onChangePersistentDiskSize: (e: SingleValue<number | undefined>) => void;
  persistentDiskExists: boolean;
}

const AzurePersistentDiskSizeSelect = Select as typeof Select<IComputeConfig['persistentDiskSize']>;

export const AzurePersistentDiskSizeSelectInput = (props: AzurePersistentDiskSizeSelectInputProps) => {
  const { persistentDiskSize, onChangePersistentDiskSize, persistentDiskExists } = props;
  const diskSizeId = useUniqueId();
  return h(div, [
    label({ htmlFor: diskSizeId, style: computeStyles.label }, ['Disk Size (GB)']),
    div({ style: { width: 110, marginTop: '0.5rem' } }, [
      h(AzurePersistentDiskSizeSelect, {
        id: diskSizeId,
        value: persistentDiskSize,
        isDisabled: persistentDiskExists,
        menuPlacement: 'auto',
        options: azureDiskSizes,
        onChange: (e) => {
          onChangePersistentDiskSize(e ? e.value : defaultAzureDiskSize);
        }, // Unable to replicate a null case
      }),
    ]),
  ]);
};
