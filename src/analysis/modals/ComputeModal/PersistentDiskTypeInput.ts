import { useUniqueId } from '@terra-ui-packages/components';
import React from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import { IComputeConfig } from 'src/analysis/modal-utils';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { Select } from 'src/components/common';
import { PdSelectOption, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';

export interface PersistentDiskTypeInputProps {
  value: SharedPdType;
  onChange: (e: { value: SharedPdType; label: string | undefined } | null) => void;
  isDisabled?: boolean;
  options: PdSelectOption[];
}

const PersistentDiskTypeSelect = Select as typeof Select<IComputeConfig['persistentDiskType']>;

export const PersistentDiskTypeInput: React.FC<PersistentDiskTypeInputProps> = (
  props: PersistentDiskTypeInputProps
) => {
  const { value, onChange, isDisabled, options } = props;
  const persistentDiskId = useUniqueId();

  return h(div, [
    label({ htmlFor: persistentDiskId, style: computeStyles.label }, ['Disk Type']),
    div({ style: { marginTop: '0.5rem' } }, [
      h(PersistentDiskTypeSelect, {
        value,
        onChange: (e) => onChange(e),
        isDisabled,
        options,
        id: persistentDiskId,
        menuPlacement: 'auto',
      }),
    ]),
  ]);
};
