import { abandonedPromise } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { isRequesterPaysErrorInfo } from 'src/libs/ajax/google-storage-models';
import { forwardRefWithName } from 'src/libs/react-utils';
import { requesterPaysProjectStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { RequesterPaysModal } from 'src/workspaces/common/requester-pays/RequesterPaysModal';

// Returns true if the error object passed in was marked as a requester pays error. Note that this parsing of the
// error response is done in checkRequesterPaysError, which is used by the GoogleStorage ajax library.
export const isBucketErrorRequesterPays = (error) => {
  return isRequesterPaysErrorInfo(error) && error.requesterPaysError;
};

export const withRequesterPaysHandler = _.curry((handler, fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    if (isBucketErrorRequesterPays(error)) {
      handler();
      return abandonedPromise();
    }
    throw error;
  }
});

export const requesterPaysWrapper =
  ({ onDismiss }) =>
  (WrappedComponent) => {
    return forwardRefWithName('requesterPaysWrapper', (props, ref) => {
      const [showModal, setShowModal] = useState(false);

      return Utils.cond(
        [
          showModal,
          () =>
            h(RequesterPaysModal, {
              onDismiss: () => onDismiss(props),
              onSuccess: (selectedGoogleProject) => {
                requesterPaysProjectStore.set(selectedGoogleProject);
                setShowModal(false);
              },
            }),
        ],
        () =>
          h(WrappedComponent, {
            ref,
            ...props,
            onRequesterPaysError: () => setShowModal(true),
          })
      );
    });
  };
