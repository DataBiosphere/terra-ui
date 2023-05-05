import { div } from 'react-hyperscript-helpers';
import { AzurePdType, AzurePersistentDiskOptions } from 'src/libs/ajax/leonardo/models/disk-models';
import { AzurePersistentDiskSizeSelectInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/AzurePersistentDiskSizeSelectInput';
import { PersistentDiskTypeInputContainer } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';

export interface AzurePersistentDiskInputProps {
  persistentDiskType: AzurePdType;
  persistentDiskSize: number;
  onChangePersistentDiskType: (e: any) => void;
  onChangePersistentDiskSize: (e: any) => void;
  persistentDiskExists: boolean;
}

export const AzurePersistentDiskInput = (props: AzurePersistentDiskInputProps) => {
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
      value: persistentDiskType?.value,
      onChange: (e) => onChangePersistentDiskType(e),
      options: AzurePersistentDiskOptions,
    }),
    AzurePersistentDiskSizeSelectInput({
      persistentDiskSize,
      onChangePersistentDiskSize,
      persistentDiskExists,
    }),
  ]);
};
