import { SingleValue } from 'react-select';

import { IComputeConfig, PdSelectOption, SharedPdType } from './disk-utils';
import { Select } from './Select';

export interface PersistentDiskTypeInputProps {
  value: SharedPdType;
  onChange: (e: SingleValue<{ value: SharedPdType; label: string | undefined }>) => void;
  isDisabled?: boolean;
  options: PdSelectOption[];
}

export const PersistentDiskTypeSelect = Select as typeof Select<IComputeConfig['persistentDiskType']>;
