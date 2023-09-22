import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { fixedSpinnerOverlay } from 'src/components/common';
import { isAzureUser } from 'src/libs/auth';
import { useRoute } from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore, azurePreviewStore, userStatus } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import AzurePreview from 'src/pages/AzurePreview';
import { Disabled } from 'src/pages/Disabled';
import Register from 'src/pages/Register';
import SignIn from 'src/pages/SignIn';
import TermsOfService from 'src/pages/TermsOfService';

const AuthContainer = ({ children }) => {
  const { name, public: isPublic } = useRoute();
  const { isSignedIn, registrationStatus, termsOfService, profile } = useStore(authStore);
  const displayTosPage = isSignedIn === true && (termsOfService as any).permitsSystemUsage === false;
  const seenAzurePreview = useStore(azurePreviewStore) || false;
  const authspinner = () => fixedSpinnerOverlay;

  return Utils.cond<ReactNode>(
    [isSignedIn === undefined && !isPublic, authspinner],
    [isSignedIn === false && !isPublic, () => h(SignIn)],
    [seenAzurePreview === false && isAzureUser(), () => h(AzurePreview)],
    [registrationStatus === undefined && !isPublic, authspinner],
    [registrationStatus === userStatus.unregistered, () => h(Register)],
    [displayTosPage && name !== 'privacy', () => h(TermsOfService)],
    [registrationStatus === userStatus.disabled, () => h(Disabled)],
    [_.isEmpty(profile) && !isPublic, authspinner],
    () => children
  );
};

export default AuthContainer;
