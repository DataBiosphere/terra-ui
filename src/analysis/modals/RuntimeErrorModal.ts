import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { cloudProviders } from 'src/analysis/utils/runtime-utils';
import { spinnerOverlay } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { useOnMount } from 'src/libs/react-utils';
import { withBusyState } from 'src/libs/utils';

export const RuntimeErrorModal = ({ runtime, onDismiss }) => {
  const [error, setError] = useState('');
  const [userscriptError, setUserscriptError] = useState(false);
  const [loadingRuntimeDetails, setLoadingRuntimeDetails] = useState(false);

  const loadRuntimeError = _.flow(
    withErrorReporting('Could Not Retrieve Cloud Environment Error Info'),
    withBusyState(setLoadingRuntimeDetails)
  )(async () => {
    const { errors: runtimeErrors } =
      runtime.cloudContext.cloudProvider === cloudProviders.azure.label
        ? await Ajax().Runtimes.runtimeV2(runtime.workspaceId, runtime.runtimeName).details()
        : await Ajax().Runtimes.runtime(runtime.googleProject, runtime.runtimeName).details();
    if (_.some(({ errorMessage }) => errorMessage.includes('Userscript failed'), runtimeErrors)) {
      setError(
        await Ajax()
          .Buckets.getObjectPreview(
            runtime.googleProject,
            runtime.asyncRuntimeFields.stagingBucket,
            'userscript_output.txt',
            true
          )
          .then((res) => res.text())
      );
      setUserscriptError(true);
    } else {
      setError(
        runtimeErrors && runtimeErrors.length > 0
          ? runtimeErrors[0].errorMessage
          : 'An unknown error has occurred with the runtime'
      );
    }
  });

  useOnMount(() => {
    loadRuntimeError();
  });

  return h(
    Modal,
    {
      title: `Cloud Environment is in error state${userscriptError ? ' due to Userscript Error' : ''}`,
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
        [error]
      ),
      loadingRuntimeDetails && spinnerOverlay,
    ]
  );
};
