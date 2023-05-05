import { div, h, label } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { handleLearnMoreAboutPersistentDisk } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal/persistent-disk-controls';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface AboutPersistentDiskSectionProps {
  setViewMode: () => void;
}

export const AboutPersistentDiskSection = (props) => {
  const { setViewMode } = props;
  return div({ style: { display: 'flex', flexDirection: 'column' } }, [
    label({ style: computeStyles.label }, ['Persistent disk']),
    div({ style: { marginTop: '0.5rem' } }, [
      'Persistent disks store analysis data. ',
      h(
        Link,
        {
          onClick: () => handleLearnMoreAboutPersistentDisk({ setViewMode }),
        },
        ['Learn more about persistent disks and where your disk is mounted.']
      ),
    ]),
  ]);
};
