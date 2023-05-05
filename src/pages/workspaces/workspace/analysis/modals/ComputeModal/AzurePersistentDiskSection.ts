import { div } from 'react-hyperscript-helpers';
import { AzurePdType, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';
import { AboutPersistentDiskSection } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { AzurePersistentDiskInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AzurePersistentDiskInput';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface AzurePersistentDiskSectionProps {
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: AzurePdType;
  updatePersistentDiskSize: (size: number) => void;
  updatePersistentDiskType: (type: SharedPdType) => void;
  setViewMode: () => void;
}

export const AzurePersistentDiskSection = (props: AzurePersistentDiskSectionProps) => {
  const {
    setViewMode,
    persistentDiskType,
    persistentDiskSize,
    updatePersistentDiskType,
    updatePersistentDiskSize,
    persistentDiskExists,
  } = props;

  return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
    AboutPersistentDiskSection({ setViewMode }),
    AzurePersistentDiskInput({
      persistentDiskType,
      persistentDiskSize,
      onChangePersistentDiskType: updatePersistentDiskType,
      onChangePersistentDiskSize: updatePersistentDiskSize,
      persistentDiskExists,
    }),
  ]);
};
