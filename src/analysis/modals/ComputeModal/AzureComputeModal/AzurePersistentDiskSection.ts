import { AzureDiskType } from '@terra-ui-packages/leonardo-data-client';
import { ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AboutPersistentDiskSection } from 'src/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { AzurePersistentDiskSizeSelectInput } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSizeSelectInput';
import { PersistentDiskTypeInputContainer } from 'src/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { AzurePdType } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { defaultAzurePersistentDiskType } from 'src/libs/azure-utils';

export interface AzurePersistentDiskSectionProps {
  maxPersistentDiskSize?: number;
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: AzureDiskType;
  onChangePersistentDiskType: (type: AzureDiskType | null) => void;
  onChangePersistentDiskSize: (size: number | null | undefined) => void;
  onClickAbout: () => void;
}

export const AzurePersistentDiskOptions: AzurePdType[] = [
  {
    value: 'Standard_LRS',
    label: 'Standard HDD',
  },
  // TODO: Disabled the SSD option and the test in
  // AzurePersistentDiskInputTest test until SSD is properly implemented and tested.
  // Main blocker: Cost calculation.
  // {
  //   value: 'StandardSSD_LRS',
  //   label: 'Standard SSD',
  // },
];

export const AzurePersistentDiskSection = (props: AzurePersistentDiskSectionProps): ReactNode => {
  const {
    maxPersistentDiskSize,
    onClickAbout,
    persistentDiskType,
    persistentDiskSize,
    onChangePersistentDiskType,
    onChangePersistentDiskSize,
    persistentDiskExists,
  } = props;

  const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' };
  return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
    h(AboutPersistentDiskSection, { onClick: onClickAbout }),
    div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 5.5rem', marginTop: '0.75rem' } }, [
      h(PersistentDiskTypeInputContainer<AzureDiskType, AzurePdType>, {
        persistentDiskExists,
        value: persistentDiskType,
        onChange: (e) => onChangePersistentDiskType(e ? e.value : defaultAzurePersistentDiskType),
        options: AzurePersistentDiskOptions,
      }),
      h(AzurePersistentDiskSizeSelectInput, {
        maxPersistentDiskSize,
        persistentDiskSize,
        onChangePersistentDiskSize,
        persistentDiskExists,
      }),
    ]),
  ]);
};
