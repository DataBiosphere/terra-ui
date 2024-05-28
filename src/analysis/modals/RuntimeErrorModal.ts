import { Modal, ModalProps } from '@terra-ui-packages/components';
import { useNotificationsFromContext } from '@terra-ui-packages/notifications';
import _ from 'lodash/fp';
import { ReactNode, useEffect, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { LeoRuntimeProvider, RuntimeBasics } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import colors from 'src/libs/colors';
import { withBusyState } from 'src/libs/utils';

export type RuntimeErrorProvider = Pick<LeoRuntimeProvider, 'errorInfo'>;

export const text = {
  error: {
    title: {
      standard: 'Cloud Environment is in error state',
      userScript: 'Cloud Environment is in error state due to Userscript Error',
    },
    unknown: 'An unknown error has occurred with the runtime',
    cantRetrieve: 'Could Not Retrieve Cloud Environment Error Info',
  },
};

export interface RuntimeErrorModalProps {
  runtime: RuntimeBasics;
  onDismiss: ModalProps['onDismiss'];
  errorProvider: RuntimeErrorProvider;
}

export const RuntimeErrorModal = (props: RuntimeErrorModalProps): ReactNode => {
  const { runtime, onDismiss, errorProvider } = props;
  const { withErrorReporting } = useNotificationsFromContext();

  const [errorMessage, setErrorMessage] = useState('');
  const [userscriptError, setUserscriptError] = useState(false);
  const [loadingRuntimeDetails, setLoadingRuntimeDetails] = useState(false);

  useEffect(() => {
    const loadRuntimeError = _.flow(
      withErrorReporting(text.error.cantRetrieve),
      withBusyState(setLoadingRuntimeDetails)
    )(async () => {
      const errorInfo = await errorProvider.errorInfo(runtime);
      if (errorInfo.errorType === 'UserScriptError') {
        setErrorMessage(errorInfo.detail);
        setUserscriptError(true);
      } else {
        setErrorMessage(errorInfo.errors.length > 0 ? errorInfo.errors[0].errorMessage : text.error.unknown);
      }
    });
    loadRuntimeError();
  }, [runtime, withErrorReporting, errorProvider]);

  return h(
    Modal,
    {
      title: userscriptError ? text.error.title.userScript : text.error.title.standard,
      showCancel: false,
      onDismiss,
    },
    [
      div(
        {
          style: {
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            overflowY: 'auto',
            maxHeight: 500,
            background: colors.light(),
          },
        },
        [errorMessage]
      ),
      loadingRuntimeDetails && spinnerOverlay,
    ]
  );
};
