import { SingleValue } from 'react-select';

import { IComputeConfig } from './disk-utils';
import { Select } from './Select';

export interface AzurePersistentDiskSizeSelectInputProps {
  persistentDiskSize: number;
  onChangePersistentDiskSize: (e: SingleValue<number | undefined>) => void;
  persistentDiskExists: boolean;
}

export const AzurePersistentDiskSizeSelect = Select as typeof Select<IComputeConfig['persistentDiskSize']>;
