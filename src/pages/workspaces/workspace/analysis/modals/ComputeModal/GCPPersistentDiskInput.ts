import { div } from 'react-hyperscript-helpers';
import { GCPPersistentDiskOptions, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';
import { GCPPersistentDiskSizeNumberInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/GCPPersistentDiskSizeNumberInput';
import { PersistentDiskTypeInputContainer } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';

export interface GCPPersistentDiskInputProps {
  persistentDiskType: SharedPdType;
  persistentDiskSize: number;
  onChangePersistentDiskType: (e: SharedPdType) => void;
  onChangePersistentDiskSize: (e: number) => void;
  persistentDiskExists: boolean;
}

export const GCPPersistentDiskInput = (props: GCPPersistentDiskInputProps) => {
  const {
    persistentDiskType,
    persistentDiskSize,
    onChangePersistentDiskSize,
    onChangePersistentDiskType,
    persistentDiskExists,
  } = props;

  const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' };

  return div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 5.5rem', marginTop: '0.75rem' } }, [
    PersistentDiskTypeInputContainer({
      persistentDiskExists,
      value: persistentDiskType,
      onChange: (e) => onChangePersistentDiskType(e.value),
      options: GCPPersistentDiskOptions,
    }),
    GCPPersistentDiskSizeNumberInput({
      persistentDiskSize,
      isDisabled: persistentDiskExists,
      onChangePersistentDiskSize,
    }),
  ]);
};
