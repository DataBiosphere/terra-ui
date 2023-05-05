import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';

// TODO: Where should this live? Should this be in the modal container?
export const handleLearnMoreAboutPersistentDisk = ({ setViewMode }) => {
  setViewMode('aboutPersistentDisk');
  Ajax().Metrics.captureEvent(Events.aboutPersistentDiskView);
};
