import { Icon, Link } from '@terra-ui-packages/components';
import { div, h } from 'react-hyperscript-helpers';
import { getBillingAccountIconProps } from 'src/billing/utils';
import colors from 'src/libs/colors';
import { contactUsActive } from 'src/libs/state';
import { topBarHeight } from 'src/libs/style';

export const BillingAccountSummary = ({ counts: { done, error, updating } }) => {
  const StatusAndCount = ({ status, count }) =>
    div({ style: { display: 'float' } }, [
      div({ style: { float: 'left' } }, [Icon(getBillingAccountIconProps(status))]),
      div({ style: { float: 'left', marginLeft: '0.5rem' } }, [`${status} (${count})`]),
    ]);

  const maybeAddStatus = (status, count) => count > 0 && div({ style: { marginRight: '2rem' } }, [h(StatusAndCount, { status, count })]);

  return div(
    {
      style: {
        padding: '0.5rem 2rem 1rem',
        position: 'absolute',
        top: topBarHeight,
        right: '3rem',
        width: '30rem',
        backgroundColor: colors.light(0.5),
        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
      },
    },
    [
      div({ style: { padding: '1rem 0' } }, 'Your billing account is updating...'),
      div({ style: { display: 'flex', justifyContent: 'flex-start' } }, [
        maybeAddStatus('updating', updating),
        maybeAddStatus('done', done),
        maybeAddStatus('error', error),
      ]),
      error > 0 &&
        div({ style: { padding: '1rem 0 0' } }, [
          'Try again or ',
          h(Link, { onClick: () => contactUsActive.set(true) }, ['contact us regarding unresolved errors']),
          '.',
        ]),
    ]
  );
};
