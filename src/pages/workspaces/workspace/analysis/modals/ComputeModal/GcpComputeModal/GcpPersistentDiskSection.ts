import { div } from 'react-hyperscript-helpers';
import { GcpPersistentDiskOptions, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';
import { CloudProvider } from 'src/libs/workspace-utils';
import { AboutPersistentDiskSection } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { GcpPersistentDiskSizeNumberInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/GcpComputeModal/GcpPersistentDiskSizeNumberInput';
import { PersistentDiskTypeInputContainer } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface GcpPersistentDiskSectionProps {
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: SharedPdType;
  onChangePersistentDiskType: (type: SharedPdType) => void;
  onChangePersistentDiskSize: (size: number) => void;
  onClickAbout: () => void;
  cloudPlatform: CloudProvider;
}

export const GcpPersistentDiskSection: React.FC<GcpPersistentDiskSectionProps> = (
  props: GcpPersistentDiskSectionProps
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
        value: persistentDiskType.value,
        onChange: (e) => onChangePersistentDiskType(e),
        options: GcpPersistentDiskOptions,
      }),
      GcpPersistentDiskSizeNumberInput({
        persistentDiskSize,
        isDisabled: persistentDiskExists,
        onChangePersistentDiskSize,
      }),
    ]),
  ]);
};
