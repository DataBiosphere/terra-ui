import ReactJson from '@microlink/react-json-view';
import React, { useEffect, useState } from 'react';
import { FullyQualifiedResourceId } from 'src/libs/ajax/SamResources';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import { ResourceTypeSummaryProps } from 'src/support/SupportResourceType';

export interface SupportSummaryProps extends ResourceTypeSummaryProps {
  loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Promise<object>;
}

export const SupportSummary = (props: SupportSummaryProps) => {
  const [summaryInfo, setSummaryInfo] = useState<object>();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const resourceId = props.fqResourceId.resourceId;
  const fqResourceId = props.fqResourceId;
  const loadSupportSummaryFn = props.loadSupportSummaryFn;

  function clear() {
    setErrorMessage('');
    setSummaryInfo(undefined);
  }

  useEffect(() => {
    const loadSummary = async () => {
      clear();
      if (resourceId) {
        try {
          setSummaryInfo(await loadSupportSummaryFn(fqResourceId));
        } catch (e) {
          if (e instanceof Response && e.status === 404) {
            setErrorMessage('Group not found');
          } else if (e instanceof Response && e.status === 403) {
            setErrorMessage('You do not have permission to view summary information or are not on VPN');
          } else {
            await reportError('Error loading group summary', e);
          }
        }
      }
    };

    loadSummary();
  }, [fqResourceId, resourceId, loadSupportSummaryFn]);

  return (
    <>
      {!!errorMessage && <div style={{ color: colors.danger(), marginLeft: '1rem' }}>{errorMessage}</div>}
      {!!summaryInfo && (
        <>
          <div
            style={{
              color: colors.dark(),
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              marginLeft: '1rem',
              marginTop: '1rem',
            }}
          >
            {props.displayName} Summary
          </div>
          <ReactJson
            src={summaryInfo}
            name={false}
            style={{ marginLeft: '1rem', border: '1px solid black', padding: '1rem' }}
          />
        </>
      )}
    </>
  );
};
