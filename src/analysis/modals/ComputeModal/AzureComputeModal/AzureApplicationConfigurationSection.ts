import { Icon, Link } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { div, h, label, p } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { InfoBox } from 'src/components/InfoBox';
import * as Utils from 'src/libs/utils';

export const AzureApplicationConfigurationSection = (): ReactNode => {
  return div({ style: computeStyles.whiteBoxContainer }, [
    div({ style: { marginBottom: '1rem' } }, [
      label({ style: computeStyles.label }, ['Application configuration']),
      h(InfoBox, { style: { marginLeft: '0.5rem' } }, ['Currently, the Azure VM is pre-configured.']),
    ]),
    p(['Azure Data Science Virtual Machine']),
    div([
      h(
        Link,
        {
          href: 'https://azure.microsoft.com/en-us/services/virtual-machines/data-science-virtual-machines/#product-overview',
          ...Utils.newTabLinkProps,
        },
        [
          'Learn more about Azure Data Science VMs.',
          h(Icon, { icon: 'pop-out', size: 12, style: { marginLeft: '0.25rem' } }),
        ]
      ),
    ]),
  ]);
};
