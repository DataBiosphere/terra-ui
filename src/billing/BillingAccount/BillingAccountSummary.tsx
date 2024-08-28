import { Icon, Link } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { BillingAccountStatus, getBillingAccountIconProps } from 'src/billing/utils';
import colors from 'src/libs/colors';
import { contactUsActive } from 'src/libs/state';
import { topBarHeight } from 'src/libs/style';

export interface BillingAccountSummaryProps {
  done: number;
  error: number;
  updating: number;
}

export const BillingAccountSummary = (props: BillingAccountSummaryProps): ReactNode => {
  const { done, error, updating } = props;
  const maybeAddStatus = (status: BillingAccountStatus, count: number): ReactNode => {
    return (
      count > 0 && (
        <div style={{ display: 'float', marginRight: '2rem' }}>
          <div style={{ float: 'left' }}>
            <Icon {...getBillingAccountIconProps(status)} />
          </div>
          <div style={{ float: 'left', marginLeft: '0.5rem' }}>{`${status} (${count})`}</div>
        </div>
      )
    );
  };

  return (
    <div
      style={{
        padding: '0.5rem 2rem 1rem',
        position: 'absolute',
        top: topBarHeight,
        right: '3rem',
        width: '30rem',
        backgroundColor: colors.light(0.5),
        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ padding: '1rem 0' }}>Your billing account is updating...</div>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        {maybeAddStatus('updating', updating)}
        {maybeAddStatus('done', done)}
        {maybeAddStatus('error', error)}
      </div>
      {error > 0 && (
        <div style={{ padding: '1rem 0 0' }}>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          Try again or <Link onClick={() => contactUsActive.set(true)}>contact us regarding unresolved errors</Link>.
        </div>
      )}
    </div>
  );
};
