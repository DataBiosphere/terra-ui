import { div } from 'react-hyperscript-helpers';
import { SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';
import { CloudProvider } from 'src/libs/workspace-utils';
import { AboutPersistentDiskSection } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { GCPPersistentDiskInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/GCPPersistentDiskInput';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface GcpPersistentDiskSectionProps {
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: SharedPdType;
  updatePersistentDiskSize: (size: number) => void;
  updatePersistentDiskType: (type: SharedPdType) => void;
  setViewMode: () => void;
  cloudPlatform: CloudProvider;
}

export const GCPPersistentDiskSection = (props: GcpPersistentDiskSectionProps) => {
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
    GCPPersistentDiskInput({
      persistentDiskType,
      persistentDiskSize,
      onChangePersistentDiskType: updatePersistentDiskType,
      onChangePersistentDiskSize: updatePersistentDiskSize,
      persistentDiskExists,
    }),
  ]);
};
