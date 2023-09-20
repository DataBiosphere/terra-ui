import { img } from 'react-hyperscript-helpers';
import { getTerraUser } from 'src/libs/state';

const ProfilePicture = ({ size, style, ...props } = {}) => {
  // Note Azure logins don't currently have an imageUrl, so don't render anything.
  // See TOAZ-147 to support this in the future.
  const imageUrl = getTerraUser().imageUrl;
  return (
    !!imageUrl &&
    img({
      alt: 'Google profile image',
      src: imageUrl,
      height: size,
      width: size,
      style: { borderRadius: '100%', ...style },
      referrerPolicy: 'no-referrer',
      ...props,
    })
  );
};

export default ProfilePicture;
