import { div, h, label } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { computeStyles } from 'src/pages/workspaces/workspace/analysis/modals/modalStyles';

export interface AboutPersistentDiskSectionProps {
  onClick: () => void;
}

export const AboutPersistentDiskSection: React.FC<AboutPersistentDiskSectionProps> = (props) => {
  const { onClick } = props;
  return div({ style: { display: 'flex', flexDirection: 'column' } }, [
    label({ style: computeStyles.label }, ['Persistent disk']),
    div({ style: { marginTop: '0.5rem' } }, [
      'Persistent disks store analysis data. ',
      h(
        Link,
        {
          onClick,
        },
        [
          'Learn more about persistent disks and where your disk is mounted.',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
        ]
      ),
    ]),
  ]);
};
