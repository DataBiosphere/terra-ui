import React from 'react';
import { div } from 'react-hyperscript-helpers';
import { SingleValue } from 'react-select';
import { AboutPersistentDiskSection } from 'src/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { AzurePersistentDiskSizeSelectInput } from 'src/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSizeSelectInput';
import { PersistentDiskTypeInputContainer } from 'src/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { AzurePdType, AzurePersistentDiskOptions, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';

export interface AzurePersistentDiskSectionProps {
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: AzurePdType;
  onChangePersistentDiskType: (type: SharedPdType) => void;
  onChangePersistentDiskSize: (size: SingleValue<number | undefined>) => void;
  onClickAbout: () => void;
}

export const AzurePersistentDiskSection: React.FC<AzurePersistentDiskSectionProps> = (
  props: AzurePersistentDiskSectionProps
) => {
  const {
    onClickAbout,
    persistentDiskType,
    persistentDiskSize,
    onChangePersistentDiskType,
    onChangePersistentDiskSize,
    persistentDiskExists,
  } = props;

  const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' };
  return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
    AboutPersistentDiskSection({ onClick: onClickAbout }),
    div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 5.5rem', marginTop: '0.75rem' } }, [
      PersistentDiskTypeInputContainer({
        persistentDiskExists,
        value: persistentDiskType,
        onChange: (e) => onChangePersistentDiskType(e.value),
        options: AzurePersistentDiskOptions,
      }),
      AzurePersistentDiskSizeSelectInput({
        persistentDiskSize,
        onChangePersistentDiskSize,
        persistentDiskExists,
      }),
    ]),
  ]);
};
