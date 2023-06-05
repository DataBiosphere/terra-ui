import { h } from 'react-hyperscript-helpers';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { PersistentDiskTypeInput } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/PersistentDiskTypeInput';

export interface PersistentDiskTypeContainerProps {
  persistentDiskExists: boolean;
  value: any;
  onChange: (e: any) => void;
  options: any;
}

// TODO: Move into the AzurePersistentDiskInput component
// Is there an easy way to remove the duplicate PersistentDiskTypeInputs while
// keeping the correct functionality and appearance?
export const PersistentDiskTypeInputContainer: React.FC<PersistentDiskTypeContainerProps> = (
  props: PersistentDiskTypeContainerProps
) => {
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
          h(PersistentDiskTypeInput, {
            isDisabled: persistentDiskExists,
            onChange,
            options,
            value,
          }),
        ]
      )
    : h(PersistentDiskTypeInput, {
        isDisabled: persistentDiskExists,
        onChange,
        options,
        value,
      });
};
