import { img } from 'react-hyperscript-helpers';
import { getUser } from 'src/libs/state';

const ProfilePicture = ({ size, style, ...props } = {}) => {
  // Note Azure logins don't currently have an imageUrl, so don't render anything.
  // See TOAZ-147 to support this in the future.
  const imageUrl = getUser().imageUrl;
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
