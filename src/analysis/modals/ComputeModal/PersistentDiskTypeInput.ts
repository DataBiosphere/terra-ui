import { Select, SelectProps, useUniqueId } from '@terra-ui-packages/components';
import { DiskType } from '@terra-ui-packages/leonardo-data-client';
import { ReactNode } from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import { IComputeConfig } from 'src/analysis/modal-utils';
import { computeStyles } from 'src/analysis/modals/modalStyles';

type PersistentDiskTypeSelectProps<
  T extends IComputeConfig['persistentDiskType'],
  Option extends { value: T; label: string }
> = SelectProps<T, false, Option>;

export interface PersistentDiskTypeInputProps<T extends DiskType, Option extends { value: T; label: string }>
  extends Pick<PersistentDiskTypeSelectProps<T, Option>, 'isDisabled' | 'options' | 'value'> {
  onChange: (selectedOption: Option | null) => void;
}

export const PersistentDiskTypeInput = <T extends DiskType, Option extends { value: T; label: string }>(
  props: PersistentDiskTypeInputProps<T, Option>
): ReactNode => {
  const { value, onChange, isDisabled, options } = props;
  const persistentDiskId = useUniqueId();

  return h(div, [
    label({ htmlFor: persistentDiskId, style: computeStyles.label }, ['Disk Type']),
    div({ style: { marginTop: '0.5rem' } }, [
      h(Select<T, false, Option>, {
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
