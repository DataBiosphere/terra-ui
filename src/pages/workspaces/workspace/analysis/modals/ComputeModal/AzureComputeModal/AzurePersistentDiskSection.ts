import { div } from 'react-hyperscript-helpers';
import { SingleValue } from 'react-select';
import { AzurePdType, AzurePersistentDiskOptions, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';
import { AboutPersistentDiskSection } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { AzurePersistentDiskSizeSelectInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AzureComputeModal/AzurePersistentDiskSizeSelectInput';
import { PersistentDiskTypeInputContainer } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface AzurePersistentDiskSectionProps {
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: AzurePdType;
  onChangePersistentDiskType: (type: SharedPdType) => void;
  onChangePersistentDiskSize: (size: SingleValue<number | undefined>) => void;
  onClickAbout: () => void;
}

export const AzurePersistentDiskSection = (props: AzurePersistentDiskSectionProps) => {
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
