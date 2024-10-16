import { Icon, Link } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { br, div, h, p } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { getCurrentMountDirectory, RuntimeToolLabel } from 'src/analysis/utils/tool-utils';
import TitleBar from 'src/components/TitleBar';
import * as Utils from 'src/libs/utils';

export interface PersistentDiskAboutProps {
  titleId: string;
  tool: RuntimeToolLabel;
  onDismiss: () => void;
  onPrevious: () => void;
}

export const AboutPersistentDiskView = (props: PersistentDiskAboutProps): ReactNode => {
  const { titleId, tool, onDismiss, onPrevious } = props;
  return div({ style: computeStyles.drawerContent }, [
    h(TitleBar, {
      id: titleId,
      title: 'About persistent disk',
      style: computeStyles.titleBar,
      titleChildren: [],
      hideCloseButton: true,
      onDismiss,
      onPrevious,
    }),
    div({ style: { lineHeight: 1.5 } }, [
      p([
        'Your persistent disk is mounted in the directory ',
        ...getCurrentMountDirectory(tool),
        br(),
        'Please save your analysis data in this directory to ensure it’s stored on your disk.',
      ]),
      p([
        'Terra attaches a persistent disk (PD) to your cloud compute in order to provide an option to keep the data on the disk after you delete your compute. PDs also act as a safeguard to protect your data in the case that something goes wrong with the compute.',
      ]),
      p([
        'A minimal cost per hour is associated with maintaining the disk even when the cloud compute is paused or deleted.',
      ]),
      p([
        'If you delete your cloud compute, but keep your PD, the PD will be reattached when creating the next cloud compute.',
      ]),
      h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360047318551', ...Utils.newTabLinkProps }, [
        'Learn more about persistent disks',
        h(Icon, { icon: 'pop-out', size: 12, style: { marginLeft: '0.25rem' } }),
      ]),
    ]),
  ]);
};
