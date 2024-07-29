import { TooltipTrigger } from '@terra-ui-packages/components';
import { DiskType } from '@terra-ui-packages/leonardo-data-client';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import {
  PersistentDiskTypeInput,
  PersistentDiskTypeInputProps,
} from 'src/analysis/modals/ComputeModal/PersistentDiskTypeInput';

export interface PersistentDiskTypeContainerProps<T extends DiskType, Option extends { value: T; label: string }>
  extends Pick<PersistentDiskTypeInputProps<T, Option>, 'options' | 'value' | 'onChange'> {
  persistentDiskExists: boolean;
}

// TODO: Move into the AzurePersistentDiskInput component
// Is there an easy way to remove the duplicate PersistentDiskTypeInputs while
// keeping the correct functionality and appearance?
export const PersistentDiskTypeInputContainer = <T extends DiskType, Option extends { value: T; label: string }>(
  props: PersistentDiskTypeContainerProps<T, Option>
): ReactNode => {
  const { persistentDiskExists, value, onChange, options } = props;
  return persistentDiskExists
    ? h(
        TooltipTrigger,
        {
          content: [
            'You already have a persistent disk in this workspace. ',
            'Disk type can only be configured at creation time. ',
            'Please delete the existing disk before selecting a new type.',
          ],
          side: 'bottom',
        },
        [
          h(PersistentDiskTypeInput<T, Option>, {
            isDisabled: persistentDiskExists,
            onChange,
            options,
            value,
          }),
        ]
      )
    : h(PersistentDiskTypeInput<T, Option>, {
        isDisabled: persistentDiskExists,
        onChange,
        options,
        value,
      });
};
