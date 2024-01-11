import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { fixedSpinnerOverlay } from 'src/components/common';
import { useRoute } from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { Disabled } from 'src/pages/Disabled';
import SignIn from 'src/pages/SignIn';
import { Register } from 'src/registration/Register';
import { TermsOfServicePage } from 'src/registration/terms-of-service/TermsOfServicePage';

const AuthContainer = ({ children }) => {
  const { name, public: isPublic } = useRoute();
  const { signInStatus, terraUserAllowances } = useStore(authStore);
  const userIsDisabled = signInStatus === 'userLoaded' && terraUserAllowances.details.enabled === false;
  const userMustRegister = signInStatus === 'unregistered';
  const displayTosPage =
    signInStatus === 'userLoaded' &&
    terraUserAllowances.details.enabled === true &&
    terraUserAllowances.details.termsOfService === false;
  const authspinner = () => fixedSpinnerOverlay;

  return Utils.cond<ReactNode>(
    [signInStatus === 'uninitialized' && !isPublic, authspinner],
    [signInStatus === 'signedOut' && !isPublic, () => h(SignIn)],
    [userMustRegister, () => h(Register)],
    [displayTosPage && name !== 'privacy', () => h(TermsOfServicePage)],
    [userIsDisabled, () => h(Disabled)],
    () => children
  );
};

export default AuthContainer;
