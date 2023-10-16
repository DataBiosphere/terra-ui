import { TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Select } from 'src/components/common';
import { getRegionLabel } from 'src/libs/azure-utils';
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates';

interface ManagedApplicationSelectProps {
  value: AzureManagedAppCoordinates | null;
  allManagedApps: AzureManagedAppCoordinates[];
  id: string;
  isDisabled: boolean;
  onChange: (AzureManagedAppCoordinates) => void;
}

export const ManagedApplicationSelect = (props: ManagedApplicationSelectProps) => {
  const maxMrgLength = 35;
  const isMrgTooLong = (app: AzureManagedAppCoordinates) => app.managedResourceGroupId.length > maxMrgLength;
  const mrgTooLongTooltip = (app: AzureManagedAppCoordinates) =>
    isMrgTooLong(app)
      ? `The Managed Resource Group name "${app.managedResourceGroupId}" is ${app.managedResourceGroupId.length} characters long. This exceeds the maximum allowed length of ${maxMrgLength}.`
      : '';

  const onFocusAria = ({ focused, isDisabled }) => {
    return `${isDisabled ? 'Disabled option ' : 'Option '}${focused['aria-label']}, focused.`;
  };

  const onChangeAria = ({ value }) => {
    return !value ? '' : `Option ${value['aria-label']} selected.`;
  };

  return h(Select as typeof Select<AzureManagedAppCoordinates>, {
    id: props.id,
    placeholder: 'Select a managed application',
    isMulti: false,
    isDisabled: props.isDisabled,
    value: props.value || null,
    ariaLiveMessages: { onFocus: onFocusAria, onChange: onChangeAria },
    onChange: (option) => {
      props.onChange(option!.value);
    },
    // label is declared as string or unknown
    // @ts-ignore
    options: _.map(
      (app: AzureManagedAppCoordinates) => ({
        'aria-label': `Deployment "${app.applicationDeploymentName}" in region "${getRegionLabel(app.region)}" ${
          isMrgTooLong(app) ? `. ${mrgTooLongTooltip(app)}` : ''
        }`,
        label: h(
          TooltipTrigger,
          {
            content: mrgTooLongTooltip(app),
            side: 'left',
          },
          [
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              app.region
                ? `${app.applicationDeploymentName} (${getRegionLabel(app.region)})`
                : app.applicationDeploymentName,
            ]),
          ]
        ),
        value: app,
        isDisabled: isMrgTooLong(app),
      }),
      props.allManagedApps
    ),
  });
};
