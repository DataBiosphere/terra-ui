import { icon, Link, Select, useUniqueId } from '@terra-ui-packages/components';
import { CSSProperties, ReactNode } from 'react';
import { div, h, label, span } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { azureMachineTypes, getMachineTypeLabel, machineTypeHasGpu } from 'src/libs/azure-utils';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

export interface AzureComputeProfileSelectProps {
  disabled?: boolean;
  machineType: string;
  machineTypeOptions?: string[];
  style?: CSSProperties;
  onChangeMachineType: (machineType: string) => void;
}

export const AzureComputeProfileSelect = (props: AzureComputeProfileSelectProps): ReactNode => {
  const {
    disabled = false,
    machineType,
    machineTypeOptions = Object.keys(azureMachineTypes),
    style,
    onChangeMachineType,
  } = props;

  const id = useUniqueId();

  return div({ style }, [
    div({ style: { marginBottom: '1rem', display: 'flex' } }, [
      label(
        {
          htmlFor: id,
          style: {
            ...computeStyles.label,
            marginRight: '1rem',
          },
        },
        ['Cloud compute profile']
      ),
      h(
        Link,
        {
          href: 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/series/',
          ...Utils.newTabLinkProps,
        },
        ['Learn more about cloud compute profiles.', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
      ),
    ]),
    div({ style: { width: 400 } }, [
      h(Select<AzureComputeProfileSelectProps['machineType']>, {
        id,
        isDisabled: disabled,
        isSearchable: false,
        isClearable: false,
        value: machineType,
        onChange: (selectedOption) => {
          if (selectedOption) {
            onChangeMachineType(selectedOption.value);
          }
        },
        options: machineTypeOptions,
        getOptionLabel: ({ value }) => getMachineTypeLabel(value),
      }),
    ]),
    machineTypeHasGpu(machineType) &&
      div({ style: { display: 'flex', marginTop: '.5rem' } }, [
        icon('warning-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
        div([
          span({ style: { marginRight: '0.5rem' } }, ['This VM is powered by an NVIDIA GPU; availability may vary.']),
          h(
            Link,
            {
              style: { marginRight: '0.25rem' },
              href: 'https://support.terra.bio/hc/en-us/articles/16921184286491-How-to-use-GPUs-in-a-notebook-Azure-',
              ...Utils.newTabLinkProps,
            },
            ['Learn more about enabling GPUs.', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
          ),
        ]),
      ]),
  ]);
};
