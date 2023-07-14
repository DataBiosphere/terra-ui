import { div, h, label } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';

export interface AboutPersistentDiskSectionProps {
  onClick: () => void;
}

export const AboutPersistentDiskSection: React.FC<AboutPersistentDiskSectionProps> = (props) => {
  const { onClick } = props;
  return div([
    label({ style: computeStyles.label }, ['Persistent disk']),
    div({ style: { marginTop: '0.5rem' } }, [
      'Persistent disks store analysis data.',
      h(
        Link,
        {
          onClick,
          style: { marginLeft: '0.5rem' },
        },
        [
          'Learn more about persistent disks and where your disk is mounted.',
          icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } }),
        ]
      ),
    ]),
  ]);
};
