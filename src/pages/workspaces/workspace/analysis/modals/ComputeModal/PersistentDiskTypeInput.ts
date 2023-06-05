import { div, h, label } from 'react-hyperscript-helpers';
import { SingleValue } from 'react-select';
import { Select } from 'src/components/common';
import { PdSelectOption, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';
import { useUniqueId } from 'src/libs/react-utils';
import { IComputeConfig } from 'src/pages/workspaces/workspace/analysis/modal-utils';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface PersistentDiskTypeInputProps {
  value: SharedPdType;
  onChange: (e: SingleValue<{ value: SharedPdType; label: string | undefined }>) => void;
  isDisabled?: boolean;
  options: PdSelectOption[];
}

const PersistentDiskTypeSelect = Select as typeof Select<IComputeConfig['persistentDiskType']>;

export const PersistentDiskTypeInput = (props: PersistentDiskTypeInputProps) => {
  const { value, onChange, isDisabled, options } = props;
  const persistentDiskId = useUniqueId();

  return h(div, [
    label({ htmlFor: persistentDiskId, style: computeStyles.label }, ['Disk Type']),
    div({ style: { marginTop: '0.5rem' } }, [
      h(PersistentDiskTypeSelect, {
        value,
        onChange: (e) => {
          onChange(e);
        },
        isDisabled,
        options,
        id: persistentDiskId,
        menuPlacement: 'auto',
      }),
    ]),
  ]);
};
