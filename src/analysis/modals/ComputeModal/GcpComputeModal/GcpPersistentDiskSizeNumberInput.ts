import { useUniqueId } from '@terra-ui-packages/components';
import { div, h, label } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { NumberInput } from 'src/components/input';

export interface GcpPersistentDiskSizeNumberInputProps {
  persistentDiskSize: number;
  isDisabled: boolean;
  onChangePersistentDiskSize: (size: number) => void;
}

export const GcpPersistentDiskSizeNumberInput: React.FC<GcpPersistentDiskSizeNumberInputProps> = (
  props: GcpPersistentDiskSizeNumberInputProps
) => {
  const { persistentDiskSize, isDisabled, onChangePersistentDiskSize } = props;

  const diskSizeId = useUniqueId();

  return h(div, [
    label({ htmlFor: diskSizeId, style: computeStyles.label }, ['Disk Size (GB)']),
    div({ style: { width: 75, marginTop: '0.5rem' } }, [
      h(NumberInput, {
        id: diskSizeId,
        min: 10,
        max: 64000,
        isClearable: false,
        onlyInteger: true,
        value: persistentDiskSize,
        disabled: isDisabled,
        onChange: onChangePersistentDiskSize,
      }),
    ]),
  ]);
};
