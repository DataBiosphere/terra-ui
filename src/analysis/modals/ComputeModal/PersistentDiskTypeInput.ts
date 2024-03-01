import { PersistentDiskTypeInputProps, PersistentDiskTypeSelect, useUniqueId } from '@terra-ui-packages/components';
import React from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';

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
