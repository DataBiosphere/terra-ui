import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import Modal from 'src/components/Modal';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';

const CookieRejectModal = () => {
  const { cookiesAccepted } = useStore(authStore);
  return (
    cookiesAccepted === false &&
    h(
      Modal,
      {
        title: 'Cookies are required for Terra',
        showCancel: false,
        showX: false,
        shouldCloseOnOverlayClick: false,
        shouldCloseOnEsc: false,
        onDismiss: () => authStore.update(_.set('cookiesAccepted', true)),
      },
      ['By clicking OK, you agree to use cookies in Terra.']
    )
  );
};

export default CookieRejectModal;
