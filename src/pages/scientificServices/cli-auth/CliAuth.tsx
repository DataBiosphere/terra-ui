import React from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import colors from 'src/libs/colors';

export const CliAuth = () => {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const queryParams = new URLSearchParams(queryString);
  const authCode = queryParams.get('code');

  return (
    <div style={{ width: '525px', alignItems: 'center', margin: 'auto', padding: '2rem' }}>
      <img
        src='src/images/brands/scientificServices/dspLogo.svg'
        alt='Broad Institute Data Sciences Platform'
        style={{ width: '200px', alignItems: 'center', margin: 'auto', display: 'block', marginBottom: '2rem' }}
      />
      <h1>Sign in to the terralab CLI</h1>
      <div style={{ margin: '2rem 0' }}>
        You have reached this page because you ran{' '}
        <code style={{ backgroundColor: '#eee', padding: '0.1rem', borderRadius: '4px' }}>terralab login</code> from
        this or another machine. If this is not the case, close this tab.
      </div>
      <div style={{ margin: '2rem 0' }}>
        Enter the following verification code in the terralab CLI. This is a credential{' '}
        <span style={{ fontWeight: 'bold' }}>similar to your password</span> and should not be shared with others.
      </div>
      {authCode ? (
        <>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '1rem 0',
                backgroundColor: '#f0f0f0',
                padding: '1rem',
                marginBottom: '2rem',
                overflow: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              <code>{authCode}</code>
            </div>
            <div
              style={{
                position: 'absolute',
                top: '0rem',
                right: 0,
                bottom: '0rem',
                width: '20px',
                background: 'linear-gradient(to right, transparent, #e0e0e0)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <ClipboardButton
            style={{
              border: `1px solid ${colors.accent(1.2)}`,
              backgroundColor: colors.accent(),
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
            text={authCode}
          >
            Copy
          </ClipboardButton>
        </>
      ) : (
        <div style={{ color: colors.danger(), fontWeight: 'bold' }}>
          Error: no verification code found. Please try again and{' '}
          <a
            href='mailto:scientific-services-support@broadinstitute.org'
            style={{ color: colors.danger(), textDecoration: 'underline' }}
          >
            contact support
          </a>{' '}
          if this problem persists.
        </div>
      )}
      <div style={{ margin: '2rem 0' }}>You can close this tab when you&apos;re done.</div>
    </div>
  );
};
