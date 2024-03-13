import { ClickableProps, Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { notify } from 'src/libs/notifications';
import { authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

interface UnlinkFenceAccountProps extends ClickableProps {
  linkText: string;
  provider: { key: string; name: string };
}

export const UnlinkFenceAccount = ({ linkText, provider }: UnlinkFenceAccountProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);

  return div({ style: { display: 'inline-flex' } }, [
    h(
      Link,
      {
        onClick: () => {
          setIsModalOpen(true);
        },
      },
      [linkText]
    ),
    isModalOpen &&
      h(
        Modal,
        {
          title: 'Confirm unlink account',
          onDismiss: () => setIsModalOpen(false),
          okButton: h(
            ButtonPrimary,
            {
              onClick: _.flow(
                withErrorReporting('Error unlinking account'),
                Utils.withBusyState(setIsUnlinking)
              )(async () => {
                await Ajax().User.unlinkFenceAccount(provider.key);
                authStore.update(_.set(['fenceStatus', provider.key], {}));
                setIsModalOpen(false);
                notify('success', 'Successfully unlinked account', {
                  message: `Successfully unlinked your account from ${provider.name}`,
                  timeout: 30000,
                });
              }),
            },
            ['OK']
          ),
        },
        [
          div([`Are you sure you want to unlink from ${provider.name}?`]),
          div({ style: { marginTop: '1rem' } }, [
            'You will lose access to any underlying datasets. You can always re-link your account later.',
          ]),
          isUnlinking && spinnerOverlay,
        ]
      ),
  ]);
};
